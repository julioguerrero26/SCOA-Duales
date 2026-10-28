import bcrypt from 'bcryptjs';
import pool from '../database/pool.js';

const SALT_ROUNDS = 10;

/**
 * Listar todos los usuarios (Directivo).
 */
export async function listarUsuarios({ perfil, activo, page = 1, limit = 20 }) {
  let query = 'SELECT id, email, nombre, apellido_paterno, apellido_materno, perfil, numero_control, carrera, semestre, activo, created_at FROM usuarios WHERE 1=1';
  const params = [];
  let paramIdx = 1;

  if (perfil) {
    query += ` AND perfil = $${paramIdx++}`;
    params.push(perfil);
  }
  if (activo !== undefined) {
    query += ` AND activo = $${paramIdx++}`;
    params.push(activo);
  }

  query += ' ORDER BY created_at DESC';
  query += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(limit, (page - 1) * limit);

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Crear un nuevo usuario (Directivo).
 */
export async function crearUsuario(datos) {
  const { email, password, nombre, apellido_paterno, apellido_materno, perfil, numero_control, carrera, semestre } = datos;

  // Verificar email único
  const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
  if (existe.rows.length > 0) {
    throw { status: 409, message: 'Ya existe un usuario con ese correo electrónico.' };
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO usuarios (email, password_hash, nombre, apellido_paterno, apellido_materno, perfil, numero_control, carrera, semestre)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, email, nombre, apellido_paterno, apellido_materno, perfil, numero_control, carrera, semestre, activo, created_at`,
    [email, password_hash, nombre, apellido_paterno, apellido_materno, perfil, numero_control, carrera, semestre]
  );

  return result.rows[0];
}

/**
 * Actualizar un usuario (Directivo).
 */
export async function actualizarUsuario(id, datos) {
  const { nombre, apellido_paterno, apellido_materno, perfil, carrera, semestre, activo } = datos;

  const result = await pool.query(
    `UPDATE usuarios SET nombre = COALESCE($1, nombre), apellido_paterno = COALESCE($2, apellido_paterno),
     apellido_materno = COALESCE($3, apellido_materno), perfil = COALESCE($4, perfil),
     carrera = COALESCE($5, carrera), semestre = COALESCE($6, semestre),
     activo = COALESCE($7, activo), updated_at = NOW()
     WHERE id = $8
     RETURNING id, email, nombre, apellido_paterno, apellido_materno, perfil, numero_control, carrera, semestre, activo`,
    [nombre, apellido_paterno, apellido_materno, perfil, carrera, semestre, activo, id]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Usuario no encontrado.' };
  }

  return result.rows[0];
}

/**
 * Dar de baja un usuario (marcado lógico).
 */
export async function bajaUsuario(id) {
  const result = await pool.query(
    'UPDATE usuarios SET activo = false, updated_at = NOW() WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Usuario no encontrado.' };
  }

  return { message: 'Usuario dado de baja correctamente.' };
}
