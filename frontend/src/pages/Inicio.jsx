import { useCallback, useEffect, useRef, useState } from 'react';
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

import useAuth from '../hooks/useAuth.js';
import Logo from '../components/Logo.jsx';
import KpiCard from '../components/KpiCard.jsx';
import Loader from '../components/Loader.jsx';
import BotonWhatsApp from '../components/BotonWhatsApp.jsx';
import { getPublico } from '../api/client.js';
import { WHATSAPP_DISPLAY, urlWhatsApp } from '../utils/contacto.js';
import {
  formatearMesMensual,
  formatearNumero,
  formatearKg,
  formatearFechaHora,
  capitalizar,
} from '../utils/format.js';

// Paleta para la gráfica de dona (misma que el dashboard privado).
const COLORES = ['#F2A93B', '#3E7C4A', '#2F6F9F', '#C0392B', '#8E6FBF', '#D98F1F'];

// Etiquetas legibles del estado de las colmenas.
const ESTADOS = {
  activa: 'Activas',
  débil: 'Débiles',
  reina_nueva: 'Reina nueva',
  vacía: 'Vacías',
  enferma: 'Enfermas',
  muerta: 'Muertas',
};

// Tarjetas de la sección "¿Qué puedes hacer?".
const CARACTERISTICAS = [
  {
    icono: '📍',
    titulo: 'Registro de apiarios y colmenas',
    texto: 'Ubica cada apiario en el mapa y lleva el control de todas tus colmenas.',
  },
  {
    icono: '🔍',
    titulo: 'Inspecciones y alertas sanitarias',
    texto: 'Registra revisiones y recibe avisos cuando una colmena requiere atención.',
  },
  {
    icono: '🍯',
    titulo: 'Cosechas y producción',
    texto: 'Documenta cada cosecha y analiza los kilos de miel producidos por colmena.',
  },
  {
    icono: '🌤️',
    titulo: 'Clima apícola',
    texto: 'Consulta el clima de tus apiarios y su aptitud para el trabajo en campo.',
  },
  {
    icono: '👥',
    titulo: 'Equipo de trabajo por roles',
    texto: 'Invita a tus trabajadores y define permisos según su rol en la operación.',
  },
  {
    icono: '📊',
    titulo: 'Reportes',
    texto: 'Visualiza tu operación con indicadores y gráficas listas para decidir.',
  },
];

// Pasos de "Cómo funciona".
const PASOS = [
  {
    numero: '1',
    titulo: 'Crea tu cuenta',
    texto: 'Regístrate como dueño y empieza a gestionar tu apiario de inmediato.',
  },
  {
    numero: '2',
    titulo: 'Registra tu operación',
    texto: 'Da de alta tus apiarios en el mapa, tus colmenas y tu equipo de trabajo con roles.',
  },
  {
    numero: '3',
    titulo: 'Decide con datos',
    texto: 'Consulta inspecciones, cosechas, alertas sanitarias y clima para mejorar tu producción.',
  },
];

// Perfiles de usuario de la plataforma.
const ROLES = [
  {
    icono: '👑',
    titulo: 'Dueño de apiario',
    texto: 'Administra la operación completa: apiarios, colmenas, cosechas y su equipo de trabajo.',
  },
  {
    icono: '🐝',
    titulo: 'Trabajador',
    texto: 'Cuenta que crea el dueño para su equipo. Comparte los apiarios y la información de campo, sin poder eliminarlos.',
  },
];

/**
 * Página de inicio pública: presenta la plataforma con datos agregados y
 * anónimos de la comunidad. No requiere iniciar sesión.
 */
