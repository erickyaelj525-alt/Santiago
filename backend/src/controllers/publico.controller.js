/**
 * Controlador PÚBLICO (no requiere iniciar sesión).
 *
 * Expone únicamente estadísticas AGREGADAS y ANÓNIMAS de la plataforma, para
 * alimentar el panel informativo que se muestra en la página de inicio antes de
 * entrar. Por privacidad NO devuelve correos, nombres, ubicaciones ni registros
 * individuales: solo totales y promedios de todo el sistema.
 */
import { query } from '../config/db.js';

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

/** GET /api/publico/estadisticas */
export async function estadisticas(_req, res, next) {
  try {
    // --- Totales generales de la plataforma ----------------------------------
    const [resumen] = await query(
      `SELECT
         (SELECT COUNT(*) FROM usuarios)                     AS total_apicultores,
         (SELECT COUNT(*) FROM apiarios)                     AS total_apiarios,
         (SELECT COUNT(*) FROM colmenas)                     AS total_colmenas,
         (SELECT COUNT(*) FROM colmenas WHERE estado = 'activa') AS colmenas_activas,
         (SELECT COALESCE(SUM(kg_miel), 0) FROM cosechas)    AS kg_miel_total,
         (SELECT COUNT(*) FROM inspecciones)                 AS total_inspecciones,
         (SELECT COUNT(*) FROM cosechas)                     AS total_cosechas,
         (SELECT COUNT(*) FROM tratamientos)                 AS total_tratamientos`,
    );
    // SUM() de DECIMAL llega como texto; lo convertimos a número.
    resumen.kg_miel_total = Number(resumen.kg_miel_total);

    // --- Producción de miel de los últimos 12 meses --------------------------
    const meses = ultimosDoceMeses();
    const desde = `${meses[0]}-01`;
    const produccionFilas = await query(
      `SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes, COALESCE(SUM(kg_miel), 0) AS kg
         FROM cosechas
        WHERE fecha >= ?
        GROUP BY mes`,
      [desde],
    );
    const porMes = new Map(produccionFilas.map((f) => [f.mes, Number(f.kg)]));
    const produccion_mensual = meses.map((mes) => ({ mes, kg: porMes.get(mes) || 0 }));

    // --- Distribución de colmenas por estado ---------------------------------
    const distribucion_colmenas = await query(
      `SELECT estado, COUNT(*) AS total FROM colmenas GROUP BY estado`,
    );

    // --- Tipos de miel más producidos (top 5) --------------------------------
    const tipos_miel = await query(
      `SELECT tipo_miel, COALESCE(SUM(kg_miel), 0) AS kg
         FROM cosechas
        WHERE tipo_miel IS NOT NULL AND tipo_miel <> ''
        GROUP BY tipo_miel
        ORDER BY kg DESC
        LIMIT 5`,
    );
    tipos_miel.forEach((t) => {
      t.kg = Number(t.kg);
    });

    res.json({
      resumen,
      produccion_mensual,
      distribucion_colmenas,
      tipos_miel,
      actualizado_en: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
