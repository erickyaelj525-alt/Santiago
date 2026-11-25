/**
 * Controlador de apiarios.
 * Todas las operaciones están restringidas al usuario autenticado:
 * se filtra siempre por usuario_id y se verifica la pertenencia antes
 * de actualizar o eliminar (404 si el recurso es de otro usuario).
 */
import { query } from '../config/db.js';
import { HttpError, notFound } from '../utils/httpError.js';

// Columnas permitidas al actualizar un apiario (evita inyección por nombres de columna).
const CAMPOS_ACTUALIZABLES = ['nombre', 'descripcion', 'lat', 'lng', 'municipio'];

/** Convierte y valida el :id de la ruta. */
function parseId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Identificador no válido');
  return id;
}

/** GET /api/apiarios — lista con conteo de colmenas. */
export async function list(req, res, next) {
  try {
    const filas = await query(
      `SELECT a.id, a.nombre, a.descripcion, a.lat, a.lng, a.municipio, a.created_at,
              (SELECT COUNT(*) FROM colmenas c WHERE c.apiario_id = a.id) AS total_colmenas,
              (SELECT COUNT(*) FROM colmenas c WHERE c.apiario_id = a.id AND c.estado = 'activa') AS colmenas_activas
         FROM apiarios a
        WHERE a.usuario_id = ?
        ORDER BY a.created_at DESC, a.id DESC`,
      [req.user.id],
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
}

/** GET /api/apiarios/:id — un apiario con su lista de colmenas. */
export async function getById(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const filas = await query(
      `SELECT id, nombre, descripcion, lat, lng, municipio, created_at
         FROM apiarios WHERE id = ? AND usuario_id = ?`,
      [id, req.user.id],
    );
    if (filas.length === 0) throw notFound('Apiario no encontrado');

    const apiario = filas[0];
    apiario.colmenas = await query(
      `SELECT id, apiario_id, codigo, tipo, fecha_instalacion, estado, reina_marcada, notas
         FROM colmenas WHERE apiario_id = ? ORDER BY codigo`,
      [id],
    );
    res.json(apiario);
  } catch (err) {
    next(err);
  }
}

/** POST /api/apiarios — crea un apiario para el usuario autenticado. */
export async function create(req, res, next) {
  try {
    const { nombre, descripcion = null, lat = null, lng = null, municipio = null } = req.body;
    const resultado = await query(
      `INSERT INTO apiarios (usuario_id, nombre, descripcion, lat, lng, municipio)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, nombre, descripcion, lat, lng, municipio],
    );
    const [apiario] = await query(
      `SELECT id, nombre, descripcion, lat, lng, municipio, created_at
         FROM apiarios WHERE id = ?`,
      [resultado.insertId],
    );
    res.status(201).json(apiario);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/apiarios/:id — actualiza solo los campos enviados. */
export async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);

    // Verificamos pertenencia: si no es del usuario, respondemos 404 (no 403) para no filtrar existencia.
    const existe = await query('SELECT id FROM apiarios WHERE id = ? AND usuario_id = ?', [
      id,
      req.user.id,
    ]);
    if (existe.length === 0) throw notFound('Apiario no encontrado');

    const sets = [];
    const valores = [];
    for (const campo of CAMPOS_ACTUALIZABLES) {
      if (campo in req.body) {
        sets.push(`${campo} = ?`);
        valores.push(req.body[campo] ?? null);
      }
    }
    if (sets.length === 0) throw new HttpError(400, 'No se enviaron campos para actualizar');

    valores.push(id, req.user.id);
    await query(`UPDATE apiarios SET ${sets.join(', ')} WHERE id = ? AND usuario_id = ?`, valores);

    const [apiario] = await query(
      `SELECT id, nombre, descripcion, lat, lng, municipio, created_at
         FROM apiarios WHERE id = ?`,
      [id],
    );
    res.json(apiario);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/apiarios/:id — elimina (cascada a colmenas) si es del usuario. */
export async function remove(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const resultado = await query('DELETE FROM apiarios WHERE id = ? AND usuario_id = ?', [
      id,
      req.user.id,
    ]);
    if (resultado.affectedRows === 0) throw notFound('Apiario no encontrado');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
