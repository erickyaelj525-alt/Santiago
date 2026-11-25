/**
 * Controlador de autenticación.
 * Gestiona registro, inicio de sesión y perfil del usuario autenticado.
 * Nunca expone password_hash en las respuestas.
 */
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { signToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';
import { enviarCodigoVerificacion, correoConfigurado } from '../utils/mailer.js';
import { generarCodigo, fechaExpiracionCodigo } from '../utils/codigoVerificacion.js';

// Columnas públicas del usuario (sin el hash de la contraseña).
const CAMPOS_PUBLICOS = 'id, nombre, email, rol';

/** Costo del hash bcrypt. 10 es un balance razonable seguridad/rendimiento. */
const BCRYPT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Crea la cuenta del DUEÑO del apiario y envía un código de verificación por correo.
 * Las cuentas de trabajadores NO se crean aquí: las da de alta el dueño desde
 * la sección "Equipo". La cuenta queda SIN verificar hasta confirmar el código.
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
    const codigo = generarCodigo();

    await query(
      `INSERT INTO usuarios
         (nombre, email, password_hash, rol, email_verificado, codigo_verificacion, codigo_expira)
       VALUES (?, ?, ?, 'dueno', 0, ?, ?)`,
      [nombre, email, passwordHash, codigo, fechaExpiracionCodigo()],
    );

    const envio = await enviarCodigoVerificacion(email, codigo, nombre);

    res.status(201).json({
      mensaje: 'Te enviamos un código de verificación a tu correo.',
      email,
      correo_configurado: !envio.demo,
      // En modo demo (sin SMTP) devolvemos el código para poder probar en local.
      ...(envio.demo ? { codigo_demo: codigo } : {}),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/verificar
 * Confirma el código enviado por correo y activa la cuenta (devuelve token).
 */
export async function verificar(req, res, next) {
  try {
    const { email, codigo } = req.body;

    const filas = await query(
      `SELECT id, nombre, email, rol, dueno_id, email_verificado, codigo_verificacion, codigo_expira
         FROM usuarios WHERE email = ?`,
      [email],
    );
    const usuario = filas[0];
    if (!usuario) throw new HttpError(404, 'Usuario no encontrado');

    const publico = { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };

    // Si ya estaba verificado, simplemente permitimos entrar.
    if (usuario.email_verificado) {
      const token = signToken({ id: usuario.id, rol: usuario.rol, duenoId: usuario.dueno_id ?? null });
      return res.json({ mensaje: 'La cuenta ya estaba verificada.', token, usuario: publico });
    }

    if (!usuario.codigo_verificacion || usuario.codigo_verificacion !== codigo) {
      throw new HttpError(400, 'El código es incorrecto');
    }
    if (usuario.codigo_expira && new Date(usuario.codigo_expira) < new Date()) {
      throw new HttpError(400, 'El código expiró. Solicita uno nuevo.');
    }

    await query(
      'UPDATE usuarios SET email_verificado = 1, codigo_verificacion = NULL, codigo_expira = NULL WHERE id = ?',
      [usuario.id],
    );

    const token = signToken({ id: usuario.id, rol: usuario.rol, duenoId: usuario.dueno_id ?? null });
    res.json({ mensaje: 'Cuenta verificada correctamente.', token, usuario: publico });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reenviar-codigo
 * Genera y reenvía un nuevo código de verificación.
 */
export async function reenviarCodigo(req, res, next) {
  try {
    const { email } = req.body;

    const filas = await query(
      'SELECT id, nombre, email, email_verificado FROM usuarios WHERE email = ?',
      [email],
    );
    const usuario = filas[0];

    // No revelamos si el correo existe o si ya está verificado.
    if (!usuario || usuario.email_verificado) {
      return res.json({
        mensaje: 'Si el correo existe y no está verificado, te enviamos un nuevo código.',
        correo_configurado: correoConfigurado,
      });
    }

    const codigo = generarCodigo();
    await query('UPDATE usuarios SET codigo_verificacion = ?, codigo_expira = ? WHERE id = ?', [
      codigo,
      fechaExpiracionCodigo(),
      usuario.id,
    ]);

    const envio = await enviarCodigoVerificacion(email, codigo, usuario.nombre);
    res.json({
      mensaje: 'Te enviamos un nuevo código de verificación.',
      correo_configurado: !envio.demo,
      ...(envio.demo ? { codigo_demo: codigo } : {}),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Verifica credenciales y devuelve un token junto al usuario.
 * El token incluye el rol y, para un trabajador, el id de su dueño.
 * Las cuentas sin verificar no pueden entrar.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const filas = await query(
      `SELECT ${CAMPOS_PUBLICOS}, dueno_id, password_hash, email_verificado FROM usuarios WHERE email = ?`,
      [email],
    );
    const usuario = filas[0];

    // Mismo mensaje para usuario inexistente y contraseña incorrecta (no revelar cuál falló).
    if (!usuario) throw new HttpError(401, 'Credenciales inválidas');

    const coincide = await bcrypt.compare(password, usuario.password_hash);
    if (!coincide) throw new HttpError(401, 'Credenciales inválidas');

    if (!usuario.email_verificado) {
      throw new HttpError(
        403,
        'Tu cuenta no está verificada. Revisa el código que enviamos a tu correo.',
      );
    }

    delete usuario.password_hash;
    delete usuario.email_verificado;
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
