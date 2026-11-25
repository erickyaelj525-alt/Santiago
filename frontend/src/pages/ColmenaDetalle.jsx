import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import useFetch from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import { post, put, del } from '../api/client.js';

import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Field from '../components/Field.jsx';
import Badge from '../components/Badge.jsx';
import { formatearFecha, formatearFechaCorta, formatearKg, formatearNumero } from '../utils/format.js';

const TIPOS_TRATAMIENTO = ['varroa', 'nosema', 'loque', 'otro'];

/* ========================= Helpers ========================= */

const siono = (v) => (v ? 'Sí' : 'No');

/** Devuelve un badge de riesgo según la inspección. */
function RiesgoInspeccion({ inspeccion }) {
  const riesgos = [];
  if (Number(inspeccion.nivel_varroa) >= 3) {
    riesgos.push({ texto: `Varroa ${inspeccion.nivel_varroa}/5`, variante: 'peligro' });
  } else if (Number(inspeccion.nivel_varroa) >= 2) {
    riesgos.push({ texto: `Varroa ${inspeccion.nivel_varroa}/5`, variante: 'alerta' });
  } else {
    riesgos.push({ texto: 'Varroa bajo', variante: 'ok' });
  }
  if (inspeccion.celdas_reales) {
    riesgos.push({ texto: 'Celdas reales', variante: 'alerta' });
  }
  if (!inspeccion.presencia_reina) {
    riesgos.push({ texto: 'Sin reina', variante: 'peligro' });
  }
  return (
    <div className="acciones-fila">
      {riesgos.map((r) => <Badge key={r.texto} variante={r.variante}>{r.texto}</Badge>)}
    </div>
  );
}

