/** Ruta de clima (requiere autenticación; lat/lng validados como query string). */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { climaQuerySchema } from '../validators/schemas.js';
import * as ctrl from '../controllers/clima.controller.js';

const router = Router();

router.get('/', requireAuth, validate(climaQuerySchema, 'query'), ctrl.get);

export default router;
