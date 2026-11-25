/**
 * Rutas de autenticación. register/login son públicas; /me requiere token.
 */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import {
  registroSchema,
  loginSchema,
  verificarSchema,
  reenviarCodigoSchema,
} from '../validators/schemas.js';
import * as ctrl from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', validate(registroSchema), ctrl.register);
router.post('/verificar', validate(verificarSchema), ctrl.verificar);
router.post('/reenviar-codigo', validate(reenviarCodigoSchema), ctrl.reenviarCodigo);
router.post('/login', validate(loginSchema), ctrl.login);
router.get('/me', requireAuth, ctrl.me);

export default router;
