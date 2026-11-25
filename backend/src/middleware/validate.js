/**
 * Middleware de validación con Zod.
 * Recibe un esquema y valida req.body (o req.query/req.params).
 * Si la validación falla responde 400 con el detalle de los campos.
 */
import { HttpError } from '../utils/httpError.js';

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        campo: i.path.join('.') || '(raíz)',
        mensaje: i.message,
      }));
      return next(new HttpError(400, 'Datos inválidos', details));
    }
    // Datos ya saneados y tipados.
    req[source] = result.data;
    next();
  };
}
