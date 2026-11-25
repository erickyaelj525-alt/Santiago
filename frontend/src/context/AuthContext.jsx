import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  get,
  post,
  getToken,
  setToken,
  setUnauthorizedHandler,
} from '../api/client.js';

/** Contexto de autenticación de Apiario Digital. */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setTokenState] = useState(() => getToken());
  const [cargando, setCargando] = useState(true);

  /** Cierra la sesión local (limpia token y usuario). */
  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
    setUsuario(null);
  }, []);

  // Si el backend responde 401, cerramos sesión automáticamente.
  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Al iniciar la app, si hay token guardado validamos la sesión con GET /auth/me.
  useEffect(() => {
    let activo = true;

    async function validarSesion() {
      const tokenGuardado = getToken();
      if (!tokenGuardado) {
        setCargando(false);
        return;
      }
      try {
        const data = await get('/auth/me');
        if (!activo) return;
        setUsuario(data.usuario);
        setTokenState(tokenGuardado);
      } catch {
        if (activo) logout();
      } finally {
        if (activo) setCargando(false);
      }
    }

    validarSesion();
    return () => {
      activo = false;
    };
  }, [logout]);

  /** Inicia sesión con email y password. */
  const login = useCallback(async (email, password) => {
    const data = await post('/auth/login', { email, password });
    setToken(data.token);
    setTokenState(data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  /** Registra un nuevo usuario y deja la sesión iniciada. */
  const register = useCallback(async (nombre, email, password) => {
    const data = await post('/auth/register', { nombre, email, password });
    setToken(data.token);
    setTokenState(data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const value = useMemo(
    () => ({ usuario, token, cargando, login, register, logout }),
    [usuario, token, cargando, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
