import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { IconoMenu } from './icons.jsx';

/**
 * Encabezado semántico de la aplicación.
 * Incluye skip-link accesible, botón de menú (móvil) y zona de acciones.
 */
export default function Navbar({ alAlternarSidebar, tituloUsuario }) {
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
          {tituloUsuario && (
            <span className="texto-pequeno texto-suave navbar__titulo-corto">{tituloUsuario}</span>
          )}
        </div>
      </div>
    </header>
  );
}
