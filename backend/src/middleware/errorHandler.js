/**
 * Manejador global de errores.
 * Convierte HttpError (y errores de MySQL) en respuestas JSON consistentes.
 */
import { HttpError } from '../utils/httpError.js';

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // Errores lanzados a propósito con HttpError
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  // Errores conocidos de MySQL
  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'El registro ya existe (valor duplicado)' });
  }
  if (err && err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'La referencia indicada no existe' });
  }

  console.error('[error]', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}
