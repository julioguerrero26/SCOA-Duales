import * as incidenciaService from '../services/incidenciaService.js';

export async function crear(req, res) {
  try {
    const incidencia = await incidenciaService.crearIncidencia(req.user.id, req.body);
    res.status(201).json(incidencia);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function listar(req, res) {
  try {
    const incidencias = await incidenciaService.consultarIncidencias(req.user.id, req.user.perfil, req.query);
    res.status(200).json(incidencias);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function cambiarEstado(req, res) {
  try {
    const incidencia = await incidenciaService.cambiarEstado(req.params.id, req.user.id, req.body);
    res.status(200).json(incidencia);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}
