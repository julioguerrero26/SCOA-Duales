import pool from '../database/pool.js';

/**
 * Obtener horario del alumno.
 */
export async function obtenerHorarioAlumno(alumnoId) {
  const result = await pool.query(`
    SELECT h.dia_semana, h.hora_inicio, h.hora_fin, h.aula,
           g.nombre AS grupo, g.materia,
           u.nombre AS maestro_nombre, u.apellido_paterno AS maestro_apellido
    FROM horarios h
    JOIN grupos g ON h.grupo_id = g.id
    JOIN grupo_alumnos ga ON ga.grupo_id = g.id
    JOIN usuarios u ON g.maestro_id = u.id
    WHERE ga.alumno_id = $1 AND g.activo = true
    ORDER BY h.dia_semana, h.hora_inicio
  `, [alumnoId]);

  return result.rows;
}

/**
 * Obtener horario del maestro (sus grupos).
 */
export async function obtenerHorarioMaestro(maestroId) {
  const result = await pool.query(`
    SELECT h.dia_semana, h.hora_inicio, h.hora_fin, h.aula,
           g.nombre AS grupo, g.materia
    FROM horarios h
    JOIN grupos g ON h.grupo_id = g.id
    WHERE g.maestro_id = $1 AND g.activo = true
    ORDER BY h.dia_semana, h.hora_inicio
  `, [maestroId]);

  return result.rows;
}

/**
 * Obtener todos los horarios (Directivo).
 */
export async function obtenerTodosLosHorarios() {
  const result = await pool.query(`
    SELECT h.dia_semana, h.hora_inicio, h.hora_fin, h.aula,
           g.nombre AS grupo, g.materia,
           u.nombre AS maestro_nombre, u.apellido_paterno AS maestro_apellido
    FROM horarios h
    JOIN grupos g ON h.grupo_id = g.id
    JOIN usuarios u ON g.maestro_id = u.id
    WHERE g.activo = true
    ORDER BY h.dia_semana, h.hora_inicio
  `);

  return result.rows;
}
