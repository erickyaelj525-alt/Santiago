import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import Loader from './Loader.jsx';

/**
 * Envuelve rutas privadas. Si no hay sesión activa redirige a /login
 * conservando la ruta de origen para volver tras autenticarse.
 * Mientras se valida el token se muestra un loader (evita "parpadeos").
 *
 * Con `soloDueno` restringe la ruta al rol dueño: los trabajadores son
 * redirigidos al dashboard con un aviso.
 */
export default function ProtectedRoute({ children, soloDueno = false }) {
  const { usuario, cargando, esDueno } = useAuth();
  const ubicacion = useLocation();

  if (cargando) {
    return (
      <div className="loader-caja" style={{ minHeight: '60vh' }}>
        <Loader mensaje="Verificando sesión…" />
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  }

  // Ruta reservada al dueño: el trabajador vuelve al dashboard con un aviso.
  if (soloDueno && !esDueno) {
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{ aviso: 'Esta sección es exclusiva del dueño de la operación.' }}
      />
    );
  }

  return children;
}
