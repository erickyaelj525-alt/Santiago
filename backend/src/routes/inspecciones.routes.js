/** Rutas de inspecciones (todas requieren autenticación). */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { inspeccionCrearSchema, inspeccionActualizarSchema } from '../validators/schemas.js';
import * as ctrl from '../controllers/inspecciones.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', ctrl.list);
router.post('/', validate(inspeccionCrearSchema), ctrl.create);
router.put('/:id', validate(inspeccionActualizarSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
