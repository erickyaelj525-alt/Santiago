/**
 * Enrutador principal. Agrupa todos los recursos de la API REST.
 */
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import trabajadoresRoutes from './trabajadores.routes.js';
import apiariosRoutes from './apiarios.routes.js';
import colmenasRoutes from './colmenas.routes.js';
import inspeccionesRoutes from './inspecciones.routes.js';
import cosechasRoutes from './cosechas.routes.js';
import tratamientosRoutes from './tratamientos.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import climaRoutes from './clima.routes.js';
import publicoRoutes from './publico.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/trabajadores', trabajadoresRoutes);
router.use('/apiarios', apiariosRoutes);
router.use('/colmenas', colmenasRoutes);
router.use('/inspecciones', inspeccionesRoutes);
router.use('/cosechas', cosechasRoutes);
router.use('/tratamientos', tratamientosRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/clima', climaRoutes);
// Rutas públicas (no requieren iniciar sesión).
router.use('/publico', publicoRoutes);

export default router;
