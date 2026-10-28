import { Router } from 'express';
import * as comunicadoController from '../controllers/comunicadoController.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();

// GET /api/comunicados - Listar comunicados según perfil
router.get('/', autenticar, comunicadoController.listar);

// POST /api/comunicados - Crear comunicado (Directivo)
router.post('/', autenticar, autorizar('directivo'), comunicadoController.crear);

export default router;
