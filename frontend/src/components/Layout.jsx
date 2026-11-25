import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import useAuth from '../hooks/useAuth.js';

/**
 * Layout principal: compone Navbar + Sidebar + <main>.
 * El sidebar se comporta como drawer en móvil y como columna fija en escritorio.
 */
export default function Layout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const { usuario } = useAuth();

  const alternar = () => setSidebarAbierto((v) => !v);
  const cerrar = () => setSidebarAbierto(false);

  return (
    <div className={`app-layout${sidebarAbierto ? ' sidebar-abierto' : ''}`}>
      <Navbar alAlternarSidebar={alternar} tituloUsuario={usuario?.nombre} />

      <Sidebar alNavegar={cerrar} />

      {/* Overlay para cerrar el drawer en móvil */}
      <div className="app-overlay" onClick={cerrar} aria-hidden="true" />

      <main className="app-main" id="contenido-principal">
        <div className="contenedor">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
