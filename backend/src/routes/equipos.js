import { Router } from 'express';
import * as equipoController from '../controllers/equipoController.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();

// GET /api/equipos - Listar equipos (Todos)
router.get('/', autenticar, equipoController.listar);

// GET /api/equipos/categorias - Listar categorías
router.get('/categorias', autenticar, equipoController.categorias);

// GET /api/equipos/:id - Obtener un equipo
router.get('/:id', autenticar, equipoController.obtener);

// POST /api/equipos - Crear equipo (Directivo)
router.post('/', autenticar, autorizar('directivo'), equipoController.crear);

// PUT /api/equipos/:id - Actualizar equipo (Directivo)
router.put('/:id', autenticar, autorizar('directivo'), equipoController.actualizar);

// DELETE /api/equipos/:id - Dar de baja equipo (Directivo)
router.delete('/:id', autenticar, autorizar('directivo'), equipoController.baja);

export default router;
