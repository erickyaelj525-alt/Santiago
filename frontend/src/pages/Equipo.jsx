import { useMemo, useState } from 'react';

import useFetch from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import { post, patch, del } from '../api/client.js';

import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Field from '../components/Field.jsx';
import Badge from '../components/Badge.jsx';
import { formatearFecha, etiquetaRol } from '../utils/format.js';

/** Variante de color del badge según el rol. */
const varianteRol = (rol) => (rol === 'dueno' ? 'alerta' : 'info');

/** Iniciales para el avatar (máx. 2 letras). */
function iniciales(nombre = '') {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

/** Formulario para dar de alta un trabajador. */
function TrabajadorForm({ onGuardar, onCancelar, guardando }) {
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [errores, setErrores] = useState({});
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  function enviar(e) {
    e.preventDefault();
    const nuevos = {};
    if (!form.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio.';
    if (!form.email.trim()) nuevos.email = 'El correo es obligatorio.';
    if (!form.password) nuevos.password = 'La contraseña es obligatoria.';
    else if (form.password.length < 6) nuevos.password = 'Mínimo 6 caracteres.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    onGuardar({
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      password: form.password,
      // Permite mostrar en el modal los errores de validación del servidor.
      setErrores,
    });
  }

  return (
    <form onSubmit={enviar} noValidate>
      <Field id="trb-nombre" label="Nombre" error={errores.nombre} requerido>
        <input
          id="trb-nombre"
          className="input"
          type="text"
          autoComplete="off"
          placeholder="Luis Ramírez"
          value={form.nombre}
          onChange={set('nombre')}
          aria-invalid={Boolean(errores.nombre)}
        />
      </Field>

      <Field id="trb-email" label="Correo electrónico" error={errores.email} requerido>
        <input
          id="trb-email"
          className="input"
          type="email"
          autoComplete="off"
          placeholder="trabajador@ejemplo.com"
          value={form.email}
          onChange={set('email')}
          aria-invalid={Boolean(errores.email)}
        />
      </Field>

      <Field
        id="trb-password"
        label="Contraseña"
        error={errores.password}
        ayuda="Al menos 6 caracteres."
        requerido
      >
        <input
          id="trb-password"
          className="input"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.password}
          onChange={set('password')}
          aria-invalid={Boolean(errores.password)}
        />
      </Field>

      <div className="modal__pie" style={{ paddingRight: 0, paddingLeft: 0, border: 'none' }}>
        <button type="button" className="btn btn--secundario" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primario" disabled={guardando}>
          {guardando ? 'Creando…' : 'Crear trabajador'}
        </button>
      </div>
    </form>
  );
}

/** Formulario para restablecer la contraseña de un trabajador. */
function RestablecerForm({ trabajador, onGuardar, onCancelar, guardando }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function enviar(e) {
    e.preventDefault();
    if (!password) {
      setError('La contraseña es obligatoria.');
      return;
    }
    if (password.length < 6) {
      setError('Mínimo 6 caracteres.');
      return;
    }
    setError('');
    onGuardar(password, setError);
  }

  return (
    <form onSubmit={enviar} noValidate>
      <p className="texto-suave texto-pequeno">
        Nueva contraseña para <strong>{trabajador?.nombre}</strong> ({trabajador?.email}).
      </p>
      <Field id="rst-password" label="Nueva contraseña" error={error} requerido>
        <input
          id="rst-password"
          className="input"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(error)}
        />
      </Field>

      <div className="modal__pie" style={{ paddingRight: 0, paddingLeft: 0, border: 'none' }}>
        <button type="button" className="btn btn--secundario" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primario" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Restablecer'}
        </button>
      </div>
    </form>
  );
}

/**
 * Página de gestión del equipo (trabajadores). Solo accesible para el dueño.
 * Permite crear, restablecer contraseña y eliminar trabajadores.
 */
