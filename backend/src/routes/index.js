/**
 * Enrutador principal. Agrupa todos los recursos de la API REST.
 */
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import apiariosRoutes from './apiarios.routes.js';
import colmenasRoutes from './colmenas.routes.js';
import inspeccionesRoutes from './inspecciones.routes.js';
import cosechasRoutes from './cosechas.routes.js';
import tratamientosRoutes from './tratamientos.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import climaRoutes from './clima.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/apiarios', apiariosRoutes);
router.use('/colmenas', colmenasRoutes);
router.use('/inspecciones', inspeccionesRoutes);
router.use('/cosechas', cosechasRoutes);
router.use('/tratamientos', tratamientosRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/clima', climaRoutes);

export default router;
