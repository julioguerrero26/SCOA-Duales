import pool from '../database/pool.js';
import { publicarEvento } from '../events/sse.js';

/**
 * Job de vencimiento de préstamos.
 * Se ejecuta cada hora.
 * 
 * 1. Detecta préstamos activos cuya fecha comprometida ya pasó → los marca como "vencido".
 * 2. Genera avisos de 24h y 12h para préstamos próximos a vencer (idempotente).
 */
export async function procesarVencimientos() {
  console.log(`[CRON] Procesando vencimientos: ${new Date().toISOString()}`);

  try {
    // 1. Marcar préstamos vencidos
    const vencidos = await pool.query(`
      UPDATE prestamos
      SET estado = 'vencido', updated_at = NOW()
      WHERE estado = 'activo'
      AND fecha_devolucion_comprometida < NOW()
      RETURNING id, alumno_id
    `);

    for (const p of vencidos.rows) {
      publicarEvento(p.alumno_id, 'prestamo_vencido', { prestamo_id: p.id });

      await pool.query(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
         VALUES ($1, 'vencimiento', 'Préstamo vencido', 'Tu préstamo ha vencido. Devuelve el equipo lo antes posible.', 'prestamo', $2)`,
        [p.alumno_id, p.id]
      );
    }

    if (vencidos.rows.length > 0) {
      console.log(`[CRON] ${vencidos.rows.length} préstamo(s) marcado(s) como vencido(s).`);
    }

    // 2. Avisos de 24 horas
    const proximos24 = await pool.query(`
      SELECT id, alumno_id FROM prestamos
      WHERE estado = 'activo'
      AND aviso_24h_enviado = false
      AND fecha_devolucion_comprometida <= NOW() + INTERVAL '24 hours'
      AND fecha_devolucion_comprometida > NOW()
    `);

    for (const p of proximos24.rows) {
      await pool.query(
        'UPDATE prestamos SET aviso_24h_enviado = true WHERE id = $1',
        [p.id]
      );

      await pool.query(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
         VALUES ($1, 'aviso_vencimiento', 'Préstamo próximo a vencer (24h)', 'Tu préstamo vence en menos de 24 horas.', 'prestamo', $2)`,
        [p.alumno_id, p.id]
      );

      publicarEvento(p.alumno_id, 'aviso_vencimiento_24h', { prestamo_id: p.id });
    }

    // 3. Avisos de 12 horas
    const proximos12 = await pool.query(`
      SELECT id, alumno_id FROM prestamos
      WHERE estado = 'activo'
      AND aviso_12h_enviado = false
      AND fecha_devolucion_comprometida <= NOW() + INTERVAL '12 hours'
      AND fecha_devolucion_comprometida > NOW()
    `);

    for (const p of proximos12.rows) {
      await pool.query(
        'UPDATE prestamos SET aviso_12h_enviado = true WHERE id = $1',
        [p.id]
      );

      await pool.query(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
         VALUES ($1, 'aviso_vencimiento', 'Préstamo próximo a vencer (12h)', 'Tu préstamo vence en menos de 12 horas. ¡Urgente!', 'prestamo', $2)`,
        [p.alumno_id, p.id]
      );

      publicarEvento(p.alumno_id, 'aviso_vencimiento_12h', { prestamo_id: p.id });
    }

    console.log(`[CRON] Avisos enviados: 24h=${proximos24.rows.length}, 12h=${proximos12.rows.length}`);
  } catch (error) {
    console.error('[CRON] Error procesando vencimientos:', error);
  }
}