export default function Equipo() {
  const { datos, cargando, error, refetch } = useFetch('/trabajadores');
  const toast = useToast();

  const [modalCrear, setModalCrear] = useState(false);
  const [aRestablecer, setARestablecer] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const miembros = useMemo(() => (Array.isArray(datos) ? datos : []), [datos]);
  const trabajadores = useMemo(() => miembros.filter((m) => m.rol !== 'dueno'), [miembros]);

  async function crear(valores) {
    const { setErrores, ...cuerpo } = valores;
    setGuardando(true);
    try {
      await post('/trabajadores', cuerpo);
      toast.exito('Trabajador creado. Ya puede iniciar sesión.');
      setModalCrear(false);
      await refetch();
    } catch (err) {
      // Mapea los errores de validación por campo que devuelva el backend.
      if (Array.isArray(err.details) && err.details.length && setErrores) {
        const porCampo = {};
        err.details.forEach((d) => {
          if (d.campo) porCampo[d.campo] = d.mensaje;
        });
        setErrores((prev) => ({ ...prev, ...porCampo }));
      }
      toast.error(err.message || 'No se pudo crear el trabajador.');
    } finally {
      setGuardando(false);
    }
  }

  async function restablecer(password, setError) {
    setGuardando(true);
    try {
      await patch(`/trabajadores/${aRestablecer.id}`, { password });
      toast.exito('Contraseña actualizada.');
      setARestablecer(null);
    } catch (err) {
      if (Array.isArray(err.details) && err.details.length && setError) {
        const detalle = err.details.find((d) => d.campo === 'password');
        if (detalle) setError(detalle.mensaje);
      }
      toast.error(err.message || 'No se pudo restablecer la contraseña.');
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    setEliminando(true);
    try {
      await del(`/trabajadores/${aEliminar.id}`);
      toast.exito('Trabajador eliminado.');
      setAEliminar(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar el trabajador.');
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="pila">
      <div className="seccion-titulo">
        <div>
          <h1>Equipo</h1>
          <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>
            Gestiona a las personas que te ayudan en el apiario.
          </p>
        </div>
        <button type="button" className="btn btn--primario" onClick={() => setModalCrear(true)}>
          + Agregar trabajador
        </button>
      </div>

      {cargando && <Loader mensaje="Cargando equipo…" />}

      {error && (
        <div className="aviso aviso--error" role="alert">
          No se pudo cargar el equipo: {error.message}
          <button type="button" className="btn btn--secundario btn--pequeno" onClick={refetch} style={{ marginLeft: '0.75rem' }}>
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && trabajadores.length === 0 && (
        <EmptyState
          icono="👥"
          titulo="Todavía no tienes trabajadores"
          mensaje="Crea una cuenta para tu primer trabajador: compartirá tus apiarios y colmenas, pero no podrá eliminarlos ni gestionar al equipo."
          accion={
            <button type="button" className="btn btn--primario" onClick={() => setModalCrear(true)}>
              Agregar trabajador
            </button>
          }
        />
      )}

      {!cargando && !error && miembros.length > 0 && (
        <section className="tarjeta" aria-label="Miembros del equipo">
          <div className="tabla-scroll">
            <table className="tabla tabla--tarjetas">
              <caption className="oculto-visual">Miembros del equipo apícola</caption>
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Inspecciones</th>
                  <th scope="col">Última actividad</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {miembros.map((m) => {
                  const esTrabajador = m.rol !== 'dueno';
                  return (
                    <tr key={m.id}>
                      <td data-label="Nombre">
                        <span className="fila" style={{ gap: '0.6rem' }}>
                          <span className="avatar" aria-hidden="true">{iniciales(m.nombre)}</span>
                          <strong>{m.nombre}</strong>
                        </span>
                      </td>
                      <td data-label="Correo">{m.email}</td>
                      <td data-label="Rol">
                        <Badge variante={varianteRol(m.rol)}>{etiquetaRol(m.rol)}</Badge>
                      </td>
                      <td data-label="Estado">
                        <Badge variante="ok">Activo</Badge>
                      </td>
                      <td data-label="Inspecciones">{m.inspecciones_registradas ?? 0}</td>
                      <td data-label="Última actividad">{formatearFecha(m.ultima_actividad)}</td>
                      <td data-label="Acciones">
                        {esTrabajador ? (
                          <div className="acciones-fila">
                            <button
                              type="button"
                              className="btn btn--pequeno btn--secundario"
                              onClick={() => setARestablecer(m)}
                              aria-label={`Restablecer contraseña de ${m.nombre}`}
                            >
                              Restablecer contraseña
                            </button>
                            <button
                              type="button"
                              className="btn btn--pequeno btn--peligro"
                              onClick={() => setAEliminar(m)}
                              aria-label={`Eliminar a ${m.nombre}`}
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <span className="texto-suave texto-pequeno">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal: crear trabajador */}
      <Modal abierto={modalCrear} alCerrar={() => !guardando && setModalCrear(false)} titulo="Agregar trabajador">
        <TrabajadorForm
          onGuardar={crear}
          onCancelar={() => setModalCrear(false)}
          guardando={guardando}
        />
      </Modal>

      {/* Modal: restablecer contraseña */}
      <Modal
        abierto={Boolean(aRestablecer)}
        alCerrar={() => !guardando && setARestablecer(null)}
        titulo="Restablecer contraseña"
      >
        {aRestablecer && (
          <RestablecerForm
            trabajador={aRestablecer}
            onGuardar={restablecer}
            onCancelar={() => setARestablecer(null)}
            guardando={guardando}
          />
        )}
      </Modal>

      {/* Confirmación de borrado */}
      <ConfirmDialog
        abierto={Boolean(aEliminar)}
        titulo="Eliminar trabajador"
        mensaje={`¿Seguro que deseas eliminar a "${aEliminar?.nombre}"? Perderá el acceso al sistema.`}
        procesando={eliminando}
        alConfirmar={confirmarEliminar}
        alCancelar={() => setAEliminar(null)}
      />
    </div>
  );
}
