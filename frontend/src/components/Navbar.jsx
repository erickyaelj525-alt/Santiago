import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import Badge from './Badge.jsx';
import useAuth from '../hooks/useAuth.js';
import { etiquetaRol } from '../utils/format.js';
import { IconoMenu } from './icons.jsx';

/**
 * Encabezado semántico de la aplicación.
 * Incluye skip-link accesible, botón de menú (móvil) y zona de acciones
 * con el nombre y el rol del usuario en sesión.
 */
export default function Navbar({ alAlternarSidebar }) {
  const { usuario, esDueno } = useAuth();

  return (
    <header className="navbar app-navbar">
      <a className="oculto-visual" href="#contenido-principal">
        Saltar al contenido principal
      </a>
      <div className="navbar__inner">
        <button
          type="button"
          className="btn btn--fantasma btn--icono"
          onClick={alAlternarSidebar}
          aria-label="Abrir menú de navegación"
          aria-controls="menu-lateral"
        >
          <IconoMenu />
        </button>

        <Link to="/dashboard" className="navbar__logo" aria-label="Apiario Digital, ir al inicio">
          <Logo size={34} />
          <span>Apiario Digital</span>
        </Link>

        <div className="navbar__acciones">
          {usuario && (
            <span className="navbar__usuario">
              <span className="texto-pequeno navbar__titulo-corto">
                Hola, <strong>{usuario.nombre}</strong>
              </span>
              <Badge variante={esDueno ? 'alerta' : 'info'}>{etiquetaRol(usuario.rol)}</Badge>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
