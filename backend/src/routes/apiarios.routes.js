/** Rutas de apiarios (todas requieren autenticación). */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { apiarioCrearSchema, apiarioActualizarSchema } from '../validators/schemas.js';
import * as ctrl from '../controllers/apiarios.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(apiarioCrearSchema), ctrl.create);
router.put('/:id', validate(apiarioActualizarSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
