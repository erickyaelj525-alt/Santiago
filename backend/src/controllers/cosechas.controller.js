/**
 * Controlador de cosechas.
 * Cada cosecha pertenece a una colmena del usuario autenticado.
 */
import { query } from '../config/db.js';
import { HttpError, notFound } from '../utils/httpError.js';
import { propietarioId } from '../utils/scope.js';

const CAMPOS_ACTUALIZABLES = ['colmena_id', 'fecha', 'kg_miel', 'tipo_miel', 'humedad_pct', 'notas'];

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

/** GET /api/cosechas?colmena_id= */
export async function list(req, res, next) {
  try {
    const params = [propietarioId(req)];
    let sql = `SELECT co.*, c.codigo AS colmena_codigo, u.nombre AS creado_por_nombre
                 FROM cosechas co
                 JOIN colmenas c ON c.id = co.colmena_id
                 JOIN apiarios a ON a.id = c.apiario_id
                 LEFT JOIN usuarios u ON u.id = co.creado_por
                WHERE a.usuario_id = ?`;

    if (req.query.colmena_id !== undefined && req.query.colmena_id !== '') {
      const colmenaId = Number(req.query.colmena_id);
      if (!Number.isInteger(colmenaId) || colmenaId <= 0) {
        throw new HttpError(400, 'colmena_id no válido');
      }
      sql += ' AND co.colmena_id = ?';
      params.push(colmenaId);
    }

    sql += ' ORDER BY co.fecha DESC, co.id DESC';
    res.json(await query(sql, params));
  } catch (err) {
    next(err);
  }
}

/** POST /api/cosechas */
export async function create(req, res, next) {
  try {
    const {
      colmena_id,
      fecha,
      kg_miel,
      tipo_miel = null,
      humedad_pct = null,
      notas = null,
    } = req.body;

    await colmenaPertenece(colmena_id, propietarioId(req));

    // creado_por guarda la CUENTA real que registró (dueño o trabajador).
    const resultado = await query(
      `INSERT INTO cosechas (colmena_id, fecha, kg_miel, tipo_miel, humedad_pct, notas, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [colmena_id, fecha, kg_miel, tipo_miel, humedad_pct, notas, req.user.id],
    );

    const [cosecha] = await query('SELECT * FROM cosechas WHERE id = ?', [resultado.insertId]);
    res.status(201).json(cosecha);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/cosechas/:id */
export async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);

    const existente = await query(
      `SELECT co.id FROM cosechas co
         JOIN colmenas c ON c.id = co.colmena_id
         JOIN apiarios a ON a.id = c.apiario_id
        WHERE co.id = ? AND a.usuario_id = ?`,
      [id, propietarioId(req)],
    );
    if (existente.length === 0) throw notFound('Cosecha no encontrada');

    if ('colmena_id' in req.body) {
      await colmenaPertenece(req.body.colmena_id, propietarioId(req));
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
    await query(`UPDATE cosechas SET ${sets.join(', ')} WHERE id = ?`, valores);

    const [cosecha] = await query('SELECT * FROM cosechas WHERE id = ?', [id]);
    res.json(cosecha);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/cosechas/:id */
export async function remove(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const resultado = await query(
      `DELETE co FROM cosechas co
         JOIN colmenas c ON c.id = co.colmena_id
         JOIN apiarios a ON a.id = c.apiario_id
        WHERE co.id = ? AND a.usuario_id = ?`,
      [id, propietarioId(req)],
    );
    if (resultado.affectedRows === 0) throw notFound('Cosecha no encontrada');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
