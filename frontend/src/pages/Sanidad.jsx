import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import useFetch from '../hooks/useFetch.js';
import Loader from '../components/Loader.jsx';
import Badge from '../components/Badge.jsx';

/** Títulos legibles por tipo de problema (según el ENUM de la base). */
const GRUPOS = [
  { tipo: 'varroa', titulo: 'Varroa', descripcion: 'El ácaro Varroa destructor, la principal amenaza de las colmenas.' },
  { tipo: 'nosema', titulo: 'Nosema', descripcion: 'Enfermedad intestinal por hongos (Nosema apis / N. ceranae).' },
  { tipo: 'loque', titulo: 'Loque', descripcion: 'Enfermedades bacterianas de la cría (americana y europea).' },
  { tipo: 'otro', titulo: 'Otras plagas y problemas', descripcion: 'Polilla de la cera, escarabajo de la colmena, hormigas y más.' },
];

/**
 * Página de Sanidad: catálogo de referencia de tratamientos apícolas por
 * plaga/enfermedad y cuidados base de prevención. Consume
 * GET /api/tratamientos/catalogo. Sirve de guía para registrar tratamientos
 * en cada colmena.
 */
export default function Sanidad() {
  const { datos, cargando, error, refetch } = useFetch('/tratamientos/catalogo');

  const tratamientos = useMemo(() => datos?.tratamientos || [], [datos]);
  const cuidados = useMemo(() => datos?.cuidados || [], [datos]);

  // Agrupa los tratamientos por tipo para mostrarlos por problema.
  const porTipo = useMemo(() => {
    const mapa = {};
    tratamientos.forEach((t) => {
      (mapa[t.tipo] ||= []).push(t);
    });
    return mapa;
  }, [tratamientos]);

  return (
    <div className="pila">
      <div className="seccion-titulo">
        <div>
          <h1>Sanidad apícola</h1>
          <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>
            Guía de tratamientos contra las principales plagas y enfermedades, y los
            cuidados base para mantener tus colmenas sanas.
          </p>
        </div>
        <Link to="/colmenas" className="btn btn--secundario">
          Registrar en una colmena
        </Link>
      </div>

      <div className="aviso aviso--info" role="note">
        Esta guía es informativa: confirma dosis y productos con la etiqueta y con un
        veterinario, respeta los <strong>tiempos de retiro</strong> antes de cosechar miel y
        usa siempre equipo de protección.
      </div>

      {cargando && <Loader mensaje="Cargando catálogo de sanidad…" />}

      {error && (
        <div className="aviso aviso--error" role="alert">
          No se pudo cargar el catálogo: {error.message}
          <button
            type="button"
            className="btn btn--secundario btn--pequeno"
            onClick={refetch}
            style={{ marginLeft: '0.75rem' }}
          >
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && (
        <>
          {GRUPOS.map((grupo) => {
            const lista = porTipo[grupo.tipo] || [];
            if (lista.length === 0) return null;
            return (
              <section key={grupo.tipo} className="sanidad-grupo" aria-labelledby={`grupo-${grupo.tipo}`}>
                <div className="sanidad-grupo__cabecera">
                  <h2 id={`grupo-${grupo.tipo}`}>{grupo.titulo}</h2>
                  <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>
                    {grupo.descripcion}
                  </p>
                </div>
                <div className="grid grid--dos">
                  {lista.map((t) => (
                    <article key={t.id} className="tarjeta tratamiento-card">
                      <div className="tratamiento-card__cabecera">
                        <h3 className="tratamiento-card__titulo">{t.producto}</h3>
                        <Badge variante="info">{grupo.titulo}</Badge>
                      </div>
                      {t.principioActivo && t.principioActivo !== '—' && (
                        <p className="tratamiento-card__meta">
                          <span className="tratamiento-card__label">Principio activo:</span>{' '}
                          {t.principioActivo}
                        </p>
                      )}
                      <dl className="tratamiento-card__datos">
                        <dt>Dosis</dt>
                        <dd>{t.dosis}</dd>
                        <dt>Cuándo aplicar</dt>
                        <dd>{t.cuando}</dd>
                        <dt>Precauciones</dt>
                        <dd>{t.precauciones}</dd>
                      </dl>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}

          <section className="sanidad-grupo" aria-labelledby="cuidados-titulo">
            <div className="sanidad-grupo__cabecera">
              <h2 id="cuidados-titulo">Cuidados base (prevención)</h2>
              <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>
                Lo que necesita una colmena para no enfermarse: hábitos de manejo y alimento.
              </p>
            </div>
            <ul className="cuidados">
              {cuidados.map((c) => (
                <li key={c.id} className="cuidado">
                  <span className="cuidado__check" aria-hidden="true">✔</span>
                  <div>
                    <strong className="cuidado__titulo">{c.titulo}</strong>
                    <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>{c.detalle}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
