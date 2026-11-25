import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import Badge from './Badge.jsx';
import { etiquetaRol } from '../utils/format.js';
import {
  IconoDashboard,
  IconoApiario,
  IconoColmena,
  IconoSalud,
  IconoPerfil,
  IconoEquipo,
  IconoSalir,
} from './icons.jsx';

/** Clase activa para NavLink. */
const clase = ({ isActive }) => `sidebar__enlace${isActive ? ' activo' : ''}`;

/**
 * Navegación lateral. Usa <nav> semántico con aria-label.
 * Los enlaces son navegables por teclado de forma natural.
 */
export default function Sidebar({ alNavegar }) {
  const { usuario, esDueno, logout } = useAuth();
  const navigate = useNavigate();

  function cerrarSesion() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar app-sidebar" id="menu-lateral">
      <nav className="sidebar__nav" aria-label="Navegación principal">
        <span className="sidebar__grupo-titulo">Panel</span>
        <NavLink to="/dashboard" className={clase} onClick={alNavegar} end>
          <IconoDashboard /> Dashboard
        </NavLink>

        <span className="sidebar__grupo-titulo">Gestión</span>
        <NavLink to="/apiarios" className={clase} onClick={alNavegar}>
          <IconoApiario /> Apiarios
        </NavLink>
        <NavLink to="/colmenas" className={clase} onClick={alNavegar}>
          <IconoColmena /> Colmenas
        </NavLink>
        <NavLink to="/sanidad" className={clase} onClick={alNavegar}>
          <IconoSalud /> Sanidad
        </NavLink>
        {/* El equipo solo lo gestiona el dueño de la operación. */}
        {esDueno && (
          <NavLink to="/equipo" className={clase} onClick={alNavegar}>
            <IconoEquipo /> Equipo
          </NavLink>
        )}

        <span className="sidebar__grupo-titulo">Cuenta</span>
        <NavLink to="/perfil" className={clase} onClick={alNavegar}>
          <IconoPerfil /> Perfil
        </NavLink>
        <button type="button" className="sidebar__enlace" onClick={cerrarSesion} aria-label="Cerrar sesión">
          <IconoSalir /> Cerrar sesión
        </button>

        {usuario && (
          <div className="sidebar__sesion">
            <span className="texto-pequeno texto-suave">
              Sesión: <strong>{usuario.nombre}</strong>
            </span>
            <Badge variante={esDueno ? 'alerta' : 'info'}>{etiquetaRol(usuario.rol)}</Badge>
          </div>
        )}
      </nav>
    </aside>
  );
}
