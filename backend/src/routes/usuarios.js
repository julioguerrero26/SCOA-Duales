import { Router } from 'express';
import * as usuarioController from '../controllers/usuarioController.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();

// GET /api/usuarios - Listar usuarios (Directivo)
router.get('/', autenticar, autorizar('directivo'), usuarioController.listar);

// POST /api/usuarios - Crear usuario (Directivo)
router.post('/', autenticar, autorizar('directivo'), usuarioController.crear);

// PUT /api/usuarios/:id - Actualizar usuario (Directivo)
router.put('/:id', autenticar, autorizar('directivo'), usuarioController.actualizar);

// DELETE /api/usuarios/:id - Dar de baja usuario (Directivo)
router.delete('/:id', autenticar, autorizar('directivo'), usuarioController.baja);

export default router;
