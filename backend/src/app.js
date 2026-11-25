/**
 * Configuración de la aplicación Express (sin escuchar el puerto).
 * Se separa de server.js para poder importarla en las pruebas.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Seguridad: cabeceras HTTP y CORS restringido al frontend.
  app.use(helmet());
  app.use(cors({ origin: env.clientUrl, credentials: true }));

  // Parseo de JSON con límite razonable.
  app.use(express.json({ limit: '1mb' }));

  // Límite de peticiones a las rutas de autenticación (anti fuerza bruta).
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

  // Endpoint de salud (útil para monitoreo y para la defensa).
  app.get('/api/health', (_req, res) => res.json({ ok: true, servicio: 'Apiario Digital API' }));

  // Rutas de la API.
  app.use('/api', routes);

  // 404 y manejo de errores al final.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
