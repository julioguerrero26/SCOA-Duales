import * as prestamoService from '../services/prestamoService.js';

export async function crear(req, res) {
  try {
    const prestamo = await prestamoService.crearSolicitud(req.user.id, req.body);
    res.status(201).json(prestamo);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function listar(req, res) {
  try {
    const prestamos = await prestamoService.consultarPrestamos(req.user.id, req.user.perfil, req.query);
    res.status(200).json(prestamos);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function aprobar(req, res) {
  try {
    const prestamo = await prestamoService.aprobarPrestamo(req.params.id, req.user.id);
    res.status(200).json(prestamo);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function rechazar(req, res) {
  try {
    const prestamo = await prestamoService.rechazarPrestamo(req.params.id, req.user.id, req.body.motivo_rechazo);
    res.status(200).json(prestamo);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function cancelar(req, res) {
  try {
    const prestamo = await prestamoService.cancelarPrestamo(req.params.id, req.user.id);
    res.status(200).json(prestamo);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function activar(req, res) {
  try {
    const prestamo = await prestamoService.activarPrestamo(req.params.id, req.user.id);
    res.status(200).json(prestamo);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function devolver(req, res) {
  try {
    const prestamo = await prestamoService.registrarDevolucion(req.params.id, req.user.id, req.body.observaciones);
    res.status(200).json(prestamo);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}