export default function Inicio() {
  const { usuario } = useAuth();

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  // Carga las estadísticas públicas (sin token).
  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getPublico('/publico/estadisticas');
      if (montado.current) setDatos(data);
    } catch (err) {
      if (montado.current) setError(err);
    } finally {
      if (montado.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const resumen = datos?.resumen || {};
  const produccion = (datos?.produccion_mensual || []).map((p) => ({
    mes: formatearMesMensual(p.mes),
    kg: Number(p.kg) || 0,
  }));
  const distribucion = (datos?.distribucion_colmenas || []).map((d) => ({
    name: ESTADOS[d.estado] || capitalizar(d.estado),
    value: Number(d.total) || 0,
  }));
  const tiposMiel = (datos?.tipos_miel || []).map((t) => ({
    nombre: capitalizar(t.tipo_miel),
    kg: Number(t.kg) || 0,
  }));
  const maxTipo = tiposMiel.reduce((max, t) => Math.max(max, t.kg), 0);

  return (
    <div className="inicio">
      {/* Encabezado público */}
      <header className="inicio-header">
        <div className="contenedor inicio-header__inner">
          <Link to="/" className="inicio-header__marca" aria-label="Apiario Digital, ir al inicio">
            <Logo size={34} />
            <span>Apiario Digital</span>
          </Link>

          <nav className="inicio-header__acciones" aria-label="Acceso a la cuenta">
            {usuario ? (
              <Link to="/dashboard" className="btn btn--primario btn--pequeno">
                Ir a mi panel
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn--secundario btn--pequeno">
                  Iniciar sesión
                </Link>
                <Link to="/registro" className="btn btn--primario btn--pequeno">
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="inicio__contenido">
        {/* Hero */}
        <section className="hero" aria-labelledby="hero-titulo">
          <div className="contenedor hero__inner">
            <div className="hero__columna">
              <span className="hero__etiqueta">Plataforma apícola</span>
              <h1 id="hero-titulo" className="hero__titulo">
                Digitaliza tu apiario, colmena por colmena
              </h1>
              <p className="hero__texto">
                Apiario Digital reúne la gestión de tus apiarios, colmenas, inspecciones,
                cosechas, alertas sanitarias y clima apícola en un solo lugar. Lleva tu
                operación ordenada y toma mejores decisiones con datos claros.
              </p>
              <div className="hero__acciones">
                <Link to="/registro" className="btn btn--primario">
                  Empezar gratis
                </Link>
                <Link to="/login" className="btn btn--contorno">
                  Ya tengo cuenta
                </Link>
              </div>
              <ul className="hero__chips" aria-label="Características destacadas">
                <li>✔ Sin tarjeta</li>
                <li>✔ Roles de equipo</li>
                <li>✔ Verificación por correo</li>
              </ul>
            </div>

            <div className="hero__panel" aria-hidden="true">
              <div className="hero__panel-fila">
                <span className="hero__panel-punto" />
                <span className="hero__panel-punto" />
                <span className="hero__panel-punto" />
              </div>
              <div className="hero__panel-cuerpo">
                <div className="hero__panel-bloque">
                  <span className="hero__panel-label">Colmenas activas</span>
                  <strong className="hero__panel-valor">84</strong>
                </div>
                <div className="hero__panel-bloque">
                  <span className="hero__panel-label">Producción</span>
                  <strong className="hero__panel-valor">612 kg</strong>
                </div>
                <div className="hero__panel-bloque hero__panel-bloque--ancho">
                  <span className="hero__panel-label">Estado sanitario</span>
                  <div className="hero__panel-barras">
                    <span style={{ width: '72%' }} />
                  </div>
                </div>
                <div className="hero__panel-bloque">
                  <span className="hero__panel-label">Inspecciones</span>
                  <strong className="hero__panel-valor">136</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Panel de datos públicos */}
        <section className="inicio-seccion" aria-labelledby="datos-titulo">
          <div className="contenedor">
            <div className="inicio-seccion__cabecera">
              <h2 id="datos-titulo">La plataforma en números</h2>
              <p className="texto-suave">
                Estadísticas agregadas y anónimas de todos los apicultores de la comunidad.
              </p>
            </div>

            {cargando && (
              <div aria-busy="true">
                <Loader mensaje="Cargando estadísticas de la comunidad…" />
              </div>
            )}

            {!cargando && error && (
              <div className="aviso aviso--error" role="alert">
                <p style={{ margin: 0 }}>
                  No pudimos cargar las estadísticas. {error.message}
                </p>
                <button
                  type="button"
                  className="btn btn--secundario btn--pequeno mt-1"
                  onClick={cargar}
                >
                  Reintentar
                </button>
              </div>
            )}

            {!cargando && !error && datos && (
              <>
                <section aria-label="Indicadores de la comunidad" className="grid grid--kpis">
                  <KpiCard icono="👥" etiqueta="Apicultores" valor={formatearNumero(resumen.total_apicultores)} />
                  <KpiCard icono="📍" etiqueta="Apiarios" valor={formatearNumero(resumen.total_apiarios)} />
                  <KpiCard icono="🏠" etiqueta="Colmenas" valor={formatearNumero(resumen.total_colmenas)} />
                  <KpiCard icono="🐝" etiqueta="Colmenas activas" valor={formatearNumero(resumen.colmenas_activas)} />
                  <KpiCard icono="🍯" etiqueta="Miel producida" valor={formatearKg(resumen.kg_miel_total)} />
                  <KpiCard icono="🔍" etiqueta="Inspecciones" valor={formatearNumero(resumen.total_inspecciones)} />
                  <KpiCard icono="📦" etiqueta="Cosechas" valor={formatearNumero(resumen.total_cosechas)} />
                  <KpiCard icono="💊" etiqueta="Tratamientos" valor={formatearNumero(resumen.total_tratamientos)} />
                </section>

                <div className="grid grid--dos mt-2">
                  {/* Producción mensual */}
                  <article className="tarjeta">
                    <h3 className="tarjeta__titulo">Producción de miel</h3>
                    <p className="texto-suave texto-pequeno">Kilogramos por mes (últimos 12 meses).</p>
                    {produccion.length ? (
                      <div className="grafica-caja">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={produccion} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ece2d3" vertical={false} />
                            <XAxis dataKey="mes" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(v) => [`${v} kg`, 'Miel']} />
                            <Bar dataKey="kg" fill="#F2A93B" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="texto-suave texto-pequeno">Aún no hay producción registrada.</p>
                    )}
                  </article>

                  {/* Estado de las colmenas */}
                  <article className="tarjeta">
                    <h3 className="tarjeta__titulo">Estado de las colmenas</h3>
                    <p className="texto-suave texto-pequeno">Distribución por situación actual.</p>
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
                </div>

                {/* Tipos de miel más producidos */}
                <article className="tarjeta mt-2">
                  <h3 className="tarjeta__titulo">Tipos de miel más producidos</h3>
                  <p className="texto-suave texto-pequeno">Kilos acumulados por variedad de miel.</p>
                  {tiposMiel.length ? (
                    <ul className="tipo-miel">
                      {tiposMiel.map((t) => (
                        <li key={t.nombre}>
                          <div className="tipo-miel__fila">
                            <span className="tipo-miel__nombre">🍯 {t.nombre}</span>
                            <span className="texto-suave texto-pequeno">{formatearKg(t.kg)}</span>
                          </div>
                          <div
                            className="tipo-miel__barra"
                            role="img"
                            aria-label={`${t.nombre}: ${formatearKg(t.kg)}`}
                          >
                            <div
                              className="tipo-miel__relleno"
                              style={{ width: `${maxTipo ? (t.kg / maxTipo) * 100 : 0}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="texto-suave texto-pequeno">Aún no hay tipos de miel registrados.</p>
                  )}
                </article>
              </>
            )}
          </div>
        </section>

        {/* Características */}
        <section className="inicio-seccion inicio-seccion--crema" aria-labelledby="features-titulo">
          <div className="contenedor">
            <div className="inicio-seccion__cabecera">
              <h2 id="features-titulo">¿Qué puedes hacer?</h2>
              <p className="texto-suave">Todo lo que necesitas para gestionar tu operación apícola.</p>
            </div>
            <ul className="caracteristicas">
              {CARACTERISTICAS.map((c) => (
                <li key={c.titulo} className="caracteristica">
                  <div className="caracteristica__icono" aria-hidden="true">
                    {c.icono}
                  </div>
                  <h3 className="caracteristica__titulo">{c.titulo}</h3>
                  <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>
                    {c.texto}
                  </p>
                </li>
              ))}
            </ul>

            <div className="texto-centro mt-3">
              <Link to="/registro" className="btn btn--primario">
                Crear mi cuenta gratis
              </Link>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="inicio-seccion" aria-labelledby="como-titulo">
          <div className="contenedor">
            <div className="inicio-seccion__cabecera">
              <h2 id="como-titulo">¿Cómo funciona?</h2>
              <p className="texto-suave">Empieza en minutos, sin instalar nada.</p>
            </div>
            <ol className="pasos">
              {PASOS.map((p) => (
                <li key={p.numero} className="paso">
                  <span className="paso__numero" aria-hidden="true">{p.numero}</span>
                  <h3 className="paso__titulo">{p.titulo}</h3>
                  <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>{p.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Perfiles de usuario */}
        <section className="inicio-seccion inicio-seccion--crema" aria-labelledby="roles-titulo">
          <div className="contenedor">
            <div className="inicio-seccion__cabecera">
              <h2 id="roles-titulo">Un lugar para todo tu equipo</h2>
              <p className="texto-suave">
                Tú creas la cuenta del apiario y, desde la sección <strong>Equipo</strong>,
                das de alta a tus trabajadores. Todos trabajan sobre la misma información.
              </p>
            </div>
            <ul className="roles">
              {ROLES.map((r) => (
                <li key={r.titulo} className="rol">
                  <div className="rol__icono" aria-hidden="true">{r.icono}</div>
                  <h3 className="rol__titulo">{r.titulo}</h3>
                  <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>{r.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contacto por WhatsApp */}
        <section className="inicio-seccion" aria-labelledby="contacto-titulo">
          <div className="contenedor">
            <div className="contacto-cta">
              <div>
                <h2 id="contacto-titulo">¿Tienes dudas? Hablemos por WhatsApp</h2>
                <p className="texto-suave" style={{ marginBottom: 0 }}>
                  Escríbenos y te ayudamos a poner en marcha tu apiario digital.
                </p>
              </div>
              <a
                href={urlWhatsApp('Hola, quiero información sobre Apiario Digital.')}
                className="btn btn--verde btn--whatsapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span aria-hidden="true">💬</span> WhatsApp {WHATSAPP_DISPLAY}
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Pie de página */}
      <footer className="inicio-footer">
        <div className="contenedor inicio-footer__inner">
          <div className="inicio-footer__marca">
            <Logo size={32} />
            <span>Apiario Digital</span>
          </div>
          <p className="inicio-footer__nota" style={{ margin: 0 }}>
            Datos agregados y anónimos de la plataforma.
            {datos?.actualizado_en ? ` Actualizado el ${formatearFechaHora(datos.actualizado_en)}.` : ''}
          </p>
          <p className="texto-pequeno" style={{ margin: 0 }}>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
          <p className="inicio-footer__contacto" style={{ margin: 0 }}>
            <a
              href={urlWhatsApp('Hola, quiero información sobre Apiario Digital.')}
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 WhatsApp {WHATSAPP_DISPLAY}
            </a>
          </p>
        </div>
      </footer>

      {/* Contacto flotante por WhatsApp */}
      <BotonWhatsApp mensaje="Hola, quiero información sobre Apiario Digital." />
    </div>
  );
}
