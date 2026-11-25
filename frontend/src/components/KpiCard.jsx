/**
 * Tarjeta de indicador (KPI) para el dashboard.
 */
export default function KpiCard({ icono = '📊', etiqueta, valor, unidad, nota }) {
  return (
    <article className="kpi">
      <div className="kpi__icono" aria-hidden="true">{icono}</div>
      <div className="kpi__valor">
        {valor}
        {unidad && <span className="texto-pequeno texto-suave"> {unidad}</span>}
      </div>
      <div className="kpi__etiqueta">{etiqueta}</div>
      {nota && <div className="texto-pequeno texto-suave">{nota}</div>}
    </article>
  );
}
