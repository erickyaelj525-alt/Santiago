import { useContext } from 'react';
import AuthContext from '../context/AuthContext.jsx';

/**
 * Hook de conveniencia para consumir el contexto de autenticación.
 * Devuelve { usuario, token, cargando, login, register, logout }.
 */
export default function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
}
