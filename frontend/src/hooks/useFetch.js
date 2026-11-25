import { useCallback, useEffect, useRef, useState } from 'react';
import { get } from '../api/client.js';

/**
 * Hook reutilizable para consumir la API.
 * Gestiona los estados cargando / error / datos y expone refetch().
 *
 * @param {string|null} ruta - endpoint relativo, p.ej. '/apiarios'. Si es null no hace nada.
 * @param {object} opciones - { immediate: boolean }
 */
export default function useFetch(ruta, { immediate = true } = {}) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(Boolean(immediate && ruta));
  const [error, setError] = useState(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const cargar = useCallback(async () => {
    if (!ruta) return null;
    setCargando(true);
    setError(null);
    try {
      const data = await get(ruta);
      if (montado.current) setDatos(data);
      return data;
    } catch (err) {
      if (montado.current) setError(err);
      throw err;
    } finally {
      if (montado.current) setCargando(false);
    }
  }, [ruta]);

  useEffect(() => {
    if (!immediate || !ruta) return;
    cargar().catch(() => {
      /* el error ya quedó en el estado; se evita la promesa no capturada */
    });
  }, [cargar, immediate, ruta]);

  return { datos, cargando, error, refetch: cargar };
}
