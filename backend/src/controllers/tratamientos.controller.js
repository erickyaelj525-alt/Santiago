/**
 * Controlador de tratamientos sanitarios.
 * Cada tratamiento pertenece a una colmena del usuario autenticado.
 */
import { query } from '../config/db.js';
import { HttpError, notFound } from '../utils/httpError.js';

const CAMPOS_ACTUALIZABLES = [
  'colmena_id',
  'tipo',
  'producto',
  'dosis',
  'fecha_inicio',
  'fecha_fin',
  'notas',
];

function parseId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Identificador no válido');
  return id;
}

/** Verifica que la colmena pertenece al usuario. */
async function colmenaPertenece(colmenaId, usuarioId) {
  const filas = await query(
    `SELECT c.id FROM colmenas c
       JOIN apiarios a ON a.id = c.apiario_id
      WHERE c.id = ? AND a.usuario_id = ?`,
    [colmenaId, usuarioId],
  );
  if (filas.length === 0) throw notFound('Colmena no encontrada');
}

/** GET /api/tratamientos?colmena_id= */
export async function list(req, res, next) {
  try {
    const params = [req.user.id];
    let sql = `SELECT t.*, c.codigo AS colmena_codigo
                 FROM tratamientos t
                 JOIN colmenas c ON c.id = t.colmena_id
                 JOIN apiarios a ON a.id = c.apiario_id
                WHERE a.usuario_id = ?`;

    if (req.query.colmena_id !== undefined && req.query.colmena_id !== '') {
      const colmenaId = Number(req.query.colmena_id);
      if (!Number.isInteger(colmenaId) || colmenaId <= 0) {
        throw new HttpError(400, 'colmena_id no válido');
      }
      sql += ' AND t.colmena_id = ?';
      params.push(colmenaId);
    }

    sql += ' ORDER BY t.fecha_inicio DESC, t.id DESC';
    res.json(await query(sql, params));
  } catch (err) {
    next(err);
  }
}

/** POST /api/tratamientos */
export async function create(req, res, next) {
  try {
    const {
      colmena_id,
      tipo = 'varroa',
      producto,
      dosis = null,
      fecha_inicio,
      fecha_fin = null,
      notas = null,
    } = req.body;

    await colmenaPertenece(colmena_id, req.user.id);

    const resultado = await query(
      `INSERT INTO tratamientos (colmena_id, tipo, producto, dosis, fecha_inicio, fecha_fin, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [colmena_id, tipo, producto, dosis, fecha_inicio, fecha_fin, notas],
    );

    const [tratamiento] = await query('SELECT * FROM tratamientos WHERE id = ?', [
      resultado.insertId,
    ]);
    res.status(201).json(tratamiento);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/tratamientos/:id */
export async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);

    const existente = await query(
      `SELECT t.id FROM tratamientos t
         JOIN colmenas c ON c.id = t.colmena_id
         JOIN apiarios a ON a.id = c.apiario_id
        WHERE t.id = ? AND a.usuario_id = ?`,
      [id, req.user.id],
    );
    if (existente.length === 0) throw notFound('Tratamiento no encontrado');

    if ('colmena_id' in req.body) {
      await colmenaPertenece(req.body.colmena_id, req.user.id);
    }

    const sets = [];
    const valores = [];
    for (const campo of CAMPOS_ACTUALIZABLES) {
      if (campo in req.body) {
        sets.push(`${campo} = ?`);
        valores.push(req.body[campo] ?? null);
      }
    }
    if (sets.length === 0) throw new HttpError(400, 'No se enviaron campos para actualizar');

    valores.push(id);
    await query(`UPDATE tratamientos SET ${sets.join(', ')} WHERE id = ?`, valores);

    const [tratamiento] = await query('SELECT * FROM tratamientos WHERE id = ?', [id]);
    res.json(tratamiento);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/tratamientos/:id */
export async function remove(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const resultado = await query(
      `DELETE t FROM tratamientos t
         JOIN colmenas c ON c.id = t.colmena_id
         JOIN apiarios a ON a.id = c.apiario_id
        WHERE t.id = ? AND a.usuario_id = ?`,
      [id, req.user.id],
    );
    if (resultado.affectedRows === 0) throw notFound('Tratamiento no encontrado');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
