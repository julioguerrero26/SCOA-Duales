import { Router } from 'express';
import * as notificacionController from '../controllers/notificacionController.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

// GET /api/notificaciones - Listar notificaciones
router.get('/', autenticar, notificacionController.listar);

// GET /api/notificaciones/count - Contar no leídas
router.get('/count', autenticar, notificacionController.contarNoLeidas);

// PUT /api/notificaciones/leer-todas - Marcar todas como leídas
router.put('/leer-todas', autenticar, notificacionController.marcarTodasLeidas);

// PUT /api/notificaciones/:id/leer - Marcar una como leída
router.put('/:id/leer', autenticar, notificacionController.marcarLeida);

export default router;
