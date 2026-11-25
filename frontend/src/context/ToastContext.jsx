import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Sistema de notificaciones "toast" ligero para dar feedback de las acciones
 * (crear, editar, eliminar, errores). Sin dependencias externas.
 */
const ToastContext = createContext(null);

let idContador = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const quitar = useCallback((id) => {
    setToasts((actuales) => actuales.filter((t) => t.id !== id));
  }, []);

  const mostrar = useCallback(
    (mensaje, tipo = 'info', duracion = 4000) => {
      const id = ++idContador;
      setToasts((actuales) => [...actuales, { id, mensaje, tipo }]);
      if (duracion > 0) {
        setTimeout(() => quitar(id), duracion);
      }
      return id;
    },
    [quitar],
  );

  const value = useMemo(
    () => ({
      mostrar,
      exito: (m) => mostrar(m, 'exito'),
      error: (m) => mostrar(m, 'error'),
      info: (m) => mostrar(m, 'info'),
      quitar,
    }),
    [mostrar, quitar],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Región viva para lectores de pantalla */}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tipo}`}>
            <span className="toast__mensaje">{t.mensaje}</span>
            <button
              type="button"
              className="toast__cerrar"
              onClick={() => quitar(t.id)}
              aria-label="Cerrar notificación"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Hook para lanzar notificaciones desde cualquier componente. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  return ctx;
}

export default ToastContext;
