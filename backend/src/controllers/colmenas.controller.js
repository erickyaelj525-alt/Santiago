/**
 * Controlador de colmenas.
 * La pertenencia al usuario se determina siempre navegando colmena -> apiario -> usuario.
 */
import { query } from '../config/db.js';
import { HttpError, notFound } from '../utils/httpError.js';
import { propietarioId } from '../utils/scope.js';

const CAMPOS_ACTUALIZABLES = [
  'apiario_id',
  'codigo',
  'tipo',
  'fecha_instalacion',
  'estado',
  'reina_marcada',
  'notas',
];

function parseId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Identificador no válido');
  return id;
}

/** Comprueba que un apiario pertenece al usuario; lanza 404 si no. */
async function apiarioPertenece(apiarioId, usuarioId) {
  const filas = await query('SELECT id FROM apiarios WHERE id = ? AND usuario_id = ?', [
    apiarioId,
    usuarioId,
  ]);
  if (filas.length === 0) throw notFound('Apiario no encontrado');
}

/** Comprueba que una colmena pertenece al usuario; lanza 404 si no. */
async function colmenaPertenece(colmenaId, usuarioId) {
  const filas = await query(
    `SELECT c.id FROM colmenas c
       JOIN apiarios a ON a.id = c.apiario_id
      WHERE c.id = ? AND a.usuario_id = ?`,
    [colmenaId, usuarioId],
  );
  if (filas.length === 0) throw notFound('Colmena no encontrada');
}

/** GET /api/colmenas?apiario_id= */
export async function list(req, res, next) {
  try {
    const params = [propietarioId(req)];
    let sql = `SELECT c.id, c.apiario_id, c.codigo, c.tipo, c.fecha_instalacion, c.estado,
                      c.reina_marcada, c.notas, a.nombre AS apiario_nombre,
                      (SELECT MAX(i.fecha) FROM inspecciones i WHERE i.colmena_id = c.id) AS ultima_inspeccion
                 FROM colmenas c
                 JOIN apiarios a ON a.id = c.apiario_id
                WHERE a.usuario_id = ?`;

    if (req.query.apiario_id !== undefined && req.query.apiario_id !== '') {
      const apiarioId = Number(req.query.apiario_id);
      if (!Number.isInteger(apiarioId) || apiarioId <= 0) {
        throw new HttpError(400, 'apiario_id no válido');
      }
      sql += ' AND c.apiario_id = ?';
      params.push(apiarioId);
    }

    sql += ' ORDER BY a.nombre, c.codigo';
    res.json(await query(sql, params));
  } catch (err) {
    next(err);
  }
}

/** GET /api/colmenas/:id — la colmena y su historial (inspecciones, cosechas, tratamientos). */
export async function getById(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const filas = await query(
      `SELECT c.*, a.nombre AS apiario_nombre
         FROM colmenas c
         JOIN apiarios a ON a.id = c.apiario_id
        WHERE c.id = ? AND a.usuario_id = ?`,
      [id, propietarioId(req)],
    );
    if (filas.length === 0) throw notFound('Colmena no encontrada');

    // Historial de la colmena: en cada sublista incluimos el autor del registro
    // (creado_por y su nombre) mediante LEFT JOIN con usuarios.
    const [inspecciones, cosechas, tratamientos] = await Promise.all([
      query(
        `SELECT i.*, u.nombre AS creado_por_nombre
           FROM inspecciones i
           LEFT JOIN usuarios u ON u.id = i.creado_por
          WHERE i.colmena_id = ?
          ORDER BY i.fecha DESC, i.id DESC`,
        [id],
      ),
      query(
        `SELECT co.*, u.nombre AS creado_por_nombre
           FROM cosechas co
           LEFT JOIN usuarios u ON u.id = co.creado_por
          WHERE co.colmena_id = ?
          ORDER BY co.fecha DESC, co.id DESC`,
        [id],
      ),
      query(
        `SELECT t.*, u.nombre AS creado_por_nombre
           FROM tratamientos t
           LEFT JOIN usuarios u ON u.id = t.creado_por
          WHERE t.colmena_id = ?
          ORDER BY t.fecha_inicio DESC, t.id DESC`,
        [id],
      ),
    ]);

    res.json({ colmena: filas[0], inspecciones, cosechas, tratamientos });
  } catch (err) {
    next(err);
  }
}

/** POST /api/colmenas — crea una colmena dentro de un apiario del usuario. */
export async function create(req, res, next) {
  try {
    const {
      apiario_id,
      codigo,
      tipo = 'langstroth',
      fecha_instalacion = null,
      estado = 'activa',
      reina_marcada = 0,
      notas = null,
    } = req.body;

    await apiarioPertenece(apiario_id, propietarioId(req));

    const resultado = await query(
      `INSERT INTO colmenas (apiario_id, codigo, tipo, fecha_instalacion, estado, reina_marcada, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [apiario_id, codigo, tipo, fecha_instalacion, estado, reina_marcada, notas],
    );

    const [colmena] = await query('SELECT * FROM colmenas WHERE id = ?', [resultado.insertId]);
    res.status(201).json(colmena);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/colmenas/:id */
export async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);
    await colmenaPertenece(id, propietarioId(req));

    // Si se intenta mover la colmena a otro apiario, el destino debe ser del usuario.
    if ('apiario_id' in req.body) {
      await apiarioPertenece(req.body.apiario_id, propietarioId(req));
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
    await query(`UPDATE colmenas SET ${sets.join(', ')} WHERE id = ?`, valores);

    const [colmena] = await query('SELECT * FROM colmenas WHERE id = ?', [id]);
    res.json(colmena);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/colmenas/:id */
export async function remove(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const resultado = await query(
      `DELETE c FROM colmenas c
         JOIN apiarios a ON a.id = c.apiario_id
        WHERE c.id = ? AND a.usuario_id = ?`,
      [id, propietarioId(req)],
    );
    if (resultado.affectedRows === 0) throw notFound('Colmena no encontrada');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