/** Hook de CRUD genérico para los recursos de una colmena. */
function useCrudRecurso(recurso, alCambiar, etiqueta) {
  const toast = useToast();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const abrirCrear = () => { setEnEdicion(null); setModalAbierto(true); };
  const abrirEditar = (item) => { setEnEdicion(item); setModalAbierto(true); };
  const cerrar = () => { if (!guardando) setModalAbierto(false); };

  async function guardar(valores) {
    setGuardando(true);
    try {
      if (enEdicion) {
        await put(`/${recurso}/${enEdicion.id}`, valores);
        toast.exito(`${etiqueta} actualizada.`);
      } else {
        await post(`/${recurso}`, valores);
        toast.exito(`${etiqueta} registrada.`);
      }
      setModalAbierto(false);
      setEnEdicion(null);
      await alCambiar();
    } catch (err) {
      toast.error(err.message || `No se pudo guardar la ${etiqueta.toLowerCase()}.`);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    setEliminando(true);
    try {
      await del(`/${recurso}/${aEliminar.id}`);
      toast.exito(`${etiqueta} eliminada.`);
      setAEliminar(null);
      await alCambiar();
    } catch (err) {
      toast.error(err.message || `No se pudo eliminar la ${etiqueta.toLowerCase()}.`);
    } finally {
      setEliminando(false);
    }
  }

  return {
    modalAbierto, enEdicion, guardando, aEliminar, eliminando,
    abrirCrear, abrirEditar, cerrar, guardar, setAEliminar, confirmarEliminar,
    cancelarEliminar: () => setAEliminar(null),
  };
}

/* ========================= Formularios ========================= */

/** Rango 1-5 con valor visible (para inspecciones). */
function RangoCampo({ id, label, min = 1, max = 5, valor, onChange }) {
  return (
    <Field id={id} label={`${label}: ${valor}`}>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step="1"
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={valor}
      />
    </Field>
  );
}

function InspeccionForm({ inicial, onGuardar, onCancelar, guardando }) {
  const [form, setForm] = useState({
    fecha: inicial?.fecha ? String(inicial.fecha).slice(0, 10) : new Date().toISOString().slice(0, 10),
    poblacion: Number(inicial?.poblacion ?? 3),
    temperamento: Number(inicial?.temperamento ?? 3),
    presencia_reina: Boolean(Number(inicial?.presencia_reina ?? 1)),
    celdas_reales: Boolean(Number(inicial?.celdas_reales ?? 0)),
    nivel_varroa: Number(inicial?.nivel_varroa ?? 0),
    alimento_miel: Boolean(Number(inicial?.alimento_miel ?? 1)),
    alimento_polen: Boolean(Number(inicial?.alimento_polen ?? 1)),
    clima_temp: inicial?.clima_temp ?? '',
    notas: inicial?.notas || '',
  });
  const [errores, setErrores] = useState({});

  const setBool = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.checked }));
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  function enviar(e) {
    e.preventDefault();
    if (!form.fecha) {
      setErrores({ fecha: 'La fecha es obligatoria.' });
      return;
    }
    setErrores({});
    onGuardar({
      colmena_id: Number(inicial?.colmena_id ?? form.colmena_id),
      fecha: form.fecha,
      poblacion: form.poblacion,
      temperamento: form.temperamento,
      presencia_reina: form.presencia_reina ? 1 : 0,
      celdas_reales: form.celdas_reales ? 1 : 0,
      nivel_varroa: form.nivel_varroa,
      alimento_miel: form.alimento_miel ? 1 : 0,
      alimento_polen: form.alimento_polen ? 1 : 0,
      clima_temp: form.clima_temp === '' ? undefined : Number(form.clima_temp),
      notas: form.notas.trim() || undefined,
    });
  }

  return (
    <form onSubmit={enviar} noValidate>
      <Field id="ins-fecha" label="Fecha" error={errores.fecha} requerido>
        <input id="ins-fecha" className="input" type="date" value={form.fecha} onChange={set('fecha')} />
      </Field>

      <RangoCampo id="ins-poblacion" label="Población (1-5)" valor={form.poblacion} onChange={(v) => setForm((f) => ({ ...f, poblacion: v }))} />
      <RangoCampo id="ins-temperamento" label="Temperamento (1=dócil, 5=agresivo)" valor={form.temperamento} onChange={(v) => setForm((f) => ({ ...f, temperamento: v }))} />
      <RangoCampo id="ins-varroa" label="Nivel de varroa (0-5)" min={0} valor={form.nivel_varroa} onChange={(v) => setForm((f) => ({ ...f, nivel_varroa: v }))} />

      <div className="grid grid--dos">
        <label className="campo-check"><input type="checkbox" checked={form.presencia_reina} onChange={setBool('presencia_reina')} /> Presencia de reina</label>
        <label className="campo-check"><input type="checkbox" checked={form.celdas_reales} onChange={setBool('celdas_reales')} /> Celdas reales</label>
        <label className="campo-check"><input type="checkbox" checked={form.alimento_miel} onChange={setBool('alimento_miel')} /> Reservas de miel</label>
        <label className="campo-check"><input type="checkbox" checked={form.alimento_polen} onChange={setBool('alimento_polen')} /> Reservas de polen</label>
      </div>

      <Field id="ins-clima" label="Temperatura ambiente (°C)">
        <input id="ins-clima" className="input" inputMode="decimal" value={form.clima_temp} onChange={set('clima_temp')} placeholder="24" />
      </Field>

      <Field id="ins-notas" label="Notas">
        <textarea id="ins-notas" className="textarea" value={form.notas} onChange={set('notas')} />
      </Field>

      <div className="modal__pie" style={{ paddingRight: 0, paddingLeft: 0, border: 'none' }}>
        <button type="button" className="btn btn--secundario" onClick={onCancelar} disabled={guardando}>Cancelar</button>
        <button type="submit" className="btn btn--primario" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  );
}

