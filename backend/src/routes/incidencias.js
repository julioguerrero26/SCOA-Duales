import { Router } from 'express';
import * as incidenciaController from '../controllers/incidenciaController.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();

// GET /api/incidencias - Consultar incidencias según perfil
router.get('/', autenticar, incidenciaController.listar);

// POST /api/incidencias - Crear incidencia (Todos)
router.post('/', autenticar, incidenciaController.crear);

// PATCH /api/incidencias/:id/estado - Cambiar estado (Directivo)
router.patch('/:id/estado', autenticar, autorizar('directivo'), incidenciaController.cambiarEstado);

export default router;
