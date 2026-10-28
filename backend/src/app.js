import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cron from 'node-cron';

// Cargar variables de entorno
dotenv.config();

// Importar rutas
import authRoutes from './routes/auth.js';
import prestamoRoutes from './routes/prestamos.js';
import incidenciaRoutes from './routes/incidencias.js';
import equipoRoutes from './routes/equipos.js';
import comunicadoRoutes from './routes/comunicados.js';
import horarioRoutes from './routes/horario.js';
import indicadorRoutes from './routes/indicadores.js';
import usuarioRoutes from './routes/usuarios.js';
import notificacionRoutes from './routes/notificaciones.js';
import eventoRoutes from './routes/eventos.js';

// Importar job
import { procesarVencimientos } from './jobs/vencimientos.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// Middlewares globales
// ============================================================
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// ============================================================
// Rutas de la API
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/prestamos', prestamoRoutes);
app.use('/api/incidencias', incidenciaRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/comunicados', comunicadoRoutes);
app.use('/api/horario', horarioRoutes);
app.use('/api/indicadores', indicadorRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/eventos', eventoRoutes);

// ============================================================
// Health check
// ============================================================
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'SCOA Backend', timestamp: new Date().toISOString() });
});

// ============================================================
// Manejo de errores global
// ============================================================
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// ============================================================
// Proceso programado: Vencimientos cada hora
// ============================================================
cron.schedule('0 * * * *', () => {
  procesarVencimientos();
});

// ============================================================
// Iniciar servidor
// ============================================================
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🏫 SCOA Backend ejecutándose en puerto ${PORT}`);
    console.log(`📡 API disponible en http://localhost:${PORT}/api`);
    console.log(`⏰ Cron de vencimientos configurado (cada hora)`);
  });
}

export default app;
