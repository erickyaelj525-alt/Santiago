import { useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { formatearMesMensual, formatearNumero, formatearKg } from '../utils/format.js';

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
