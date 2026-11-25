/**
 * Error HTTP con código de estado. Permite lanzar errores controlados
 * desde controladores y que el manejador global los convierta en JSON.
 */
export class HttpError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Atajo para responder 404. */
export const notFound = (message = 'Recurso no encontrado') => new HttpError(404, message);
