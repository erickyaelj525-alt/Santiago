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

  /**
   * Registra la cuenta del DUEÑO. NO inicia sesión: la cuenta queda pendiente
   * hasta confirmar el código enviado al correo. Devuelve la respuesta del
   * backend (con `correo_configurado` y, en modo demo, `codigo_demo`).
   * Las cuentas de trabajadores las crea el dueño desde "Equipo".
   */
  const register = useCallback(async (nombre, email, password) => {
    return post('/auth/register', { nombre, email, password });
  }, []);

  /** Confirma el código de verificación y deja la sesión iniciada. */
  const verificar = useCallback(async (email, codigo) => {
    const data = await post('/auth/verificar', { email, codigo });
    setToken(data.token);
    setTokenState(data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  /** Solicita un nuevo código de verificación para un correo. */
  const reenviarCodigo = useCallback(async (email) => {
    return post('/auth/reenviar-codigo', { email });
  }, []);

  // Helper booleano: true cuando el usuario autenticado es el dueño.
  const esDueno = usuario?.rol === 'dueno';

  const value = useMemo(
    () => ({ usuario, token, cargando, esDueno, login, register, verificar, reenviarCodigo, logout }),
    [usuario, token, cargando, esDueno, login, register, verificar, reenviarCodigo, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
