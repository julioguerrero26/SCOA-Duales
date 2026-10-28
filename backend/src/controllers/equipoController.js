import * as equipoService from '../services/equipoService.js';

export async function listar(req, res) {
  try {
    const equipos = await equipoService.listarEquipos(req.query);
    res.status(200).json(equipos);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function obtener(req, res) {
  try {
    const equipo = await equipoService.obtenerEquipo(req.params.id);
    res.status(200).json(equipo);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function crear(req, res) {
  try {
    const equipo = await equipoService.crearEquipo(req.body);
    res.status(201).json(equipo);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function actualizar(req, res) {
  try {
    const equipo = await equipoService.actualizarEquipo(req.params.id, req.body);
    res.status(200).json(equipo);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function baja(req, res) {
  try {
    const result = await equipoService.bajaEquipo(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function categorias(req, res) {
  try {
    const cats = await equipoService.obtenerCategorias();
    res.status(200).json(cats);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}
