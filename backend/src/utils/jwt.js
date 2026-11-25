/**
 * Utilidades para firmar y verificar JSON Web Tokens (JWT).
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/** Firma un token con el id y rol del usuario. */
export function signToken(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expires });
}

/** Verifica un token y devuelve el payload, o lanza si es inválido/expirado. */
export function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}
