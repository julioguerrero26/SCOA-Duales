import jwt from 'jsonwebtoken';

/**
 * Middleware de autenticación JWT.
 * Valida el token JWT de la cookie y adjunta el usuario decodificado a req.user.
 */
export function autenticar(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado. Inicie sesión.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
}

/**
 * Middleware de autorización por perfil.
 * Recibe un array de perfiles permitidos.
 * @param  {...string} perfiles - Perfiles autorizados ('alumno', 'maestro', 'directivo')
 */
export function autorizar(...perfiles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Acceso no autorizado.' });
    }

    if (!perfiles.includes(req.user.perfil)) {
      return res.status(403).json({ error: 'No tiene permisos para esta operación.' });
    }

    next();
  };
}
