import { Link, useParams } from 'react-router-dom';
import useFetch from '../hooks/useFetch.js';
import Loader from '../components/Loader.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import WeatherWidget from '../components/WeatherWidget.jsx';
import { formatearFecha } from '../utils/format.js';

/** Variante de badge según el estado de la colmena. */
export function varianteEstado(estado = '') {
  const e = estado.toLowerCase();
  if (e.includes('activ') || e.includes('productiv') || e.includes('fuerte')) return 'ok';
  if (e.includes('débil') || e.includes('debil') || e.includes('reina')) return 'alerta';
  if (e.includes('muert') || e.includes('vacía') || e.includes('vacia') || e.includes('enferma')) return 'peligro';
  return 'neutro';
}

/**
 * Detalle de un apiario: datos, clima del sitio y lista de sus colmenas.
 */
export default function ApiarioDetalle() {
  const { id } = useParams();
  const { datos, cargando, error } = useFetch(`/apiarios/${id}`);

  if (cargando) return <Loader mensaje="Cargando apiario…" />;

  if (error) {
    return (
      <div className="pila">
        <div className="aviso aviso--error" role="alert">
          No se pudo cargar el apiario: {error.message}
        </div>
        <Link className="btn btn--secundario" to="/apiarios">← Volver a apiarios</Link>
      </div>
    );
  }

  if (!datos) return null;

  const colmenas = Array.isArray(datos.colmenas) ? datos.colmenas : [];

  return (
    <div className="pila">
      <div className="seccion-titulo">
        <div>
          <Link className="texto-pequeno" to="/apiarios">← Apiarios</Link>
          <h1 style={{ marginBottom: 0 }}>{datos.nombre}</h1>
          {datos.municipio && <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>📍 {datos.municipio}</p>}
        </div>
        <div className="acciones-fila">
          <Link className="btn btn--verde" to={`/colmenas?apiario_id=${datos.id}`}>Ver colmenas</Link>
        </div>
      </div>

      <section className="grid grid--dos">
        <article className="tarjeta">
          <h2 className="tarjeta__titulo">Información del apiario</h2>
          <dl className="detalle-lista">
            {datos.descripcion && (
              <>
                <dt>Descripción</dt>
                <dd>{datos.descripcion}</dd>
              </>
            )}
            <dt>Colmenas</dt>
            <dd>
              {datos.total_colmenas ?? colmenas.length} total · {datos.colmenas_activas ?? 0} activas
            </dd>
            {datos.lat != null && (
              <>
                <dt>Coordenadas</dt>
                <dd className="coordenadas">{Number(datos.lat).toFixed(5)}, {Number(datos.lng).toFixed(5)}</dd>
              </>
            )}
            <dt>Creado</dt>
            <dd>{formatearFecha(datos.created_at)}</dd>
          </dl>
        </article>

        <article className="tarjeta">
          <h2 className="tarjeta__titulo">Clima en el apiario</h2>
          <WeatherWidget lat={datos.lat} lng={datos.lng} ubicacionNombre={datos.municipio || datos.nombre} />
        </article>
      </section>

      <section className="tarjeta">
        <div className="seccion-titulo" style={{ marginBottom: '0.75rem' }}>
          <h2 className="tarjeta__titulo">Colmenas ({colmenas.length})</h2>
        </div>

        {colmenas.length === 0 ? (
          <EmptyState
            icono="🏠"
            titulo="Este apiario no tiene colmenas"
            mensaje="Agrega colmenas desde la sección Colmenas seleccionando este apiario."
            accion={<Link className="btn btn--primario" to={`/colmenas?apiario_id=${datos.id}`}>Agregar colmena</Link>}
          />
        ) : (
          <div className="tabla-scroll">
            <table className="tabla tabla--tarjetas">
              <thead>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Reina</th>
                  <th scope="col">Instalación</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {colmenas.map((c) => (
                  <tr key={c.id}>
                    <td data-label="Código"><strong>{c.codigo}</strong></td>
                    <td data-label="Tipo">{c.tipo}</td>
                    <td data-label="Estado"><Badge variante={varianteEstado(c.estado)}>{c.estado}</Badge></td>
                    <td data-label="Reina">{c.reina_marcada ? 'Sí' : 'No'}</td>
                    <td data-label="Instalación">{formatearFecha(c.fecha_instalacion)}</td>
                    <td data-label="Acciones">
                      <Link className="btn btn--pequeno btn--secundario" to={`/colmenas/${c.id}`}>Abrir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
