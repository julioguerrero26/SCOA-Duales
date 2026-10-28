import * as authService from '../services/authService.js';

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    const { token, usuario } = await authService.login(email, password);

    // Configurar cookie HttpOnly, Secure, SameSite=Strict
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 horas
    });

    res.status(200).json({ usuario });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function logout(req, res) {
  res.clearCookie('token');
  res.status(200).json({ message: 'Sesión cerrada.' });
}

export async function perfil(req, res) {
  try {
    const usuario = await authService.obtenerPerfil(req.user.id);
    res.status(200).json(usuario);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}
