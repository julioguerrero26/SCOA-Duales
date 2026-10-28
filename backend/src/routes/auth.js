import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authController.logout);

// GET /api/auth/perfil - Obtener perfil del usuario autenticado
router.get('/perfil', autenticar, authController.perfil);

export default router;
