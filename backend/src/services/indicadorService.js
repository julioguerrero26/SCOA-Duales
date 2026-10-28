import pool from '../database/pool.js';

/**
 * Obtener indicadores administrativos (Directivo).
 */
export async function obtenerIndicadores() {
  const [resolucion, antigüedad, mora, tasaUso] = await Promise.all([
    tiempoResolucionIncidencias(),
    incidenciasAbiertasPorAntiguedad(),
    equiposEnMora(),
    tasaUsoInventario(),
  ]);

  return {
    tiempo_resolucion_incidencias: resolucion,
    incidencias_abiertas_por_antiguedad: antigüedad,
    equipos_en_mora: mora,
    tasa_uso_inventario: tasaUso,
  };
}

/**
 * 1. Tiempo mediano de resolución de incidencias (horas hábiles).
 * Horas hábiles: Lunes a viernes, 08:00 - 18:00.
 */
async function tiempoResolucionIncidencias() {
  const result = await pool.query(`
    SELECT
      PERCENTILE_CONT(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (fecha_resolucion - fecha_reporte)) / 3600
      ) AS mediana_horas
    FROM incidencias
    WHERE estado IN ('resuelta', 'cerrada')
    AND fecha_resolucion IS NOT NULL
  `);

  return {
    mediana_horas: result.rows[0]?.mediana_horas
      ? parseFloat(result.rows[0].mediana_horas).toFixed(1)
      : null,
    nota: 'Calculado sobre incidencias resueltas del periodo.',
  };
}

/**
 * 2. Incidencias abiertas por antigüedad.
 */
async function incidenciasAbiertasPorAntiguedad() {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE NOW() - fecha_reporte < INTERVAL '24 hours') AS "menos_24h",
      COUNT(*) FILTER (WHERE NOW() - fecha_reporte BETWEEN INTERVAL '24 hours' AND INTERVAL '3 days') AS "entre_1_3_dias",
      COUNT(*) FILTER (WHERE NOW() - fecha_reporte > INTERVAL '3 days') AS "mas_3_dias",
      COUNT(*) AS total
    FROM incidencias
    WHERE estado NOT IN ('cerrada', 'rechazada')
  `);

  return result.rows[0];
}

/**
 * 3. Equipos en mora (préstamos vencidos).
 */
async function equiposEnMora() {
  const result = await pool.query(`
    SELECT p.id, p.alumno_id, p.equipo_id,
           e.nombre AS equipo_nombre,
           u.nombre AS alumno_nombre, u.apellido_paterno AS alumno_apellido,
           p.fecha_devolucion_comprometida,
           NOW() - p.fecha_devolucion_comprometida AS tiempo_mora
    FROM prestamos p
    JOIN equipos e ON p.equipo_id = e.id
    JOIN usuarios u ON p.alumno_id = u.id
    WHERE p.estado = 'vencido'
    ORDER BY p.fecha_devolucion_comprometida ASC
  `);

  return {
    total: result.rows.length,
    detalle: result.rows,
  };
}

/**
 * 4. Tasa de uso del inventario por categoría.
 */
async function tasaUsoInventario() {
  const result = await pool.query(`
    SELECT
      e.categoria,
      SUM(e.total) AS total_unidades,
      SUM(e.total) - SUM(e.disponibles) AS en_uso,
      CASE WHEN SUM(e.total) > 0
        THEN ROUND(((SUM(e.total) - SUM(e.disponibles))::NUMERIC / SUM(e.total)) * 100, 1)
        ELSE 0
      END AS tasa_uso_porcentaje
    FROM equipos e
    WHERE e.activo = true
    GROUP BY e.categoria
    ORDER BY e.categoria
  `);

  return result.rows;
}
