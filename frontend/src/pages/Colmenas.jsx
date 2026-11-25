import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import useFetch from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import { post, put, del } from '../api/client.js';

import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Field from '../components/Field.jsx';
import Badge from '../components/Badge.jsx';
import { varianteEstado } from './ApiarioDetalle.jsx';
import { formatearFechaCorta } from '../utils/format.js';

const TIPOS = ['langstroth', 'top_bar', 'warre', 'otro'];
const ESTADOS = ['activa', 'débil', 'reina_nueva', 'vacía', 'enferma', 'muerta'];

/** Formulario de creación/edición de colmenas. */
function ColmenaForm({ inicial, apiarios, apiarioFijo, onGuardar, onCancelar, guardando }) {
  const [form, setForm] = useState({
    apiario_id: inicial?.apiario_id ?? apiarioFijo ?? apiarios[0]?.id ?? '',
    codigo: inicial?.codigo || '',
    tipo: inicial?.tipo || 'langstroth',
    fecha_instalacion: inicial?.fecha_instalacion ? String(inicial.fecha_instalacion).slice(0, 10) : '',
    estado: inicial?.estado || 'activa',
    reina_marcada: Boolean(inicial?.reina_marcada),
    notas: inicial?.notas || '',
  });
  const [errores, setErrores] = useState({});

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  function validar() {
    const nuevos = {};
    if (!form.apiario_id) nuevos.apiario_id = 'Selecciona un apiario.';
    if (!form.codigo.trim()) nuevos.codigo = 'El código es obligatorio.';
    if (!form.tipo) nuevos.tipo = 'Selecciona el tipo.';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  function enviar(e) {
    e.preventDefault();
    if (!validar()) return;
    onGuardar({
      apiario_id: Number(form.apiario_id),
      codigo: form.codigo.trim(),
      tipo: form.tipo,
      fecha_instalacion: form.fecha_instalacion || undefined,
      estado: form.estado,
      reina_marcada: form.reina_marcada ? 1 : 0,
      notas: form.notas.trim() || undefined,
    });
  }

  return (
    <form onSubmit={enviar} noValidate>
      <Field id="col-apiario" label="Apiario" error={errores.apiario_id} requerido>
        <select
          id="col-apiario"
          className="select"
          value={form.apiario_id}
          onChange={set('apiario_id')}
          disabled={Boolean(apiarioFijo) && !inicial}
          aria-invalid={Boolean(errores.apiario_id)}
        >
          <option value="">— Selecciona —</option>
          {apiarios.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
      </Field>

      <div className="grid grid--dos">
        <Field id="col-codigo" label="Código" error={errores.codigo} requerido>
          <input
            id="col-codigo"
            className="input"
            value={form.codigo}
            onChange={set('codigo')}
            placeholder="C-01"
            aria-invalid={Boolean(errores.codigo)}
          />
        </Field>

        <Field id="col-tipo" label="Tipo" error={errores.tipo} requerido>
          <select id="col-tipo" className="select" value={form.tipo} onChange={set('tipo')}>
            {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid--dos">
        <Field id="col-fecha" label="Fecha de instalación">
          <input id="col-fecha" className="input" type="date" value={form.fecha_instalacion} onChange={set('fecha_instalacion')} />
        </Field>

        <Field id="col-estado" label="Estado">
          <select id="col-estado" className="select" value={form.estado} onChange={set('estado')}>
            {ESTADOS.map((es) => <option key={es} value={es}>{es}</option>)}
          </select>
        </Field>
      </div>

      <div className="campo">
        <label className="campo-check" htmlFor="col-reina">
          <input
            id="col-reina"
            type="checkbox"
            checked={form.reina_marcada}
            onChange={(e) => setForm((f) => ({ ...f, reina_marcada: e.target.checked }))}
          />
          Reina marcada
        </label>
      </div>

      <Field id="col-notas" label="Notas">
        <textarea id="col-notas" className="textarea" value={form.notas} onChange={set('notas')} placeholder="Observaciones…" />
      </Field>

      <div className="modal__pie" style={{ paddingRight: 0, paddingLeft: 0, border: 'none' }}>
        <button type="button" className="btn btn--secundario" onClick={onCancelar} disabled={guardando}>Cancelar</button>
        <button type="submit" className="btn btn--primario" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

/** Página de colmenas: listado global con filtro por apiario y CRUD completo. */
export default function Colmenas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtroApiario = searchParams.get('apiario_id') || '';

  const { datos: apiarios } = useFetch('/apiarios');
  const ruta = filtroApiario ? `/colmenas?apiario_id=${filtroApiario}` : '/colmenas';
  const { datos, cargando, error, refetch } = useFetch(ruta);
  const toast = useToast();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const listaApiarios = useMemo(() => (Array.isArray(apiarios) ? apiarios : []), [apiarios]);
  const colmenas = useMemo(() => (Array.isArray(datos) ? datos : []), [datos]);

  // Limpia el filtro si el apiario de la URL ya no existe.
  useEffect(() => {
    if (filtroApiario && apiarios && !listaApiarios.some((a) => String(a.id) === String(filtroApiario))) {
      setSearchParams({});
    }
  }, [filtroApiario, apiarios, listaApiarios, setSearchParams]);

  function cambiarFiltro(e) {
    const valor = e.target.value;
    if (valor) setSearchParams({ apiario_id: valor });
    else setSearchParams({});
  }

  function abrirCrear() {
    setEnEdicion(null);
    setModalAbierto(true);
  }

  async function guardar(valores) {
    setGuardando(true);
    try {
      if (enEdicion) {
        await put(`/colmenas/${enEdicion.id}`, valores);
        toast.exito('Colmena actualizada.');
      } else {
        await post('/colmenas', valores);
        toast.exito('Colmena creada.');
      }
      setModalAbierto(false);
      setEnEdicion(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar la colmena.');
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    setEliminando(true);
    try {
      await del(`/colmenas/${aEliminar.id}`);
      toast.exito('Colmena eliminada.');
      setAEliminar(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar la colmena.');
    } finally {
      setEliminando(false);
    }
  }

  const sinApiarios = !cargando && listaApiarios.length === 0;

  return (
    <div className="pila">
      <div className="seccion-titulo">
        <div>
          <h1>Colmenas</h1>
          <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>
            Inventario de colmenas de todos tus apiarios.
          </p>
        </div>
        <button type="button" className="btn btn--primario" onClick={abrirCrear} disabled={sinApiarios}>
          + Nueva colmena
        </button>
      </div>

      {sinApiarios ? (
        <EmptyState
          icono="📍"
          titulo="Primero crea un apiario"
          mensaje="Necesitas al menos un apiario para poder registrar colmenas."
          accion={<Link className="btn btn--primario" to="/apiarios">Ir a apiarios</Link>}
        />
      ) : (
        <>
          <div className="tarjeta">
            <label className="campo__label" htmlFor="filtro-apiario">Filtrar por apiario</label>
            <select id="filtro-apiario" className="select" value={filtroApiario} onChange={cambiarFiltro}>
              <option value="">Todos los apiarios</option>
              {listaApiarios.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>

          {cargando && <Loader mensaje="Cargando colmenas…" />}

          {error && (
            <div className="aviso aviso--error" role="alert">No se pudo cargar la lista: {error.message}</div>
          )}

          {!cargando && !error && colmenas.length === 0 && (
            <EmptyState
              icono="🏠"
              titulo="No hay colmenas"
              mensaje="Agrega tu primera colmena para registrar inspecciones y cosechas."
              accion={<button type="button" className="btn btn--primario" onClick={abrirCrear}>Crear colmena</button>}
            />
          )}

          {!cargando && colmenas.length > 0 && (
            <div className="tabla-scroll">
              <table className="tabla tabla--tarjetas">
                <caption className="oculto-visual">Listado de colmenas</caption>
                <thead>
                  <tr>
                    <th scope="col">Código</th>
                    <th scope="col">Apiario</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Reina</th>
                    <th scope="col">Última inspección</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {colmenas.map((c) => (
                    <tr key={c.id}>
                      <td data-label="Código"><strong>{c.codigo}</strong></td>
                      <td data-label="Apiario">{c.apiario_nombre || '—'}</td>
                      <td data-label="Tipo">{c.tipo}</td>
                      <td data-label="Estado"><Badge variante={varianteEstado(c.estado)}>{c.estado}</Badge></td>
                      <td data-label="Reina">{c.reina_marcada ? 'Sí' : 'No'}</td>
                      <td data-label="Última inspección">{c.ultima_inspeccion ? formatearFechaCorta(c.ultima_inspeccion) : '—'}</td>
                      <td data-label="Acciones">
                        <div className="acciones-fila">
                          <Link className="btn btn--pequeno btn--verde" to={`/colmenas/${c.id}`}>Abrir</Link>
                          <button type="button" className="btn btn--pequeno btn--secundario" onClick={() => { setEnEdicion(c); setModalAbierto(true); }}>
                            Editar
                          </button>
                          <button type="button" className="btn btn--pequeno btn--peligro" onClick={() => setAEliminar(c)}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Modal
        abierto={modalAbierto}
        alCerrar={() => !guardando && setModalAbierto(false)}
        titulo={enEdicion ? 'Editar colmena' : 'Nueva colmena'}
      >
        <ColmenaForm
          inicial={enEdicion}
          apiarios={listaApiarios}
          apiarioFijo={filtroApiario ? Number(filtroApiario) : null}
          onGuardar={guardar}
          onCancelar={() => setModalAbierto(false)}
          guardando={guardando}
        />
      </Modal>

      <ConfirmDialog
        abierto={Boolean(aEliminar)}
        titulo="Eliminar colmena"
        mensaje={`¿Seguro que deseas eliminar la colmena "${aEliminar?.codigo}"? Se borrarán sus inspecciones, cosechas y tratamientos.`}
        procesando={eliminando}
        alConfirmar={confirmarEliminar}
        alCancelar={() => setAEliminar(null)}
      />
    </div>
  );
}
