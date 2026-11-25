import { Routes, Route } from 'react-router-dom';

import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Inicio from './pages/Inicio.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Apiarios from './pages/Apiarios.jsx';
import ApiarioDetalle from './pages/ApiarioDetalle.jsx';
import Colmenas from './pages/Colmenas.jsx';
import ColmenaDetalle from './pages/ColmenaDetalle.jsx';
import Sanidad from './pages/Sanidad.jsx';
import Equipo from './pages/Equipo.jsx';
import Perfil from './pages/Perfil.jsx';
import NotFound from './pages/NotFound.jsx';

/**
 * Definición de rutas de la SPA.
 * La página de inicio ("/") es pública; el resto de la app vive dentro de
 * <ProtectedRoute> + <Layout>.
 */
export default function App() {
  return (
    <Routes>
      {/* Ruta pública de inicio (visible sin sesión) */}
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />

      {/* Rutas protegidas (requieren sesión) */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/apiarios" element={<Apiarios />} />
        <Route path="/apiarios/:id" element={<ApiarioDetalle />} />
        <Route path="/colmenas" element={<Colmenas />} />
        <Route path="/colmenas/:id" element={<ColmenaDetalle />} />
        <Route path="/sanidad" element={<Sanidad />} />
        {/* Gestión de trabajadores: solo el dueño */}
        <Route
          path="/equipo"
          element={
            <ProtectedRoute soloDueno>
              <Equipo />
            </ProtectedRoute>
          }
        />
        <Route path="/perfil" element={<Perfil />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