function CosechaForm({ inicial, onGuardar, onCancelar, guardando }) {
  const [form, setForm] = useState({
    fecha: inicial?.fecha ? String(inicial.fecha).slice(0, 10) : new Date().toISOString().slice(0, 10),
    kg_miel: inicial?.kg_miel ?? '',
    tipo_miel: inicial?.tipo_miel || '',
    humedad_pct: inicial?.humedad_pct ?? '',
    notas: inicial?.notas || '',
  });
  const [errores, setErrores] = useState({});
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  function enviar(e) {
    e.preventDefault();
    const nuevos = {};
    if (!form.fecha) nuevos.fecha = 'La fecha es obligatoria.';
    if (form.kg_miel === '' || Number(form.kg_miel) <= 0) nuevos.kg_miel = 'Ingresa kilos mayores a 0.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    onGuardar({
      colmena_id: Number(inicial?.colmena_id),
      fecha: form.fecha,
      kg_miel: Number(form.kg_miel),
      tipo_miel: form.tipo_miel.trim() || undefined,
      humedad_pct: form.humedad_pct === '' ? undefined : Number(form.humedad_pct),
      notas: form.notas.trim() || undefined,
    });
  }

  return (
    <form onSubmit={enviar} noValidate>
      <div className="grid grid--dos">
        <Field id="cos-fecha" label="Fecha" error={errores.fecha} requerido>
          <input id="cos-fecha" className="input" type="date" value={form.fecha} onChange={set('fecha')} />
        </Field>
        <Field id="cos-kg" label="Kilos de miel" error={errores.kg_miel} requerido>
          <input id="cos-kg" className="input" inputMode="decimal" value={form.kg_miel} onChange={set('kg_miel')} placeholder="12.5" aria-invalid={Boolean(errores.kg_miel)} />
        </Field>
      </div>

      <div className="grid grid--dos">
        <Field id="cos-tipo" label="Tipo de miel">
          <input id="cos-tipo" className="input" value={form.tipo_miel} onChange={set('tipo_miel')} placeholder="Multifloral" />
        </Field>
        <Field id="cos-humedad" label="Humedad (%)">
          <input id="cos-humedad" className="input" inputMode="decimal" value={form.humedad_pct} onChange={set('humedad_pct')} placeholder="18" />
        </Field>
      </div>

      <Field id="cos-notas" label="Notas">
        <textarea id="cos-notas" className="textarea" value={form.notas} onChange={set('notas')} />
      </Field>

      <div className="modal__pie" style={{ paddingRight: 0, paddingLeft: 0, border: 'none' }}>
        <button type="button" className="btn btn--secundario" onClick={onCancelar} disabled={guardando}>Cancelar</button>
        <button type="submit" className="btn btn--primario" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  );
}

function TratamientoForm({ inicial, onGuardar, onCancelar, guardando }) {
  const [form, setForm] = useState({
    tipo: inicial?.tipo || 'varroa',
    producto: inicial?.producto || '',
    dosis: inicial?.dosis || '',
    fecha_inicio: inicial?.fecha_inicio ? String(inicial.fecha_inicio).slice(0, 10) : new Date().toISOString().slice(0, 10),
    fecha_fin: inicial?.fecha_fin ? String(inicial.fecha_fin).slice(0, 10) : '',
    notas: inicial?.notas || '',
  });
  const [errores, setErrores] = useState({});
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  function enviar(e) {
    e.preventDefault();
    const nuevos = {};
    if (!form.tipo) nuevos.tipo = 'Selecciona el tipo.';
    if (!form.producto.trim()) nuevos.producto = 'El producto es obligatorio.';
    if (!form.fecha_inicio) nuevos.fecha_inicio = 'La fecha de inicio es obligatoria.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    onGuardar({
      colmena_id: Number(inicial?.colmena_id),
      tipo: form.tipo,
      producto: form.producto.trim(),
      dosis: form.dosis.trim() || undefined,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin || undefined,
      notas: form.notas.trim() || undefined,
    });
  }

  return (
    <form onSubmit={enviar} noValidate>
      <div className="grid grid--dos">
        <Field id="tra-tipo" label="Tipo" error={errores.tipo} requerido>
          <select id="tra-tipo" className="select" value={form.tipo} onChange={set('tipo')}>
            {TIPOS_TRATAMIENTO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field id="tra-producto" label="Producto" error={errores.producto} requerido>
          <input id="tra-producto" className="input" value={form.producto} onChange={set('producto')} placeholder="Ácido oxálico" aria-invalid={Boolean(errores.producto)} />
        </Field>
      </div>

      <Field id="tra-dosis" label="Dosis">
        <input id="tra-dosis" className="input" value={form.dosis} onChange={set('dosis')} placeholder="3 ml por colmena" />
      </Field>

      <div className="grid grid--dos">
        <Field id="tra-inicio" label="Fecha de inicio" error={errores.fecha_inicio} requerido>
          <input id="tra-inicio" className="input" type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')} />
        </Field>
        <Field id="tra-fin" label="Fecha de fin">
          <input id="tra-fin" className="input" type="date" value={form.fecha_fin} onChange={set('fecha_fin')} />
        </Field>
      </div>

      <Field id="tra-notas" label="Notas">
        <textarea id="tra-notas" className="textarea" value={form.notas} onChange={set('notas')} />
      </Field>

      <div className="modal__pie" style={{ paddingRight: 0, paddingLeft: 0, border: 'none' }}>
        <button type="button" className="btn btn--secundario" onClick={onCancelar} disabled={guardando}>Cancelar</button>
        <button type="submit" className="btn btn--primario" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  );
}

