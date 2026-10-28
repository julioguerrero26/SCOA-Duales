import * as notificacionService from '../services/notificacionService.js';

export async function listar(req, res) {
  try {
    const noLeidas = req.query.no_leidas === 'true';
    const notificaciones = await notificacionService.obtenerNotificaciones(req.user.id, noLeidas);
    res.status(200).json(notificaciones);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function marcarLeida(req, res) {
  try {
    const notificacion = await notificacionService.marcarLeida(req.params.id, req.user.id);
    res.status(200).json(notificacion);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function marcarTodasLeidas(req, res) {
  try {
    const result = await notificacionService.marcarTodasLeidas(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function contarNoLeidas(req, res) {
  try {
    const count = await notificacionService.contarNoLeidas(req.user.id);
    res.status(200).json({ count });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}
