/** Ruta del dashboard (requiere autenticación). */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/', requireAuth, ctrl.get);

export default router;
