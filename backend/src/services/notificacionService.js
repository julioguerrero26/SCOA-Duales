import pool from '../database/pool.js';

/**
 * Obtener notificaciones de un usuario.
 */
export async function obtenerNotificaciones(userId, soloNoLeidas = false) {
  let query = 'SELECT * FROM notificaciones WHERE usuario_id = $1';
  const params = [userId];

  if (soloNoLeidas) {
    query += ' AND leida = false';
  }

  query += ' ORDER BY created_at DESC LIMIT 50';

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Marcar notificación como leída.
 */
export async function marcarLeida(notificacionId, userId) {
  const result = await pool.query(
    'UPDATE notificaciones SET leida = true WHERE id = $1 AND usuario_id = $2 RETURNING *',
    [notificacionId, userId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Notificación no encontrada.' };
  }

  return result.rows[0];
}

/**
 * Marcar todas como leídas.
 */
export async function marcarTodasLeidas(userId) {
  await pool.query(
    'UPDATE notificaciones SET leida = true WHERE usuario_id = $1 AND leida = false',
    [userId]
  );

  return { message: 'Todas las notificaciones marcadas como leídas.' };
}

/**
 * Contar notificaciones no leídas.
 */
export async function contarNoLeidas(userId) {
  const result = await pool.query(
    'SELECT COUNT(*) AS count FROM notificaciones WHERE usuario_id = $1 AND leida = false',
    [userId]
  );

  return parseInt(result.rows[0].count);
}
