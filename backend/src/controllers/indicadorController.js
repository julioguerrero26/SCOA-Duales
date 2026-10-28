import * as indicadorService from '../services/indicadorService.js';

export async function obtener(req, res) {
  try {
    const indicadores = await indicadorService.obtenerIndicadores();
    res.status(200).json(indicadores);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}
