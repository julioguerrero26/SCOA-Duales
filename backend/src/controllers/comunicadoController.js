import * as comunicadoService from '../services/comunicadoService.js';

export async function crear(req, res) {
  try {
    const comunicado = await comunicadoService.crearComunicado(req.user.id, req.body);
    res.status(201).json(comunicado);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function listar(req, res) {
  try {
    const comunicados = await comunicadoService.consultarComunicados(req.user.id, req.user.perfil);
    res.status(200).json(comunicados);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}
