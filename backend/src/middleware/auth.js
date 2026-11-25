/**
 * Middleware de autenticación por JWT.
 * Lee el header "Authorization: Bearer <token>", lo verifica y coloca
 * la identidad en req.user para los controladores:
 *   req.user.id      -> id de la CUENTA que inició sesión (dueño o trabajador)
 *   req.user.rol     -> 'dueno' | 'trabajador'
 *   req.user.duenoId -> id del dueño (null si la cuenta es del dueño)
 *
 * Para consultar datos se usa propietarioId(req) de utils/scope.js, de modo
 * que un trabajador trabaje sobre los datos de su dueño.
 */
import { verifyToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Token de autenticación no proporcionado'));
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.id,
      rol: payload.rol,
      duenoId: payload.duenoId ?? null,
    };
    next();
  } catch {
    next(new HttpError(401, 'Token inválido o expirado'));
  }
}

/** Restringe el acceso a ciertos roles. Ej: requireRole('dueno'). */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return next(new HttpError(403, 'No tienes permisos para esta acción'));
    }
    next();
  };
}
