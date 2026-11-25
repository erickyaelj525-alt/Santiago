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

function extraerSesion(data) {
  const respuesta = data?.data ?? data;
  const mensaje = respuesta?.mensaje || respuesta?.message;

  if (typeof respuesta?.token !== 'string' || !respuesta.token.trim()) {
    throw new Error(mensaje || 'El servidor no devolvió el token de autenticación.');
  }
  if (!respuesta.usuario || typeof respuesta.usuario !== 'object' || Array.isArray(respuesta.usuario)) {
    throw new Error(mensaje || 'El servidor no devolvió los datos del usuario.');
  }

  return { token: respuesta.token, usuario: respuesta.usuario };
}

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
    const sesion = extraerSesion(await post('/auth/login', { email, password }));
    setToken(sesion.token);
    setTokenState(sesion.token);
    setUsuario(sesion.usuario);
    return sesion.usuario;
  }, []);

  /** Registra la cuenta del dueño e inicia sesión automáticamente. */
  const register = useCallback(async (nombre, email, password) => {
    const sesion = extraerSesion(await post('/auth/register', { nombre, email, password }));
    setToken(sesion.token);
    setTokenState(sesion.token);
    setUsuario(sesion.usuario);
    return sesion.usuario;
  }, []);

  // Helper booleano: true cuando el usuario autenticado es el dueño.
  const esDueno = usuario?.rol === 'dueno';

  const value = useMemo(
    () => ({ usuario, token, cargando, esDueno, login, register, logout }),
    [usuario, token, cargando, esDueno, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
