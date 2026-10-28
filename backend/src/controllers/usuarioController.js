import * as usuarioService from '../services/usuarioService.js';

export async function listar(req, res) {
  try {
    const usuarios = await usuarioService.listarUsuarios(req.query);
    res.status(200).json(usuarios);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function crear(req, res) {
  try {
    const usuario = await usuarioService.crearUsuario(req.body);
    res.status(201).json(usuario);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function actualizar(req, res) {
  try {
    const usuario = await usuarioService.actualizarUsuario(req.params.id, req.body);
    res.status(200).json(usuario);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}

export async function baja(req, res) {
  try {
    const result = await usuarioService.bajaUsuario(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error interno.' });
  }
}
