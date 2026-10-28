import pool from '../database/pool.js';
import { publicarEvento } from '../events/sse.js';

// ============================================================
// Transiciones válidas de la FSM de préstamos
// ============================================================
const TRANSICIONES_PRESTAMO = {
  solicitado: ['aprobado', 'rechazado', 'cancelado'],
  aprobado: ['activo', 'cancelado'],
  activo: ['devuelto', 'vencido'],
  vencido: ['devuelto', 'extraviado'],
};

/**
 * Validar si una transición de estado es permitida.
 */
function validarTransicion(estadoActual, estadoNuevo) {
  const permitidos = TRANSICIONES_PRESTAMO[estadoActual];
  if (!permitidos || !permitidos.includes(estadoNuevo)) {
    throw { status: 409, message: `No se puede cambiar de "${estadoActual}" a "${estadoNuevo}".` };
  }
}

/**
 * Crear una solicitud de préstamo (Alumno).
 */
export async function crearSolicitud(alumnoId, datos) {
  const { equipo_id, grupo_id, motivo_solicitud, fecha_devolucion_comprometida } = datos;

  // Verificar que el alumno pertenece al grupo
  const pertenece = await pool.query(
    'SELECT id FROM grupo_alumnos WHERE alumno_id = $1 AND grupo_id = $2',
    [alumnoId, grupo_id]
  );
  if (pertenece.rows.length === 0) {
    throw { status: 403, message: 'No pertenece a este grupo.' };
  }

  // Verificar que el equipo existe y está activo
  const equipo = await pool.query(
    'SELECT id, disponibles FROM equipos WHERE id = $1 AND activo = true',
    [equipo_id]
  );
  if (equipo.rows.length === 0) {
    throw { status: 404, message: 'Equipo no encontrado o dado de baja.' };
  }

  if (equipo.rows[0].disponibles <= 0) {
    throw { status: 409, message: 'No hay unidades disponibles de este equipo.' };
  }

  const result = await pool.query(
    `INSERT INTO prestamos (alumno_id, equipo_id, grupo_id, motivo_solicitud, fecha_devolucion_comprometida)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [alumnoId, equipo_id, grupo_id, motivo_solicitud, fecha_devolucion_comprometida]
  );

  // Notificar al maestro del grupo
  const grupo = await pool.query('SELECT maestro_id FROM grupos WHERE id = $1', [grupo_id]);
  if (grupo.rows.length > 0) {
    publicarEvento(grupo.rows[0].maestro_id, 'prestamo_solicitado', {
      prestamo_id: result.rows[0].id,
      alumno_id: alumnoId,
    });
  }

  return result.rows[0];
}

/**
 * Aprobar un préstamo (Maestro).
 * Usa SELECT ... FOR UPDATE para control de concurrencia.
 */
export async function aprobarPrestamo(prestamoId, maestroId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Obtener préstamo con bloqueo
    const prestamo = await client.query(
      'SELECT * FROM prestamos WHERE id = $1 FOR UPDATE',
      [prestamoId]
    );

    if (prestamo.rows.length === 0) {
      throw { status: 404, message: 'Préstamo no encontrado.' };
    }

    const p = prestamo.rows[0];
    validarTransicion(p.estado, 'aprobado');

    // Verificar que el maestro es dueño del grupo
    const grupo = await client.query(
      'SELECT id FROM grupos WHERE id = $1 AND maestro_id = $2',
      [p.grupo_id, maestroId]
    );
    if (grupo.rows.length === 0) {
      throw { status: 403, message: 'No tiene permisos sobre este grupo.' };
    }

    // Bloquear fila del equipo y verificar disponibilidad
    const equipo = await client.query(
      'SELECT id, disponibles FROM equipos WHERE id = $1 FOR UPDATE',
      [p.equipo_id]
    );

    if (equipo.rows[0].disponibles <= 0) {
      throw { status: 409, message: 'No hay unidades disponibles. Rechace la solicitud.' };
    }

    // Decrementar disponibles
    await client.query(
      'UPDATE equipos SET disponibles = disponibles - 1, updated_at = NOW() WHERE id = $1',
      [p.equipo_id]
    );

    // Actualizar préstamo
    const updated = await client.query(
      `UPDATE prestamos SET estado = 'aprobado', aprobado_por = $1, fecha_aprobacion = NOW(), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [maestroId, prestamoId]
    );

    await client.query('COMMIT');

    // Notificar al alumno
    publicarEvento(p.alumno_id, 'prestamo_aprobado', { prestamo_id: prestamoId });

    return updated.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Rechazar un préstamo (Maestro).
 */
export async function rechazarPrestamo(prestamoId, maestroId, motivo_rechazo) {
  if (!motivo_rechazo) {
    throw { status: 400, message: 'El motivo de rechazo es obligatorio.' };
  }

  const prestamo = await pool.query('SELECT * FROM prestamos WHERE id = $1', [prestamoId]);
  if (prestamo.rows.length === 0) {
    throw { status: 404, message: 'Préstamo no encontrado.' };
  }

  const p = prestamo.rows[0];
  validarTransicion(p.estado, 'rechazado');

  // Verificar pertenencia
  const grupo = await pool.query(
    'SELECT id FROM grupos WHERE id = $1 AND maestro_id = $2',
    [p.grupo_id, maestroId]
  );
  if (grupo.rows.length === 0) {
    throw { status: 403, message: 'No tiene permisos sobre este grupo.' };
  }

  const result = await pool.query(
    `UPDATE prestamos SET estado = 'rechazado', motivo_rechazo = $1, aprobado_por = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [motivo_rechazo, maestroId, prestamoId]
  );

  publicarEvento(p.alumno_id, 'prestamo_rechazado', { prestamo_id: prestamoId });

  return result.rows[0];
}

/**
 * Cancelar un préstamo (Alumno).
 */
export async function cancelarPrestamo(prestamoId, alumnoId) {
  const prestamo = await pool.query('SELECT * FROM prestamos WHERE id = $1 AND alumno_id = $2', [prestamoId, alumnoId]);
  if (prestamo.rows.length === 0) {
    throw { status: 404, message: 'Préstamo no encontrado.' };
  }

  const p = prestamo.rows[0];
  validarTransicion(p.estado, 'cancelado');

  // Si estaba aprobado, devolver unidad al inventario
  if (p.estado === 'aprobado') {
    await pool.query(
      'UPDATE equipos SET disponibles = disponibles + 1, updated_at = NOW() WHERE id = $1',
      [p.equipo_id]
    );
  }

  const result = await pool.query(
    `UPDATE prestamos SET estado = 'cancelado', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [prestamoId]
  );

  return result.rows[0];
}

/**
 * Activar un préstamo (entrega física - Maestro).
 */
export async function activarPrestamo(prestamoId, maestroId) {
  const prestamo = await pool.query('SELECT * FROM prestamos WHERE id = $1', [prestamoId]);
  if (prestamo.rows.length === 0) {
    throw { status: 404, message: 'Préstamo no encontrado.' };
  }

  const p = prestamo.rows[0];
  validarTransicion(p.estado, 'activo');

  const grupo = await pool.query(
    'SELECT id FROM grupos WHERE id = $1 AND maestro_id = $2',
    [p.grupo_id, maestroId]
  );
  if (grupo.rows.length === 0) {
    throw { status: 403, message: 'No tiene permisos sobre este grupo.' };
  }

  const result = await pool.query(
    `UPDATE prestamos SET estado = 'activo', fecha_entrega = NOW(), updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [prestamoId]
  );

  publicarEvento(p.alumno_id, 'prestamo_activo', { prestamo_id: prestamoId });

  return result.rows[0];
}

/**
 * Registrar devolución (Maestro/Directivo).
 */
export async function registrarDevolucion(prestamoId, userId, observaciones) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const prestamo = await client.query(
      'SELECT * FROM prestamos WHERE id = $1 FOR UPDATE',
      [prestamoId]
    );

    if (prestamo.rows.length === 0) {
      throw { status: 404, message: 'Préstamo no encontrado.' };
    }

    const p = prestamo.rows[0];
    validarTransicion(p.estado, 'devuelto');

    // Devolver unidad al inventario
    await client.query(
      'UPDATE equipos SET disponibles = disponibles + 1, updated_at = NOW() WHERE id = $1',
      [p.equipo_id]
    );

    const result = await client.query(
      `UPDATE prestamos SET estado = 'devuelto', devuelto_a = $1, fecha_devolucion_real = NOW(),
       observaciones = COALESCE($2, observaciones), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [userId, observaciones, prestamoId]
    );

    await client.query('COMMIT');

    publicarEvento(p.alumno_id, 'prestamo_devuelto', { prestamo_id: prestamoId });

    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Consultar préstamos según perfil.
 */
export async function consultarPrestamos(userId, perfil, filtros = {}) {
  let query = `
    SELECT p.*, 
           u.nombre AS alumno_nombre, u.apellido_paterno AS alumno_apellido,
           e.nombre AS equipo_nombre, e.categoria AS equipo_categoria,
           g.nombre AS grupo_nombre, g.materia AS grupo_materia
    FROM prestamos p
    JOIN usuarios u ON p.alumno_id = u.id
    JOIN equipos e ON p.equipo_id = e.id
    JOIN grupos g ON p.grupo_id = g.id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  if (perfil === 'alumno') {
    query += ` AND p.alumno_id = $${idx++}`;
    params.push(userId);
  } else if (perfil === 'maestro') {
    query += ` AND g.maestro_id = $${idx++}`;
    params.push(userId);
  }
  // directivo ve todos

  if (filtros.estado) {
    query += ` AND p.estado = $${idx++}`;
    params.push(filtros.estado);
  }

  query += ' ORDER BY p.created_at DESC';

  const result = await pool.query(query, params);
  return result.rows;
}
