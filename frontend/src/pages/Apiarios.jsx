import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import useFetch from '../hooks/useFetch.js';
import useAuth from '../hooks/useAuth.js';
import { useToast } from '../context/ToastContext.jsx';
import { post, put, del } from '../api/client.js';

import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Field from '../components/Field.jsx';
import ApiarioMap from '../components/ApiarioMap.jsx';
import Badge from '../components/Badge.jsx';
import { formatearFechaCorta } from '../utils/format.js';

/** Formulario reutilizable para crear/editar apiarios. */
function ApiarioForm({ inicial, onGuardar, onCancelar, guardando }) {
  const [form, setForm] = useState({
    nombre: inicial?.nombre || '',
    municipio: inicial?.municipio || '',
    descripcion: inicial?.descripcion || '',
    lat: inicial?.lat ?? '',
    lng: inicial?.lng ?? '',
  });
  const [errores, setErrores] = useState({});
  const [ubicando, setUbicando] = useState(false);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  /** Botón "usar mi ubicación" — geolocalización del navegador. */
  function usarMiUbicacion() {
    if (!navigator.geolocation) {
      setErrores((e) => ({ ...e, lat: 'Tu navegador no soporta geolocalización.' }));
      return;
    }
    setUbicando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setUbicando(false);
      },
      () => {
        setErrores((e) => ({ ...e, lat: 'No se pudo obtener tu ubicación.' }));
        setUbicando(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function validar() {
    const nuevos = {};
    if (!form.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio.';
    const lat = form.lat === '' ? null : Number(form.lat);
    const lng = form.lng === '' ? null : Number(form.lng);
    if (lat != null && (Number.isNaN(lat) || lat < -90 || lat > 90)) {
      nuevos.lat = 'Latitud inválida (-90 a 90).';
    }
    if (lng != null && (Number.isNaN(lng) || lng < -180 || lng > 180)) {
      nuevos.lng = 'Longitud inválida (-180 a 180).';
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  function enviar(e) {
    e.preventDefault();
    if (!validar()) return;
    onGuardar({
      nombre: form.nombre.trim(),
      municipio: form.municipio.trim() || undefined,
      descripcion: form.descripcion.trim() || undefined,
      lat: form.lat === '' ? undefined : Number(form.lat),
      lng: form.lng === '' ? undefined : Number(form.lng),
    });
  }

  return (
    <form onSubmit={enviar} noValidate>
      <Field id="api-nombre" label="Nombre del apiario" error={errores.nombre} requerido>
        <input
          id="api-nombre"
          className="input"
          value={form.nombre}
          onChange={set('nombre')}
          placeholder="Apiario El Roble"
          aria-invalid={Boolean(errores.nombre)}
        />
      </Field>

      <Field id="api-municipio" label="Municipio">
        <input
          id="api-municipio"
          className="input"
          value={form.municipio}
          onChange={set('municipio')}
          placeholder="Tlalpan, CDMX"
        />
      </Field>

      <Field id="api-descripcion" label="Descripción">
        <textarea
          id="api-descripcion"
          className="textarea"
          value={form.descripcion}
          onChange={set('descripcion')}
          placeholder="Terreno con flores de mezquite, sombra parcial…"
        />
      </Field>

      <div className="grid grid--dos">
        <Field id="api-lat" label="Latitud" error={errores.lat}>
          <input
            id="api-lat"
            className="input"
            inputMode="decimal"
            value={form.lat}
            onChange={set('lat')}
            placeholder="19.4326"
            aria-invalid={Boolean(errores.lat)}
          />
        </Field>
        <Field id="api-lng" label="Longitud" error={errores.lng}>
          <input
            id="api-lng"
            className="input"
            inputMode="decimal"
            value={form.lng}
            onChange={set('lng')}
            placeholder="-99.1332"
            aria-invalid={Boolean(errores.lng)}
          />
        </Field>
      </div>

      <button type="button" className="btn btn--secundario btn--pequeno" onClick={usarMiUbicacion} disabled={ubicando}>
        📍 {ubicando ? 'Obteniendo…' : 'Usar mi ubicación'}
      </button>

      <div className="modal__pie" style={{ paddingRight: 0, paddingLeft: 0, border: 'none' }}>
        <button type="button" className="btn btn--secundario" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primario" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

/** Página de gestión de apiarios: listado, mapa y CRUD con modales. */
export default function Apiarios() {
  const { datos, cargando, error, refetch } = useFetch('/apiarios');
  const { esDueno } = useAuth();
  const toast = useToast();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  const apiarios = useMemo(() => (Array.isArray(datos) ? datos : []), [datos]);

  function abrirCrear() {
    setEnEdicion(null);
    setModalAbierto(true);
  }
  function abrirEditar(a) {
    setEnEdicion(a);
    setModalAbierto(true);
  }

  async function guardar(valores) {
    setGuardando(true);
    try {
      if (enEdicion) {
        await put(`/apiarios/${enEdicion.id}`, valores);
        toast.exito('Apiario actualizado correctamente.');
      } else {
        await post('/apiarios', valores);
        toast.exito('Apiario creado correctamente.');
      }
      setModalAbierto(false);
      setEnEdicion(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar el apiario.');
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    setEliminando(true);
    try {
      await del(`/apiarios/${aEliminar.id}`);
      toast.exito('Apiario eliminado.');
      setAEliminar(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar el apiario.');
    } finally {
      setEliminando(false);
    }
  }

  function alSeleccionarMarcador(a) {
    setSeleccionado([Number(a.lat), Number(a.lng)]);
  }

  return (
    <div className="pila">
      <div className="seccion-titulo">
        <div>
          <h1>Apiarios</h1>
          <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>
            Tus ubicaciones y sus colmenas.
          </p>
        </div>
        <button type="button" className="btn btn--primario" onClick={abrirCrear}>
          + Nuevo apiario
        </button>
      </div>

      {cargando && <Loader mensaje="Cargando apiarios…" />}

      {error && (
        <div className="aviso aviso--error" role="alert">
          No se pudo cargar la lista: {error.message}
        </div>
      )}

      {!cargando && !error && apiarios.length === 0 && (
        <EmptyState
          icono="📍"
          titulo="Sin apiarios registrados"
          mensaje="Registra tu primer apiario con su ubicación para comenzar."
          accion={<button type="button" className="btn btn--primario" onClick={abrirCrear}>Crear apiario</button>}
        />
      )}

      {!cargando && apiarios.length > 0 && (
        <>
          <section className="tarjeta" aria-label="Mapa de apiarios">
            <h2 className="tarjeta__titulo">Mapa</h2>
            <p className="texto-suave texto-pequeno">
              Haz clic en un marcador para centrar la vista en ese apiario.
            </p>
            <ApiarioMap apiarios={apiarios} seleccionado={seleccionado} onSeleccionar={alSeleccionarMarcador} />
          </section>

          <section className="grid grid--tarjetas" aria-label="Listado de apiarios">
            {apiarios.map((a) => (
              <article key={a.id} className="tarjeta tarjeta--interactiva">
                <div className="tarjeta__cabecera">
                  <h3 className="tarjeta__titulo">{a.nombre}</h3>
                  <Badge variante="ok">{a.colmenas_activas ?? 0} activas</Badge>
                </div>
                {a.municipio && <p className="texto-suave texto-pequeno">📍 {a.municipio}</p>}
                {a.descripcion && <p className="texto-pequeno">{a.descripcion}</p>}

                <div className="tarjeta__meta">
                  <span>🏠 {a.total_colmenas ?? 0} colmenas</span>
                  {a.lat != null && (
                    <span className="coordenadas texto-pequeno">
                      {Number(a.lat).toFixed(4)}, {Number(a.lng).toFixed(4)}
                    </span>
                  )}
                </div>
                <p className="texto-pequeno texto-suave" style={{ marginTop: '0.3rem' }}>
                  Creado: {formatearFechaCorta(a.created_at)}
                </p>

                <div className="acciones-fila mt-2">
                  <Link className="btn btn--pequeno btn--verde" to={`/apiarios/${a.id}`}>
                    Ver colmenas
                  </Link>
                  <button type="button" className="btn btn--pequeno btn--secundario" onClick={() => abrirEditar(a)}>
                    Editar
                  </button>
                  {a.lat != null && (
                    <button
                      type="button"
                      className="btn btn--pequeno btn--secundario"
                      onClick={() => setSeleccionado([Number(a.lat), Number(a.lng)])}
                      aria-label={`Centrar mapa en ${a.nombre}`}
                    >
                      Ver mapa
                    </button>
                  )}
                  {/* Solo el dueño puede eliminar apiarios. */}
                  {esDueno && (
                    <button type="button" className="btn btn--pequeno btn--peligro" onClick={() => setAEliminar(a)}>
                      Eliminar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      {/* Modal crear/editar */}
      <Modal
        abierto={modalAbierto}
        alCerrar={() => !guardando && setModalAbierto(false)}
        titulo={enEdicion ? 'Editar apiario' : 'Nuevo apiario'}
      >
        <ApiarioForm
          inicial={enEdicion}
          onGuardar={guardar}
          onCancelar={() => setModalAbierto(false)}
          guardando={guardando}
        />
      </Modal>

      {/* Confirmación de borrado */}
      <ConfirmDialog
        abierto={Boolean(aEliminar)}
        titulo="Eliminar apiario"
        mensaje={`¿Seguro que deseas eliminar "${aEliminar?.nombre}"? Se eliminarán también sus colmenas asociadas.`}
        procesando={eliminando}
        alConfirmar={confirmarEliminar}
        alCancelar={() => setAEliminar(null)}
      />
    </div>
  );
}
