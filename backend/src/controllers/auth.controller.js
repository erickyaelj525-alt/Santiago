/**
 * Controlador de autenticación.
 * Gestiona registro, inicio de sesión y perfil del usuario autenticado.
 * Nunca expone password_hash en las respuestas.
 */
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { signToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';

// Columnas públicas del usuario (sin el hash de la contraseña).
const CAMPOS_PUBLICOS = 'id, nombre, email, rol';

/** Costo del hash bcrypt. 10 es un balance razonable seguridad/rendimiento. */
const BCRYPT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Crea la cuenta del DUEÑO del apiario y devuelve una sesión iniciada.
 * Las cuentas de trabajadores NO se crean aquí: las da de alta el dueño desde
 * la sección "Equipo".
 */
export async function register(req, res, next) {
  try {
    const { nombre, email, password } = req.body;

    // Verificamos que el correo no esté ya registrado (además del UNIQUE de la BD).
    const existentes = await query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existentes.length > 0) {
      throw new HttpError(409, 'El correo ya está registrado');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const resultado = await query(
      `INSERT INTO usuarios
         (nombre, email, password_hash, rol, email_verificado)
       VALUES (?, ?, ?, 'dueno', 1)`,
      [nombre, email, passwordHash],
    );

    const usuario = { id: resultado.insertId, nombre, email, rol: 'dueno' };
    const token = signToken({ id: usuario.id, rol: usuario.rol, duenoId: null });
    res.status(201).json({ token, usuario });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Verifica credenciales y devuelve un token junto al usuario.
 * El token incluye el rol y, para un trabajador, el id de su dueño.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const filas = await query(
      `SELECT ${CAMPOS_PUBLICOS}, dueno_id, password_hash FROM usuarios WHERE email = ?`,
      [email],
    );
    const usuario = filas[0];

    // Mismo mensaje para usuario inexistente y contraseña incorrecta (no revelar cuál falló).
    if (!usuario) throw new HttpError(401, 'Credenciales inválidas');

    const coincide = await bcrypt.compare(password, usuario.password_hash);
    if (!coincide) throw new HttpError(401, 'Credenciales inválidas');

    delete usuario.password_hash;
    const duenoId = usuario.dueno_id ?? null;
    delete usuario.dueno_id;

    const token = signToken({ id: usuario.id, rol: usuario.rol, duenoId });
    res.json({ token, usuario });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Devuelve el perfil del usuario indicado por el token.
 */
export async function me(req, res, next) {
  try {
    const filas = await query(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE id = ?`, [req.user.id]);
    if (filas.length === 0) throw new HttpError(404, 'Usuario no encontrado');
    res.json({ usuario: filas[0] });
  } catch (err) {
    next(err);
  }
}
