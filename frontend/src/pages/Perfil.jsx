import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import Badge from '../components/Badge.jsx';
import { etiquetaRol } from '../utils/format.js';

/**
 * Perfil del usuario autenticado (datos de sesión) + cierre de sesión.
 */
export default function Perfil() {
  const { usuario, esDueno, logout } = useAuth();
  const navigate = useNavigate();

  function cerrarSesion() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="pila">
      <h1>Mi perfil</h1>

      <section className="tarjeta" aria-labelledby="perfil-datos">
        <h2 className="tarjeta__titulo" id="perfil-datos">Datos de la cuenta</h2>
        <dl className="detalle-lista">
          <dt>Nombre</dt>
          <dd>{usuario?.nombre || '—'}</dd>
          <dt>Correo</dt>
          <dd>{usuario?.email || '—'}</dd>
          <dt>Rol</dt>
          <dd>
            <Badge variante={esDueno ? 'alerta' : 'info'}>{etiquetaRol(usuario?.rol)}</Badge>
            <span className="texto-suave texto-pequeno" style={{ marginLeft: '0.5rem' }}>
              {esDueno
                ? 'Control total de la operación.'
                : 'Puedes crear y editar; el dueño gestiona el equipo.'}
            </span>
          </dd>
        </dl>
      </section>

      <div>
        <button type="button" className="btn btn--peligro" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
