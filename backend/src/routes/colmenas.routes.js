/** Rutas de colmenas (todas requieren autenticación). */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { colmenaCrearSchema, colmenaActualizarSchema } from '../validators/schemas.js';
import * as ctrl from '../controllers/colmenas.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(colmenaCrearSchema), ctrl.create);
router.put('/:id', validate(colmenaActualizarSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
