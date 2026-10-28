import pool from '../database/pool.js';
import { publicarEvento } from '../events/sse.js';

// ============================================================
// Transiciones válidas de la FSM de incidencias
// ============================================================
const TRANSICIONES_INCIDENCIA = {
  reportada: ['en_revision', 'rechazada'],
  en_revision: ['asignada'],
  asignada: ['resuelta'],
  resuelta: ['cerrada', 'asignada'],  // Puede reabrirse si persiste
};

function validarTransicion(estadoActual, estadoNuevo) {
  const permitidos = TRANSICIONES_INCIDENCIA[estadoActual];
  if (!permitidos || !permitidos.includes(estadoNuevo)) {
    throw { status: 409, message: `No se puede cambiar de "${estadoActual}" a "${estadoNuevo}".` };
  }
}

/**
 * Crear incidencia (Alumno, Maestro, Directivo).
 */
export async function crearIncidencia(userId, datos) {
  const { titulo, descripcion, ubicacion, categoria, prioridad, incidencia_previa_id } = datos;

  const result = await pool.query(
    `INSERT INTO incidencias (titulo, descripcion, ubicacion, categoria, prioridad, reportada_por, incidencia_previa_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [titulo, descripcion, ubicacion, categoria, prioridad || 'media', userId, incidencia_previa_id]
  );

  return result.rows[0];
}

/**
 * Cambiar estado de incidencia (Directivo).
 */
export async function cambiarEstado(incidenciaId, userId, datos) {
  const { estado, asignada_a, motivo_rechazo } = datos;

  const incidencia = await pool.query('SELECT * FROM incidencias WHERE id = $1', [incidenciaId]);
  if (incidencia.rows.length === 0) {
    throw { status: 404, message: 'Incidencia no encontrada.' };
  }

  const inc = incidencia.rows[0];
  validarTransicion(inc.estado, estado);

  if (estado === 'rechazada' && !motivo_rechazo) {
    throw { status: 400, message: 'El motivo de rechazo es obligatorio.' };
  }

  if (estado === 'asignada' && !asignada_a) {
    throw { status: 400, message: 'Debe especificar a quién se asigna la incidencia.' };
  }

  let query = 'UPDATE incidencias SET estado = $1, updated_at = NOW()';
  const params = [estado];
  let idx = 2;

  if (asignada_a) {
    query += `, asignada_a = $${idx++}`;
    params.push(asignada_a);
  }
  if (motivo_rechazo) {
    query += `, motivo_rechazo = $${idx++}`;
    params.push(motivo_rechazo);
  }
  if (estado === 'resuelta') {
    query += `, fecha_resolucion = NOW()`;
  }
  if (estado === 'cerrada') {
    query += `, fecha_cierre = NOW()`;
  }

  query += ` WHERE id = $${idx++} RETURNING *`;
  params.push(incidenciaId);

  const result = await pool.query(query, params);

  // Notificar al reportante
  publicarEvento(inc.reportada_por, 'incidencia_actualizada', {
    incidencia_id: incidenciaId,
    estado_nuevo: estado,
  });

  return result.rows[0];
}

/**
 * Consultar incidencias según perfil.
 */
export async function consultarIncidencias(userId, perfil, filtros = {}) {
  let query = `
    SELECT i.*,
           r.nombre AS reportante_nombre, r.apellido_paterno AS reportante_apellido,
           a.nombre AS asignado_nombre, a.apellido_paterno AS asignado_apellido
    FROM incidencias i
    JOIN usuarios r ON i.reportada_por = r.id
    LEFT JOIN usuarios a ON i.asignada_a = a.id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  if (perfil === 'alumno' || perfil === 'maestro') {
    query += ` AND i.reportada_por = $${idx++}`;
    params.push(userId);
  }
  // directivo ve todas

  if (filtros.estado) {
    query += ` AND i.estado = $${idx++}`;
    params.push(filtros.estado);
  }

  query += ' ORDER BY i.created_at DESC';

  const result = await pool.query(query, params);
  return result.rows;
}
