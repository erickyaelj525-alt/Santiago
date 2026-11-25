import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import Loader from './Loader.jsx';

/**
 * Envuelve rutas privadas. Si no hay sesión activa redirige a /login
 * conservando la ruta de origen para volver tras autenticarse.
 * Mientras se valida el token se muestra un loader (evita "parpadeos").
 */
export default function ProtectedRoute({ children }) {
  const { usuario, cargando } = useAuth();
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

  return children;
}
