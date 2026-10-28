import { Router } from 'express';
import { autenticar } from '../middleware/auth.js';
import { registrarConexion } from '../events/sse.js';

const router = Router();

// GET /api/eventos - Establecer conexión SSE
router.get('/', autenticar, (req, res) => {
  // Configurar headers para SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Para nginx
  });

  // Enviar comentario inicial para establecer conexión
  res.write(':ok\n\n');

  // Registrar conexión
  registrarConexion(req.user.id, res);

  // Heartbeat cada 30 segundos para mantener la conexión
  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 30000);

  // Limpiar al desconectarse
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

export default router;
