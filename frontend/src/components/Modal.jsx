import { useEffect, useRef } from 'react';

/**
 * Modal accesible:
 * - Cierra con Escape.
 * - Bloquea el scroll del body mientras está abierto.
 * - Atrapa el foco dentro del diálogo y lo devuelve al abrir/cerrar.
 * - Usa role="dialog" + aria-modal + aria-labelledby.
 *
 * @param {object} props
 * @param {boolean} props.abierto
 * @param {() => void} props.alCerrar
 * @param {string} props.titulo
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.pie] - botones de acción
 * @param {boolean} [props.ancho]
 */
export default function Modal({ abierto, alCerrar, titulo, children, pie, ancho = false }) {
  const contenedorRef = useRef(null);
  const ultimoFoco = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;

    ultimoFoco.current = document.activeElement;

    // Enfoca el primer elemento interactuable del modal.
    const enfocables = contenedorRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (enfocables && enfocables.length) enfocables[0].focus();

    // Bloquea el scroll del fondo.
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function manejarTecla(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        alCerrar();
        return;
      }
      // Atrapa el foco (focus trap sencillo).
      if (e.key === 'Tab' && contenedorRef.current) {
        const elementos = Array.from(
          contenedorRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.disabled);
        if (!elementos.length) return;
        const primero = elementos[0];
        const ultimo = elementos[elementos.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    }

    document.addEventListener('keydown', manejarTecla);
    return () => {
      document.removeEventListener('keydown', manejarTecla);
      document.body.style.overflow = overflowOriginal;
      // Devuelve el foco al elemento que abrió el modal.
      if (ultimoFoco.current && typeof ultimoFoco.current.focus === 'function') {
        ultimoFoco.current.focus();
      }
    };
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        // Cierra al hacer clic fuera del contenido del modal.
        if (e.target === e.currentTarget) alCerrar();
      }}
    >
      <div
        className={`modal${ancho ? ' modal--ancho' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        ref={contenedorRef}
      >
        <header className="modal__cabecera">
          <h2 className="modal__titulo" id="modal-titulo">{titulo}</h2>
          <button
            type="button"
            className="btn btn--fantasma btn--icono"
            onClick={alCerrar}
            aria-label="Cerrar diálogo"
          >
            ✕
          </button>
        </header>
        <div className="modal__cuerpo">{children}</div>
        {pie && <footer className="modal__pie">{pie}</footer>}
      </div>
    </div>
  );
}
