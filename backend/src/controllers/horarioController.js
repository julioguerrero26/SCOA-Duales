import * as horarioService from '../services/horarioService.js';

export async function obtener(req, res) {
  try {
    let horario;

    switch (req.user.perfil) {
      case 'alumno':
        horario = await horarioService.obtenerHorarioAlumno(req.user.id);
        break;
      case 'maestro':
        horario = await horarioService.obtenerHorarioMaestro(req.user.id);
        break;
      case 'directivo':
        horario = await horarioService.obtenerTodosLosHorarios();
        break;
      default:
        return res.status(403).json({ error: 'Perfil no reconocido.' });
    }

    res.status(200).json(horario);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}
