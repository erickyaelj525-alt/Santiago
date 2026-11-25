/** Rutas de cosechas (todas requieren autenticación). */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { cosechaCrearSchema, cosechaActualizarSchema } from '../validators/schemas.js';
import * as ctrl from '../controllers/cosechas.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', ctrl.list);
router.post('/', validate(cosechaCrearSchema), ctrl.create);
router.put('/:id', validate(cosechaActualizarSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
