/**
 * Rutas PÚBLICAS (sin token). Solo lectura de estadísticas agregadas.
 */
import { Router } from 'express';
import * as publico from '../controllers/publico.controller.js';

const router = Router();

// Panel informativo de la página de inicio (antes de iniciar sesión).
router.get('/estadisticas', publico.estadisticas);

export default router;
