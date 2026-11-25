/**
 * Rutas del equipo de trabajo.
 * Todas exigen autenticación y rol de DUEÑO: solo el propietario gestiona
 * cuentas de trabajadores.
 */
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { trabajadorCrearSchema } from '../validators/schemas.js';
import * as ctrl from '../controllers/trabajadores.controller.js';

const router = Router();

// Requiere sesión válida y ser dueño de la operación.
router.use(requireAuth, requireRole('dueno'));

// Esquema local para restablecer la contraseña (mínimo 6 caracteres).
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(72, 'La contraseña es demasiado larga'),
});

router.get('/', ctrl.list);
router.post('/', validate(trabajadorCrearSchema), ctrl.create);
router.patch('/:id', validate(resetPasswordSchema), ctrl.resetPassword);
router.delete('/:id', ctrl.remove);

export default router;
