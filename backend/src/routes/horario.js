import { Router } from 'express';
import * as horarioController from '../controllers/horarioController.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

// GET /api/horario - Obtener horario según perfil
router.get('/', autenticar, horarioController.obtener);

export default router;