/* ========================= Página ========================= */

/**
 * Detalle de colmena con pestañas de Inspecciones / Cosechas / Tratamientos.
 * Cada pestaña tiene su propio CRUD completo en modales.
 */
export default function ColmenaDetalle() {
  const { id } = useParams();
  const { datos, cargando, error, refetch } = useFetch(`/colmenas/${id}`);
  const [tab, setTab] = useState('inspecciones');

  const colmena = datos?.colmena;
  const inspecciones = useMemo(() => datos?.inspecciones || [], [datos]);
  const cosechas = useMemo(() => datos?.cosechas || [], [datos]);
  const tratamientos = useMemo(() => datos?.tratamientos || [], [datos]);

  const crudInsp = useCrudRecurso('inspecciones', refetch, 'Inspección');
  const crudCose = useCrudRecurso('cosechas', refetch, 'Cosecha');
  const crudTrat = useCrudRecurso('tratamientos', refetch, 'Tratamiento');

  if (cargando) return <Loader mensaje="Cargando colmena…" />;

  if (error) {
    return (
      <div className="pila">
        <div className="aviso aviso--error" role="alert">No se pudo cargar la colmena: {error.message}</div>
        <Link className="btn btn--secundario" to="/colmenas">← Volver a colmenas</Link>
      </div>
    );
  }

  if (!colmena) return null;

  const tabs = [
    { id: 'inspecciones', etiqueta: `Inspecciones (${inspecciones.length})` },
    { id: 'cosechas', etiqueta: `Cosechas (${cosechas.length})` },
    { id: 'tratamientos', etiqueta: `Tratamientos (${tratamientos.length})` },
  ];

  /** Handler teclado para las pestañas (flechas). */
  function manejarTeclasTab(e, indice) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const siguiente = e.key === 'ArrowRight' ? (indice + 1) % tabs.length : (indice - 1 + tabs.length) % tabs.length;
    setTab(tabs[siguiente].id);
  }

  return (
    <div className="pila">
      <div className="seccion-titulo">
        <div>
          <Link className="texto-pequeno" to="/colmenas">← Colmenas</Link>
          <h1 style={{ marginBottom: 0 }}>Colmena {colmena.codigo}</h1>
          <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>
            {colmena.apiario_nombre ? (
              <>Apiario: <Link to={`/apiarios/${colmena.apiario_id}`}>{colmena.apiario_nombre}</Link></>
            ) : (
              'Detalle de la colmena y su historial.'
            )}
          </p>
        </div>
        <div className="acciones-fila">
          <Badge variante={colmena.estado === 'activa' ? 'ok' : 'neutro'}>{colmena.estado}</Badge>
          <Badge variante="info">{colmena.tipo}</Badge>
        </div>
      </div>

      <section className="tarjeta">
        <dl className="grid grid--dos" style={{ gap: '0.5rem' }}>
          <div>
            <dt className="texto-pequeno texto-suave">Fecha de instalación</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>{formatearFecha(colmena.fecha_instalacion)}</dd>
          </div>
          <div>
            <dt className="texto-pequeno texto-suave">Reina marcada</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>{siono(colmena.reina_marcada)}</dd>
          </div>
          {colmena.notas && (
            <div style={{ gridColumn: '1 / -1' }}>
              <dt className="texto-pequeno texto-suave">Notas</dt>
              <dd style={{ margin: 0 }}>{colmena.notas}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Pestañas accesibles */}
      <div className="tabs" role="tablist" aria-label="Historial de la colmena">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className="tabs__tab"
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => manejarTeclasTab(e, i)}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      {/* Panel: Inspecciones */}
      {tab === 'inspecciones' && (
        <section id="panel-inspecciones" role="tabpanel" aria-labelledby="tab-inspecciones" className="tarjeta">
          <div className="seccion-titulo" style={{ marginBottom: '0.75rem' }}>
            <h2 className="tarjeta__titulo">Inspecciones</h2>
            <button type="button" className="btn btn--primario btn--pequeno" onClick={crudInsp.abrirCrear}>+ Nueva inspección</button>
          </div>

          {inspecciones.length === 0 ? (
            <EmptyState icono="🔍" titulo="Sin inspecciones" mensaje="Registra la primera revisión de esta colmena." />
          ) : (
            <ul className="pila" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {inspecciones.map((ins) => (
                <li key={ins.id} className="tarjeta" style={{ boxShadow: 'none' }}>
                  <div className="fila fila--separar fila--wrap">
                    <strong>{formatearFecha(ins.fecha)}</strong>
                    <RiesgoInspeccion inspeccion={ins} />
                  </div>
                  <div className="tarjeta__meta">
                    <span>👥 Población {ins.poblacion}/5</span>
                    <span>😠 Temperamento {ins.temperamento}/5</span>
                    <span>👑 Reina: {siono(ins.presencia_reina)}</span>
                    <span>🐝 Varroa {ins.nivel_varroa}/5</span>
                    <span>🍯 Miel: {siono(ins.alimento_miel)}</span>
                    <span>🌾 Polen: {siono(ins.alimento_polen)}</span>
                  </div>
                  {ins.notas && <p className="texto-pequeno mt-1" style={{ marginBottom: 0 }}>{ins.notas}</p>}
                  <div className="acciones-fila mt-2">
                    <button type="button" className="btn btn--pequeno btn--secundario" onClick={() => crudInsp.abrirEditar(ins)}>Editar</button>
                    <button type="button" className="btn btn--pequeno btn--peligro" onClick={() => crudInsp.setAEliminar(ins)}>Eliminar</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Panel: Cosechas */}
      {tab === 'cosechas' && (
        <section id="panel-cosechas" role="tabpanel" aria-labelledby="tab-cosechas" className="tarjeta">
          <div className="seccion-titulo" style={{ marginBottom: '0.75rem' }}>
            <h2 className="tarjeta__titulo">Cosechas de miel</h2>
            <button type="button" className="btn btn--primario btn--pequeno" onClick={crudCose.abrirCrear}>+ Nueva cosecha</button>
          </div>

          {cosechas.length === 0 ? (
            <EmptyState icono="🍯" titulo="Sin cosechas" mensaje="Aún no has registrado cosechas para esta colmena." />
          ) : (
            <div className="tabla-scroll">
              <table className="tabla tabla--tarjetas">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Kilos</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Humedad</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cosechas.map((c) => (
                    <tr key={c.id}>
                      <td data-label="Fecha">{formatearFechaCorta(c.fecha)}</td>
                      <td data-label="Kilos"><strong>{formatearKg(c.kg_miel)}</strong></td>
                      <td data-label="Tipo">{c.tipo_miel || '—'}</td>
                      <td data-label="Humedad">{c.humedad_pct != null ? `${formatearNumero(c.humedad_pct, 1)}%` : '—'}</td>
                      <td data-label="Acciones">
                        <div className="acciones-fila">
                          <button type="button" className="btn btn--pequeno btn--secundario" onClick={() => crudCose.abrirEditar(c)}>Editar</button>
                          <button type="button" className="btn btn--pequeno btn--peligro" onClick={() => crudCose.setAEliminar(c)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Panel: Tratamientos */}
      {tab === 'tratamientos' && (
        <section id="panel-tratamientos" role="tabpanel" aria-labelledby="tab-tratamientos" className="tarjeta">
          <div className="seccion-titulo" style={{ marginBottom: '0.75rem' }}>
            <h2 className="tarjeta__titulo">Tratamientos sanitarios</h2>
            <button type="button" className="btn btn--primario btn--pequeno" onClick={crudTrat.abrirCrear}>+ Nuevo tratamiento</button>
          </div>

          {tratamientos.length === 0 ? (
            <EmptyState icono="💊" titulo="Sin tratamientos" mensaje="Registra tratamientos contra varroa u otras plagas." />
          ) : (
            <div className="tabla-scroll">
              <table className="tabla tabla--tarjetas">
                <thead>
                  <tr>
                    <th scope="col">Tipo</th>
                    <th scope="col">Producto</th>
                    <th scope="col">Dosis</th>
                    <th scope="col">Inicio</th>
                    <th scope="col">Fin</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tratamientos.map((t) => {
                    const activo = !t.fecha_fin;
                    return (
                      <tr key={t.id}>
                        <td data-label="Tipo"><Badge variante="info">{t.tipo}</Badge></td>
                        <td data-label="Producto"><strong>{t.producto}</strong></td>
                        <td data-label="Dosis">{t.dosis || '—'}</td>
                        <td data-label="Inicio">{formatearFechaCorta(t.fecha_inicio)}</td>
                        <td data-label="Fin">
                          {t.fecha_fin ? formatearFechaCorta(t.fecha_fin) : <Badge variante="alerta">En curso</Badge>}
                        </td>
                        <td data-label="Acciones">
                          <div className="acciones-fila">
                            <button type="button" className="btn btn--pequeno btn--secundario" onClick={() => crudTrat.abrirEditar(t)}>Editar</button>
                            <button type="button" className="btn btn--pequeno btn--peligro" onClick={() => crudTrat.setAEliminar(t)}>Eliminar</button>
                          </div>
                          {activo && <span className="oculto-visual">tratamiento activo</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Modales de CRUD por recurso */}
      <Modal abierto={crudInsp.modalAbierto} alCerrar={crudInsp.cerrar} titulo={crudInsp.enEdicion ? 'Editar inspección' : 'Nueva inspección'} ancho>
        <InspeccionForm
          inicial={crudInsp.enEdicion ? { ...crudInsp.enEdicion, colmena_id: colmena.id } : { colmena_id: colmena.id }}
          onGuardar={crudInsp.guardar}
          onCancelar={() => { crudInsp.cerrar(); }}
          guardando={crudInsp.guardando}
        />
      </Modal>

      <Modal abierto={crudCose.modalAbierto} alCerrar={crudCose.cerrar} titulo={crudCose.enEdicion ? 'Editar cosecha' : 'Nueva cosecha'}>
        <CosechaForm
          inicial={crudCose.enEdicion ? { ...crudCose.enEdicion, colmena_id: colmena.id } : { colmena_id: colmena.id }}
          onGuardar={crudCose.guardar}
          onCancelar={() => { crudCose.cerrar(); }}
          guardando={crudCose.guardando}
        />
      </Modal>

      <Modal abierto={crudTrat.modalAbierto} alCerrar={crudTrat.cerrar} titulo={crudTrat.enEdicion ? 'Editar tratamiento' : 'Nuevo tratamiento'}>
        <TratamientoForm
          inicial={crudTrat.enEdicion ? { ...crudTrat.enEdicion, colmena_id: colmena.id } : { colmena_id: colmena.id }}
          onGuardar={crudTrat.guardar}
          onCancelar={() => { crudTrat.cerrar(); }}
          guardando={crudTrat.guardando}
        />
      </Modal>

      <ConfirmDialog
        abierto={Boolean(crudInsp.aEliminar)}
        titulo="Eliminar inspección"
        mensaje="¿Seguro que deseas eliminar esta inspección?"
        procesando={crudInsp.eliminando}
        alConfirmar={crudInsp.confirmarEliminar}
        alCancelar={crudInsp.cancelarEliminar}
      />
      <ConfirmDialog
        abierto={Boolean(crudCose.aEliminar)}
        titulo="Eliminar cosecha"
        mensaje={`¿Eliminar la cosecha del ${formatearFechaCorta(crudCose.aEliminar?.fecha)}?`}
        procesando={crudCose.eliminando}
        alConfirmar={crudCose.confirmarEliminar}
        alCancelar={crudCose.cancelarEliminar}
      />
      <ConfirmDialog
        abierto={Boolean(crudTrat.aEliminar)}
        titulo="Eliminar tratamiento"
        mensaje={`¿Eliminar el tratamiento con ${crudTrat.aEliminar?.producto}?`}
        procesando={crudTrat.eliminando}
        alConfirmar={crudTrat.confirmarEliminar}
        alCancelar={crudTrat.cancelarEliminar}
      />
    </div>
  );
}
