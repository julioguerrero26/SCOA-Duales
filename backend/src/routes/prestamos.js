import { Router } from 'express';
import * as prestamoController from '../controllers/prestamoController.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();

// GET /api/prestamos - Listar préstamos según perfil
router.get('/', autenticar, prestamoController.listar);

// POST /api/prestamos - Crear solicitud de préstamo (Alumno)
router.post('/', autenticar, autorizar('alumno'), prestamoController.crear);

// POST /api/prestamos/:id/aprobar - Aprobar préstamo (Maestro)
router.post('/:id/aprobar', autenticar, autorizar('maestro'), prestamoController.aprobar);

// POST /api/prestamos/:id/rechazar - Rechazar préstamo (Maestro)
router.post('/:id/rechazar', autenticar, autorizar('maestro'), prestamoController.rechazar);

// POST /api/prestamos/:id/cancelar - Cancelar préstamo (Alumno)
router.post('/:id/cancelar', autenticar, autorizar('alumno'), prestamoController.cancelar);

// POST /api/prestamos/:id/activar - Activar préstamo / entrega física (Maestro)
router.post('/:id/activar', autenticar, autorizar('maestro'), prestamoController.activar);

// POST /api/prestamos/:id/devolver - Registrar devolución (Maestro/Directivo)
router.post('/:id/devolver', autenticar, autorizar('maestro', 'directivo'), prestamoController.devolver);

export default router;
