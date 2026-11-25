/** Rutas de tratamientos (todas requieren autenticación). */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { tratamientoCrearSchema, tratamientoActualizarSchema } from '../validators/schemas.js';
import * as ctrl from '../controllers/tratamientos.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', ctrl.list);
router.post('/', validate(tratamientoCrearSchema), ctrl.create);
router.put('/:id', validate(tratamientoActualizarSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
