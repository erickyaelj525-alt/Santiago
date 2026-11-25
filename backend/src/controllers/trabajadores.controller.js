/**
 * Controlador del equipo de trabajo (trabajadores).
 * Solo lo usa el DUEÑO: gestiona las cuentas de sus trabajadores, que comparten
 * los mismos apiarios/colmenas pero no pueden eliminar apiarios ni administrar
 * al equipo. Nunca se expone password_hash.
 */
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { HttpError, notFound } from '../utils/httpError.js';
import { enviarCodigoVerificacion } from '../utils/mailer.js';
import { generarCodigo, fechaExpiracionCodigo } from '../utils/codigoVerificacion.js';

/** Costo del hash bcrypt (igual que auth.controller.js). */
const BCRYPT_ROUNDS = 10;

/** Convierte y valida el :id de la ruta. */
function parseId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Identificador no válido');
  return id;
}

/**
 * GET /api/trabajadores
 * Devuelve el equipo del dueño autenticado: su propia fila (rol 'dueno') más
 * sus trabajadores, con estadísticas calculadas SOLO sobre los datos del dueño.
 * Orden: dueño primero, luego por nombre.
 */
export async function list(req, res, next) {
  try {
    const duenoId = req.user.id;
    const filas = await query(
      `SELECT u.id, u.nombre, u.email, u.rol, u.email_verificado, u.created_at,
              (SELECT COUNT(*) FROM inspecciones i
                 JOIN colmenas c ON c.id = i.colmena_id
                 JOIN apiarios a ON a.id = c.apiario_id
                WHERE i.creado_por = u.id AND a.usuario_id = ?) AS inspecciones_registradas,
              (SELECT MAX(i.fecha) FROM inspecciones i
                 JOIN colmenas c ON c.id = i.colmena_id
                 JOIN apiarios a ON a.id = c.apiario_id
                WHERE i.creado_por = u.id AND a.usuario_id = ?) AS ultima_actividad
         FROM usuarios u
        WHERE u.id = ? OR u.dueno_id = ?
        ORDER BY (u.rol = 'dueno') DESC, u.nombre`,
      [duenoId, duenoId, duenoId, duenoId],
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/trabajadores
 * Crea una cuenta de trabajador asociada al dueño autenticado y le envía un
 * código de verificación a su correo: la cuenta queda SIN verificar hasta que
 * el trabajador confirme el código (igual que el auto-registro del dueño).
 * Responde 201 con { id, nombre, email, rol, email_verificado } (sin token ni hash).
 */
export async function create(req, res, next) {
  try {
    const { nombre, email, password } = req.body;

    // Verificamos el correo único (además del UNIQUE de la BD).
    const existentes = await query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existentes.length > 0) throw new HttpError(409, 'El correo ya está registrado');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const codigo = generarCodigo();
    const resultado = await query(
      `INSERT INTO usuarios
         (nombre, email, password_hash, rol, dueno_id, email_verificado, codigo_verificacion, codigo_expira)
       VALUES (?, ?, ?, 'trabajador', ?, 0, ?, ?)`,
      [nombre, email, passwordHash, req.user.id, codigo, fechaExpiracionCodigo()],
    );

    const envio = await enviarCodigoVerificacion(email, codigo, nombre);

    const [trabajador] = await query(
      'SELECT id, nombre, email, rol, email_verificado FROM usuarios WHERE id = ?',
      [resultado.insertId],
    );
    res.status(201).json({
      ...trabajador,
      mensaje: 'Trabajador creado. Le enviamos un código de verificación a su correo.',
      correo_configurado: !envio.demo,
      // En modo demo (sin SMTP) devolvemos el código para poder probar en local.
      ...(envio.demo ? { codigo_demo: codigo } : {}),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/trabajadores/:id
 * Restablece la contraseña de un trabajador del dueño autenticado.
 * Solo si el trabajador le pertenece (WHERE id + dueno_id + rol).
 */
export async function resetPassword(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const { password } = req.body;

    const filas = await query(
      "SELECT id FROM usuarios WHERE id = ? AND dueno_id = ? AND rol = 'trabajador'",
      [id, req.user.id],
    );
    if (filas.length === 0) throw notFound('Trabajador no encontrado');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [passwordHash, id]);
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/trabajadores/:id
 * Elimina un trabajador del dueño autenticado (404 si no es suyo).
 */
export async function remove(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const resultado = await query(
      "DELETE FROM usuarios WHERE id = ? AND dueno_id = ? AND rol = 'trabajador'",
      [id, req.user.id],
    );
    if (resultado.affectedRows === 0) throw notFound('Trabajador no encontrado');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
