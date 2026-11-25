/**
 * Controlador del panel (dashboard).
 * Devuelve KPIs, producción mensual, distribución por estado, alertas,
 * el equipo de trabajo y las colmenas prioritarias. Siempre acotado a los
 * datos del DUEÑO de la operación (propietarioId), de modo que un trabajador
 * vea el panel de su dueño.
 */
import { query } from '../config/db.js';
import { propietarioId } from '../utils/scope.js';

const DIAS_INSPECCION_VENCIDA = 14;
const DIAS_MS = 24 * 60 * 60 * 1000;

/** Genera las claves 'AAAA-MM' de los últimos 12 meses (incluyendo el actual). */
function ultimosDoceMeses() {
  const hoy = new Date();
  const meses = [];
  for (let k = 11; k >= 0; k -= 1) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - k, 1);
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return meses;
}

/** GET /api/dashboard */
export async function get(req, res, next) {
  try {
    const usuarioId = propietarioId(req);

    // --- KPIs (una sola consulta con subconsultas) ---------------------------
    const kpisFilas = await query(
      `SELECT
         (SELECT COUNT(*) FROM apiarios WHERE usuario_id = ?) AS total_apiarios,
         (SELECT COUNT(*) FROM colmenas c JOIN apiarios a ON a.id = c.apiario_id
           WHERE a.usuario_id = ?) AS total_colmenas,
         (SELECT COUNT(*) FROM colmenas c JOIN apiarios a ON a.id = c.apiario_id
           WHERE a.usuario_id = ? AND c.estado = 'activa') AS colmenas_activas,
         (SELECT COALESCE(SUM(co.kg_miel), 0) FROM cosechas co
            JOIN colmenas c ON c.id = co.colmena_id JOIN apiarios a ON a.id = c.apiario_id
           WHERE a.usuario_id = ?) AS kg_miel_total,
         (SELECT COALESCE(SUM(co.kg_miel), 0) FROM cosechas co
            JOIN colmenas c ON c.id = co.colmena_id JOIN apiarios a ON a.id = c.apiario_id
           WHERE a.usuario_id = ? AND YEAR(co.fecha) = YEAR(CURDATE())) AS kg_miel_anio,
         (SELECT COUNT(*) FROM inspecciones i
            JOIN colmenas c ON c.id = i.colmena_id JOIN apiarios a ON a.id = c.apiario_id
           WHERE a.usuario_id = ? AND YEAR(i.fecha) = YEAR(CURDATE())
             AND MONTH(i.fecha) = MONTH(CURDATE())) AS inspecciones_mes,
         (SELECT COUNT(*) FROM tratamientos t
            JOIN colmenas c ON c.id = t.colmena_id JOIN apiarios a ON a.id = c.apiario_id
           WHERE a.usuario_id = ? AND t.fecha_fin IS NULL) AS tratamientos_activos`,
      Array(7).fill(usuarioId),
    );

    // --- Producción mensual de los últimos 12 meses --------------------------
    const meses = ultimosDoceMeses();
    const desde = `${meses[0]}-01`;
    const produccionFilas = await query(
      `SELECT DATE_FORMAT(co.fecha, '%Y-%m') AS mes, COALESCE(SUM(co.kg_miel), 0) AS kg
         FROM cosechas co
         JOIN colmenas c ON c.id = co.colmena_id
         JOIN apiarios a ON a.id = c.apiario_id
        WHERE a.usuario_id = ? AND co.fecha >= ?
        GROUP BY mes`,
      [usuarioId, desde],
    );
    const porMes = new Map(produccionFilas.map((f) => [f.mes, Number(f.kg)]));
    const produccion_mensual = meses.map((mes) => ({ mes, kg: porMes.get(mes) || 0 }));

    // --- Distribución de colmenas por estado ---------------------------------
    const distribucion_estado = await query(
      `SELECT c.estado, COUNT(*) AS total
         FROM colmenas c
         JOIN apiarios a ON a.id = c.apiario_id
        WHERE a.usuario_id = ?
        GROUP BY c.estado`,
      [usuarioId],
    );

    // --- Alertas -------------------------------------------------------------
    // Colmenas con su última inspección (o NULL si nunca se inspeccionó).
    const colmenas = await query(
      `SELECT c.id AS colmena_id, c.codigo AS colmena_codigo, c.estado, a.nombre AS apiario_nombre,
              i.fecha AS ultima_fecha, i.nivel_varroa, i.celdas_reales
         FROM colmenas c
         JOIN apiarios a ON a.id = c.apiario_id
         LEFT JOIN inspecciones i ON i.id = (
            SELECT i2.id FROM inspecciones i2
             WHERE i2.colmena_id = c.id
             ORDER BY i2.fecha DESC, i2.id DESC LIMIT 1)
        WHERE a.usuario_id = ?`,
      [usuarioId],
    );

    const alertas = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (const col of colmenas) {
      const base = {
        colmena_id: col.colmena_id,
        colmena_codigo: col.colmena_codigo,
        apiario_nombre: col.apiario_nombre,
      };

      // Última inspección con varroa alto.
      if (col.nivel_varroa !== null && col.nivel_varroa >= 4) {
        alertas.push({
          tipo: 'varroa',
          nivel: 'alta',
          mensaje: `Nivel de varroa alto (${col.nivel_varroa}/5) en la colmena ${col.colmena_codigo}: aplica tratamiento.`,
          ...base,
        });
      }

      // Riesgo de enjambrazón por celdas reales.
      if (col.celdas_reales === 1) {
        alertas.push({
          tipo: 'enjambrazon',
          nivel: 'alta',
          mensaje: `La colmena ${col.colmena_codigo} presenta celdas reales: revisa y previene la enjambrazón.`,
          ...base,
        });
      }

      // Colmena activa sin inspección reciente.
      if (col.estado === 'activa') {
        if (col.ultima_fecha === null) {
          alertas.push({
            tipo: 'inspeccion_vencida',
            nivel: 'media',
            mensaje: `La colmena ${col.colmena_codigo} nunca ha sido inspeccionada.`,
            ...base,
          });
        } else {
          const dias = Math.floor((hoy - new Date(col.ultima_fecha)) / DIAS_MS);
          if (dias > DIAS_INSPECCION_VENCIDA) {
            alertas.push({
              tipo: 'inspeccion_vencida',
              nivel: 'media',
              mensaje: `La colmena ${col.colmena_codigo} no se inspecciona desde hace ${dias} días.`,
              ...base,
            });
          }
        }
      }
    }

    // Tratamientos sin fecha de fin (abiertos).
    const tratamientosAbiertos = await query(
      `SELECT t.tipo, c.id AS colmena_id, c.codigo AS colmena_codigo, a.nombre AS apiario_nombre
         FROM tratamientos t
         JOIN colmenas c ON c.id = t.colmena_id
         JOIN apiarios a ON a.id = c.apiario_id
        WHERE a.usuario_id = ? AND t.fecha_fin IS NULL`,
      [usuarioId],
    );
    for (const t of tratamientosAbiertos) {
      alertas.push({
        tipo: 'tratamiento_abierto',
        nivel: 'media',
        mensaje: `Tratamiento de ${t.tipo} sin fecha de fin en la colmena ${t.colmena_codigo}.`,
        colmena_id: t.colmena_id,
        colmena_codigo: t.colmena_codigo,
        apiario_nombre: t.apiario_nombre,
      });
    }

    // Orden: alertas 'alta' primero.
    alertas.sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'alta' ? -1 : 1));

    // --- Equipo (dueño + sus trabajadores con su actividad) ------------------
    // Misma lógica que trabajadores.controller.list, versión compacta.
    const equipo = await query(
      `SELECT u.id, u.nombre, u.email, u.rol,
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
      [usuarioId, usuarioId, usuarioId, usuarioId],
    );

    // --- Próximas inspecciones ----------------------------------------------
    // Colmenas activas sin inspección en más de 14 días (o nunca inspeccionadas).
    // Convención: si la colmena nunca fue inspeccionada, dias_sin_inspeccion = 999.
    const activasFilas = await query(
      `SELECT c.id AS colmena_id, c.codigo AS colmena_codigo, a.nombre AS apiario_nombre,
              MAX(i.fecha) AS ultima_fecha
         FROM colmenas c
         JOIN apiarios a ON a.id = c.apiario_id
         LEFT JOIN inspecciones i ON i.colmena_id = c.id
        WHERE a.usuario_id = ? AND c.estado = 'activa'
        GROUP BY c.id, c.codigo, a.nombre`,
      [usuarioId],
    );
    const proximas_inspecciones = activasFilas
      .map((c) => ({
        colmena_id: c.colmena_id,
        colmena_codigo: c.colmena_codigo,
        apiario_nombre: c.apiario_nombre,
        dias_sin_inspeccion:
          c.ultima_fecha === null ? 999 : Math.floor((hoy - new Date(c.ultima_fecha)) / DIAS_MS),
      }))
      .filter((c) => c.dias_sin_inspeccion > DIAS_INSPECCION_VENCIDA)
      .sort((a, b) => b.dias_sin_inspeccion - a.dias_sin_inspeccion)
      .slice(0, 10);

    // --- Top colmenas por producción acumulada ------------------------------
    const top_colmenas = await query(
      `SELECT c.id AS colmena_id, c.codigo AS colmena_codigo, a.nombre AS apiario_nombre,
              COALESCE(SUM(co.kg_miel), 0) AS kg_total
         FROM colmenas c
         JOIN apiarios a ON a.id = c.apiario_id
         JOIN cosechas co ON co.colmena_id = c.id
        WHERE a.usuario_id = ?
        GROUP BY c.id, c.codigo, a.nombre
        ORDER BY kg_total DESC
        LIMIT 5`,
      [usuarioId],
    );

    // --- Tipos de miel más producidos (top 5) -------------------------------
    // Responde a "¿cuál miel es la más producida?" por tipo (azahar, mezquite…).
    const tipos_miel = await query(
      `SELECT co.tipo_miel, COALESCE(SUM(co.kg_miel), 0) AS kg
         FROM cosechas co
         JOIN colmenas c ON c.id = co.colmena_id
         JOIN apiarios a ON a.id = c.apiario_id
        WHERE a.usuario_id = ? AND co.tipo_miel IS NOT NULL AND co.tipo_miel <> ''
        GROUP BY co.tipo_miel
        ORDER BY kg DESC
        LIMIT 5`,
      [usuarioId],
    );
    tipos_miel.forEach((t) => {
      t.kg = Number(t.kg);
    });

    res.json({
      kpis: kpisFilas[0],
      produccion_mensual,
      distribucion_estado,
      alertas,
      equipo,
      proximas_inspecciones,
      top_colmenas,
      tipos_miel,
    });
  } catch (err) {
    next(err);
  }
}
