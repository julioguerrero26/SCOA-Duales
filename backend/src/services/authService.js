import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/pool.js';

/**
 * Autenticar usuario y generar JWT.
 */
export async function login(email, password) {
  const result = await pool.query(
    'SELECT id, email, password_hash, nombre, apellido_paterno, apellido_materno, perfil, numero_control, carrera, semestre, activo FROM usuarios WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw { status: 401, message: 'Credenciales inválidas.' };
  }

  const usuario = result.rows[0];

  if (!usuario.activo) {
    throw { status: 403, message: 'La cuenta ha sido desactivada.' };
  }

  const passwordValido = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValido) {
    throw { status: 401, message: 'Credenciales inválidas.' };
  }

  const payload = {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    apellido_paterno: usuario.apellido_paterno,
    perfil: usuario.perfil,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  const { password_hash, ...usuarioSinPassword } = usuario;

  return { token, usuario: usuarioSinPassword };
}

/**
 * Obtener perfil del usuario autenticado.
 */
export async function obtenerPerfil(userId) {
  const result = await pool.query(
    'SELECT id, email, nombre, apellido_paterno, apellido_materno, perfil, numero_control, carrera, semestre, activo, created_at FROM usuarios WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Usuario no encontrado.' };
  }

  return result.rows[0];
}
