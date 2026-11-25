/**
 * Controlador de inspecciones.
 * Toda inspección pertenece a una colmena que, a su vez, pertenece a un apiario
 * del usuario autenticado; esa cadena se verifica antes de leer o escribir.
 */
import { query } from '../config/db.js';
import { HttpError, notFound } from '../utils/httpError.js';
import { propietarioId } from '../utils/scope.js';

const CAMPOS_ACTUALIZABLES = [
  'colmena_id',
  'fecha',
  'poblacion',
  'temperamento',
  'presencia_reina',
  'celdas_reales',
  'nivel_varroa',
  'alimento_miel',
  'alimento_polen',
  'clima_temp',
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

/** GET /api/inspecciones?colmena_id= */
export async function list(req, res, next) {
  try {
    const params = [propietarioId(req)];
    let sql = `SELECT i.*, c.codigo AS colmena_codigo, u.nombre AS creado_por_nombre
                 FROM inspecciones i
                 JOIN colmenas c ON c.id = i.colmena_id
                 JOIN apiarios a ON a.id = c.apiario_id
                 LEFT JOIN usuarios u ON u.id = i.creado_por
                WHERE a.usuario_id = ?`;

    if (req.query.colmena_id !== undefined && req.query.colmena_id !== '') {
      const colmenaId = Number(req.query.colmena_id);
      if (!Number.isInteger(colmenaId) || colmenaId <= 0) {
        throw new HttpError(400, 'colmena_id no válido');
      }
      sql += ' AND i.colmena_id = ?';
      params.push(colmenaId);
    }

    sql += ' ORDER BY i.fecha DESC, i.id DESC';
    res.json(await query(sql, params));
  } catch (err) {
    next(err);
  }
}

/** POST /api/inspecciones */
export async function create(req, res, next) {
  try {
    const {
      colmena_id,
      fecha,
      poblacion,
      temperamento,
      presencia_reina,
      celdas_reales,
      nivel_varroa,
      alimento_miel,
      alimento_polen,
      clima_temp = null,
      notas = null,
    } = req.body;

    await colmenaPertenece(colmena_id, propietarioId(req));

    // creado_por guarda la CUENTA real que registró (dueño o trabajador).
    const resultado = await query(
      `INSERT INTO inspecciones
        (colmena_id, fecha, poblacion, temperamento, presencia_reina, celdas_reales,
         nivel_varroa, alimento_miel, alimento_polen, clima_temp, notas, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        colmena_id,
        fecha,
        poblacion,
        temperamento,
        presencia_reina,
        celdas_reales,
        nivel_varroa,
        alimento_miel,
        alimento_polen,
        clima_temp,
        notas,
        req.user.id,
      ],
    );

    const [inspeccion] = await query('SELECT * FROM inspecciones WHERE id = ?', [
      resultado.insertId,
    ]);
    res.status(201).json(inspeccion);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/inspecciones/:id */
export async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);

    const existente = await query(
      `SELECT i.id FROM inspecciones i
         JOIN colmenas c ON c.id = i.colmena_id
         JOIN apiarios a ON a.id = c.apiario_id
        WHERE i.id = ? AND a.usuario_id = ?`,
      [id, propietarioId(req)],
    );
    if (existente.length === 0) throw notFound('Inspección no encontrada');

    // Si se cambia la colmena destino, debe pertenecer al usuario.
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
    await query(`UPDATE inspecciones SET ${sets.join(', ')} WHERE id = ?`, valores);

    const [inspeccion] = await query('SELECT * FROM inspecciones WHERE id = ?', [id]);
    res.json(inspeccion);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/inspecciones/:id */
export async function remove(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const resultado = await query(
      `DELETE i FROM inspecciones i
         JOIN colmenas c ON c.id = i.colmena_id
         JOIN apiarios a ON a.id = c.apiario_id
        WHERE i.id = ? AND a.usuario_id = ?`,
      [id, propietarioId(req)],
    );
    if (resultado.affectedRows === 0) throw notFound('Inspección no encontrada');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
