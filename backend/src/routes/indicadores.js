import { Router } from 'express';
import * as indicadorController from '../controllers/indicadorController.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();

// GET /api/indicadores - Obtener indicadores (Directivo)
router.get('/', autenticar, autorizar('directivo'), indicadorController.obtener);

export default router;
