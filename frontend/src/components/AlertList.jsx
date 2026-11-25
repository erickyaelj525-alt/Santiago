import { Link } from 'react-router-dom';

/**
 * Lista de alertas del dashboard, con color según el nivel (alta/media).
 */
export default function AlertList({ alertas = [] }) {
  if (!alertas.length) {
    return (
      <div className="aviso aviso--ok" role="status">
        ✅ Sin alertas por ahora. Tus colmenas están en orden.
      </div>
    );
  }

  return (
    <ul className="pila" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {alertas.map((a, i) => (
        <li key={`${a.colmena_id}-${a.tipo}-${i}`} className={`alerta-item alerta-item--${a.nivel}`}>
          <span aria-hidden="true">{a.nivel === 'alta' ? '⚠️' : '🔔'}</span>
          <div className="crecer">
            <div className="fila fila--wrap" style={{ gap: '0.4rem' }}>
              <strong>{a.tipo}</strong>
              <span className={`badge ${a.nivel === 'alta' ? 'badge--peligro' : 'badge--alerta'}`}>
                {a.nivel === 'alta' ? 'Alta' : 'Media'}
              </span>
            </div>
            <p className="texto-pequeno" style={{ margin: '0.25rem 0' }}>{a.mensaje}</p>
            <div className="texto-pequeno texto-suave">
              {a.colmena_codigo && <span>Colmena {a.colmena_codigo}</span>}
              {a.apiario_nombre && <span> · {a.apiario_nombre}</span>}
            </div>
          </div>
          {a.colmena_id && (
            <Link className="btn btn--pequeno btn--secundario" to={`/colmenas/${a.colmena_id}`}>
              Ver
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
