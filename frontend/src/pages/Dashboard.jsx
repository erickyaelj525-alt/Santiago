import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import useFetch from '../hooks/useFetch.js';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import KpiCard from '../components/KpiCard.jsx';
import AlertList from '../components/AlertList.jsx';
import WeatherWidget from '../components/WeatherWidget.jsx';
import Badge from '../components/Badge.jsx';
import {
  formatearMesMensual,
  formatearNumero,
  formatearKg,
  formatearFechaCorta,
  etiquetaRol,
} from '../utils/format.js';

// Paleta para la gráfica de distribución por estado.
const COLORES = ['#F2A93B', '#3E7C4A', '#2F6F9F', '#C0392B', '#8E6FBF', '#D98F1F'];

/**
 * Panel principal: KPIs, producción mensual, distribución por estado,
 * alertas y clima del primer apiario.
 */
export default function Dashboard() {
  const { datos, cargando, error, refetch } = useFetch('/dashboard');
  // Se usa para el clima del primer apiario (o CDMX por defecto).
  const { datos: apiarios } = useFetch('/apiarios');
  const ubicacion = useLocation();

  // Aviso enviado por ProtectedRoute al redirigir a un trabajador (p. ej. /equipo).
  const aviso = ubicacion.state?.aviso;

  const primerApiario = useMemo(
    () => (Array.isArray(apiarios) ? apiarios.find((a) => a.lat != null && a.lng != null) : null),
    [apiarios],
  );

  const produccion = useMemo(
    () =>
      (datos?.produccion_mensual || []).map((p) => ({
        mes: formatearMesMensual(p.mes),
        kg: Number(p.kg) || 0,
      })),
    [datos],
  );

  const distribucion = useMemo(
    () =>
      (datos?.distribucion_estado || []).map((d) => ({
        name: d.estado,
        value: Number(d.total) || 0,
      })),
    [datos],
  );

  if (cargando) return <Loader mensaje="Cargando tu panel…" />;

  if (error) {
    return (
      <div className="aviso aviso--error" role="alert">
        <p>No se pudo cargar el dashboard: {error.message}</p>
        <button type="button" className="btn btn--secundario btn--pequeno" onClick={refetch}>
          Reintentar
        </button>
      </div>
    );
  }

  const kpis = datos?.kpis || {};
  const sinApiarios = (kpis.total_apiarios ?? 0) === 0;

  // Bloques nuevos del dashboard: equipo, próximas inspecciones y top colmenas.
  const equipo = datos?.equipo || [];
  const proximas = datos?.proximas_inspecciones || [];
  const topColmenas = datos?.top_colmenas || [];
  const tiposMiel = datos?.tipos_miel || [];

  return (
    <div className="pila">
      <div className="seccion-titulo">
        <div>
          <h1>Panel general</h1>
          <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>
            Resumen de tu operación apícola.
          </p>
        </div>
        <Link to="/apiarios" className="btn btn--primario">Gestionar apiarios</Link>
      </div>

      {aviso && (
        <div className="aviso aviso--info" role="status">
          ℹ️ {aviso}
        </div>
      )}

      {sinApiarios ? (
        <EmptyState
          icono="🍯"
          titulo="Aún no tienes apiarios"
          mensaje="Crea tu primer apiario para comenzar a registrar colmenas, inspecciones y cosechas."
          accion={<Link to="/apiarios" className="btn btn--primario">Crear mi primer apiario</Link>}
        />
      ) : (
        <>
          {/* KPIs: 7 tarjetas */}
          <section aria-label="Indicadores clave" className="grid grid--kpis">
            <KpiCard icono="📍" etiqueta="Apiarios" valor={formatearNumero(kpis.total_apiarios)} />
            <KpiCard icono="🏠" etiqueta="Colmenas" valor={formatearNumero(kpis.total_colmenas)} />
            <KpiCard icono="🐝" etiqueta="Colmenas activas" valor={formatearNumero(kpis.colmenas_activas)} />
            <KpiCard icono="🍯" etiqueta="Miel total" valor={formatearKg(kpis.kg_miel_total)} />
            <KpiCard icono="📅" etiqueta="Miel este año" valor={formatearKg(kpis.kg_miel_anio)} />
            <KpiCard icono="🔍" etiqueta="Inspecciones (mes)" valor={formatearNumero(kpis.inspecciones_mes)} />
            <KpiCard icono="💊" etiqueta="Tratamientos activos" valor={formatearNumero(kpis.tratamientos_activos)} />
          </section>

          {/* Gráficas */}
          <section className="grid grid--dos">
            <article className="tarjeta">
              <h2 className="tarjeta__titulo">Producción mensual de miel</h2>
              <p className="texto-suave texto-pequeno">Kilogramos cosechados por mes.</p>
              {produccion.length ? (
                <div className="grafica-caja">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={produccion} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ece2d3" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => [`${v} kg`, 'Miel']} />
                      <Bar dataKey="kg" fill="#F2A93B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="texto-suave texto-pequeno">Sin cosechas registradas todavía.</p>
              )}
            </article>

            <article className="tarjeta">
              <h2 className="tarjeta__titulo">Distribución por estado</h2>
              <p className="texto-suave texto-pequeno">Estado de tus colmenas.</p>
              {distribucion.length ? (
                <div className="grafica-caja">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribucion}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {distribucion.map((entrada, i) => (
                          <Cell key={entrada.name} fill={COLORES[i % COLORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="texto-suave texto-pequeno">Sin colmenas registradas.</p>
              )}
            </article>
          </section>
        </>
      )}

      {/* Resúmenes de gestión: equipo, inspecciones pendientes y top colmenas */}
      <section className="grid grid--tarjetas" aria-label="Resúmenes de gestión">
        {/* Equipo y actividad */}
        <article className="tarjeta">
          <h2 className="tarjeta__titulo">Equipo y actividad</h2>
          <p className="texto-suave texto-pequeno">Inspecciones registradas por cada miembro.</p>
          {equipo.length ? (
            <ul className="lista-miembros">
              {equipo.map((m) => (
                <li key={m.id} className="lista-miembros__item">
                  <div className="fila fila--separar fila--wrap" style={{ gap: '0.4rem' }}>
                    <strong>{m.nombre}</strong>
                    <Badge variante={m.rol === 'dueno' ? 'alerta' : 'info'}>{etiquetaRol(m.rol)}</Badge>
                  </div>
                  <div className="texto-pequeno texto-suave">
                    🔍 {formatearNumero(m.inspecciones_registradas)} inspecciones
                    {m.ultima_actividad ? ` · última ${formatearFechaCorta(m.ultima_actividad)}` : ' · sin actividad'}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="texto-suave texto-pequeno">Sin miembros registrados.</p>
          )}
        </article>

        {/* Próximas inspecciones pendientes */}
        <article className="tarjeta">
          <h2 className="tarjeta__titulo">Próximas inspecciones pendientes</h2>
          <p className="texto-suave texto-pequeno">Colmenas con más días sin revisión.</p>
          {proximas.length ? (
            <ul className="lista-miembros">
              {proximas.map((p) => (
                <li key={p.colmena_id} className="lista-miembros__item">
                  <div className="fila fila--separar fila--wrap" style={{ gap: '0.4rem' }}>
                    <Link to={`/colmenas/${p.colmena_id}`}>
                      <strong>Colmena {p.colmena_codigo}</strong>
                    </Link>
                    <Badge variante={p.dias_sin_inspeccion >= 30 ? 'peligro' : 'alerta'}>
                      {formatearNumero(p.dias_sin_inspeccion)} días
                    </Badge>
                  </div>
                  {p.apiario_nombre && (
                    <div className="texto-pequeno texto-suave">📍 {p.apiario_nombre}</div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="texto-suave texto-pequeno">No hay inspecciones pendientes. ¡Buen trabajo!</p>
          )}
        </article>

        {/* Top colmenas productivas */}
        <article className="tarjeta">
          <h2 className="tarjeta__titulo">Top colmenas productivas</h2>
          <p className="texto-suave texto-pequeno">Mayor producción acumulada de miel.</p>
          {topColmenas.length ? (
            <ul className="lista-miembros">
              {topColmenas.map((c, i) => (
                <li key={c.colmena_id} className="lista-miembros__item">
                  <div className="fila fila--separar fila--wrap" style={{ gap: '0.4rem' }}>
                    <Link to={`/colmenas/${c.colmena_id}`}>
                      <strong>
                        {i + 1}. Colmena {c.colmena_codigo}
                      </strong>
                    </Link>
                    <span className="texto-ok" style={{ fontWeight: 700 }}>{formatearKg(c.kg_total)}</span>
                  </div>
                  {c.apiario_nombre && (
                    <div className="texto-pequeno texto-suave">📍 {c.apiario_nombre}</div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="texto-suave texto-pequeno">Aún no hay cosechas registradas.</p>
          )}
        </article>

        {/* Tipos de miel más producidos */}
        <article className="tarjeta">
          <h2 className="tarjeta__titulo">Tipos de miel más producidos</h2>
          <p className="texto-suave texto-pequeno">Miel acumulada por tipo (historial completo).</p>
          {tiposMiel.length ? (
            <ul className="lista-miembros">
              {tiposMiel.map((t, i) => (
                <li key={t.tipo_miel} className="lista-miembros__item">
                  <div className="fila fila--separar fila--wrap" style={{ gap: '0.4rem' }}>
                    <strong>
                      {i + 1}. {t.tipo_miel}
                    </strong>
                    <span className="texto-ok" style={{ fontWeight: 700 }}>{formatearKg(t.kg)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="texto-suave texto-pequeno">
              Registra el tipo de miel al capturar una cosecha para ver este ranking.
            </p>
          )}
        </article>
      </section>

      {/* Alertas + Clima */}
      <section className="grid grid--dos">
        <article className="tarjeta">
          <h2 className="tarjeta__titulo">Alertas sanitarias</h2>
          <p className="texto-suave texto-pequeno">Situaciones que requieren tu atención.</p>
          <AlertList alertas={datos?.alertas || []} />
        </article>

        <article className="tarjeta">
          <h2 className="tarjeta__titulo">Clima apícola</h2>
          <p className="texto-suave texto-pequeno">
            {primerApiario
              ? `Clima en ${primerApiario.nombre}`
              : 'Clima en Ciudad de México (agrega un apiario con coordenadas)'}
          </p>
          <WeatherWidget
            lat={primerApiario?.lat}
            lng={primerApiario?.lng}
            ubicacionNombre={primerApiario?.nombre}
          />
        </article>
      </section>
    </div>
  );
}
