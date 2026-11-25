/**
 * Cliente HTTP basado en fetch nativo (requisito: no usar axios).
 * - Inyecta el token JWT desde localStorage en el header Authorization.
 * - Normaliza las respuestas y lanza Error con el mensaje del backend.
 * - Maneja 401 (sesión expirada) notificando para cerrar sesión.
 */

// Base configurable por variable de entorno. Por defecto '/api' (proxy de Vite).
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'apiario_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

// Callback que se ejecuta cuando el backend responde 401.
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

/** Error enriquecido con la información de validación del backend. */
export class ApiError extends Error {
  constructor(mensaje, status, details) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.details = details || [];
  }
}

/**
 * Realiza una petición al backend.
 * @param {string} ruta - ruta relativa, p.ej. '/apiarios'
 * @param {object} opciones - { method, body, headers, publico }
 *   `publico: true` evita adjuntar el token y no dispara el cierre de sesión
 *   automático (para endpoints anónimos).
 */
async function request(ruta, { method = 'GET', body, headers = {}, publico = false } = {}) {
  const token = publico ? null : getToken();

  const opciones = {
    method,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  };

  if (token) opciones.headers.Authorization = `Bearer ${token}`;

  if (body !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${ruta}`, opciones);
  } catch {
    // Fetch no distingue entre una caída del backend, URL incorrecta y CORS.
    throw new ApiError(
      'No se pudo conectar con la API. Revisa VITE_API_URL, que el backend esté disponible y la configuración CORS (CLIENT_URL).',
      0,
      [],
    );
  }

  // Sesión expirada o inválida (no aplica a peticiones públicas).
  if (res.status === 401) {
    if (!publico && onUnauthorized) onUnauthorized();
    // Se intenta leer el mensaje del backend para mostrarlo igual.
    let mensaje = 'Tu sesión expiró. Inicia sesión de nuevo.';
    try {
      const data = await res.json();
      if (data?.error) mensaje = data.error;
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    throw new ApiError(mensaje, 401, []);
  }

  // 204 Sin contenido (DELETE exitosos).
  if (res.status === 204) return null;

  // Respuesta con cuerpo JSON.
  let data = null;
  const texto = await res.text();
  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = texto;
    }
  }

  if (!res.ok) {
    const mensaje =
      (data && (data.error || data.message)) || `Error ${res.status} al procesar la solicitud.`;
    const details = data && Array.isArray(data.details) ? data.details : [];
    throw new ApiError(mensaje, res.status, details);
  }

  return data;
}

export const get = (ruta) => request(ruta, { method: 'GET' });
export const post = (ruta, body) => request(ruta, { method: 'POST', body });
export const put = (ruta, body) => request(ruta, { method: 'PUT', body });
export const patch = (ruta, body) => request(ruta, { method: 'PATCH', body });
export const del = (ruta) => request(ruta, { method: 'DELETE' });

/** GET a un endpoint público: no envía token ni afecta la sesión. */
export const getPublico = (ruta) => request(ruta, { method: 'GET', publico: true });

export default { get, getPublico, post, put, patch, del, getToken, setToken, setUnauthorizedHandler, ApiError };
