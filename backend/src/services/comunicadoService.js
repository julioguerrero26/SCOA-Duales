import pool from '../database/pool.js';
import { publicarEvento } from '../events/sse.js';

/**
 * Crear comunicado (Directivo).
 */
export async function crearComunicado(userId, datos) {
  const { titulo, contenido, filtro_destinatarios } = datos;

  const result = await pool.query(
    `INSERT INTO comunicados (titulo, contenido, creado_por, filtro_destinatarios)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [titulo, contenido, userId, JSON.stringify(filtro_destinatarios || {})]
  );

  const comunicado = result.rows[0];

  // Resolver destinatarios y notificar
  const destinatarios = await resolverDestinatarios(filtro_destinatarios);

  for (const dest of destinatarios) {
    // Crear notificación
    await pool.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
       VALUES ($1, 'comunicado', $2, $3, 'comunicado', $4)`,
      [dest.id, titulo, contenido, comunicado.id]
    );

    // Publicar evento SSE
    publicarEvento(dest.id, 'comunicado', {
      comunicado_id: comunicado.id,
      titulo,
    });
  }

  return comunicado;
}

/**
 * Resolver lista de destinatarios según filtros combinables.
 */
async function resolverDestinatarios(filtros = {}) {
  let query = 'SELECT id FROM usuarios WHERE activo = true';
  const params = [];
  let idx = 1;

  if (filtros.perfil) {
    query += ` AND perfil = $${idx++}`;
    params.push(filtros.perfil);
  }
  if (filtros.carrera) {
    query += ` AND carrera = $${idx++}`;
    params.push(filtros.carrera);
  }
  if (filtros.semestre) {
    query += ` AND semestre = $${idx++}`;
    params.push(filtros.semestre);
  }
  if (filtros.grupo_id) {
    query += ` AND id IN (SELECT alumno_id FROM grupo_alumnos WHERE grupo_id = $${idx++})`;
    params.push(filtros.grupo_id);
  }

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Consultar comunicados según perfil.
 */
export async function consultarComunicados(userId, perfil) {
  if (perfil === 'directivo') {
    const result = await pool.query(`
      SELECT c.*, u.nombre AS autor_nombre, u.apellido_paterno AS autor_apellido
      FROM comunicados c
      JOIN usuarios u ON c.creado_por = u.id
      ORDER BY c.created_at DESC
    `);
    return result.rows;
  }

  // Para alumno/maestro: obtener comunicados donde el usuario es destinatario
  const result = await pool.query(`
    SELECT c.*, u.nombre AS autor_nombre, u.apellido_paterno AS autor_apellido
    FROM comunicados c
    JOIN usuarios u ON c.creado_por = u.id
    WHERE c.publicado = true
    AND EXISTS (
      SELECT 1 FROM notificaciones n
      WHERE n.referencia_tipo = 'comunicado'
      AND n.referencia_id = c.id
      AND n.usuario_id = $1
    )
    ORDER BY c.created_at DESC
  `, [userId]);

  return result.rows;
}
