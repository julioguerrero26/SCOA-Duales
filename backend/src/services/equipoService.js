import pool from '../database/pool.js';

/**
 * Listar equipos con filtro opcional por categoría.
 */
export async function listarEquipos(filtros = {}) {
  let query = 'SELECT * FROM equipos WHERE activo = true';
  const params = [];
  let idx = 1;

  if (filtros.categoria) {
    query += ` AND categoria = $${idx++}`;
    params.push(filtros.categoria);
  }

  query += ' ORDER BY nombre ASC';

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Obtener un equipo por ID.
 */
export async function obtenerEquipo(id) {
  const result = await pool.query('SELECT * FROM equipos WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw { status: 404, message: 'Equipo no encontrado.' };
  }
  return result.rows[0];
}

/**
 * Crear equipo (Directivo).
 */
export async function crearEquipo(datos) {
  const { nombre, descripcion, categoria, marca, modelo, total } = datos;

  const result = await pool.query(
    `INSERT INTO equipos (nombre, descripcion, categoria, marca, modelo, total, disponibles)
     VALUES ($1, $2, $3, $4, $5, $6, $6)
     RETURNING *`,
    [nombre, descripcion, categoria, marca, modelo, total || 0]
  );

  return result.rows[0];
}

/**
 * Actualizar equipo (Directivo).
 */
export async function actualizarEquipo(id, datos) {
  const { nombre, descripcion, categoria, marca, modelo, total } = datos;

  // Si se cambia el total, ajustar disponibles proporcionalmente
  const equipo = await pool.query('SELECT * FROM equipos WHERE id = $1', [id]);
  if (equipo.rows.length === 0) {
    throw { status: 404, message: 'Equipo no encontrado.' };
  }

  const eq = equipo.rows[0];
  let nuevosDisponibles = eq.disponibles;

  if (total !== undefined && total !== eq.total) {
    const diferencia = total - eq.total;
    nuevosDisponibles = eq.disponibles + diferencia;
    if (nuevosDisponibles < 0) {
      throw { status: 409, message: 'No se puede reducir el total por debajo de las unidades en uso.' };
    }
  }

  const result = await pool.query(
    `UPDATE equipos SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion),
     categoria = COALESCE($3, categoria), marca = COALESCE($4, marca), modelo = COALESCE($5, modelo),
     total = COALESCE($6, total), disponibles = $7, updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [nombre, descripcion, categoria, marca, modelo, total, nuevosDisponibles, id]
  );

  return result.rows[0];
}

/**
 * Dar de baja un equipo (marcado lógico).
 */
export async function bajaEquipo(id) {
  const result = await pool.query(
    'UPDATE equipos SET activo = false, updated_at = NOW() WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Equipo no encontrado.' };
  }

  return { message: 'Equipo dado de baja correctamente.' };
}

/**
 * Obtener categorías únicas.
 */
export async function obtenerCategorias() {
  const result = await pool.query(
    'SELECT DISTINCT categoria FROM equipos WHERE activo = true ORDER BY categoria'
  );
  return result.rows.map(r => r.categoria);
}
