import { WHATSAPP_DISPLAY, urlWhatsApp } from '../utils/contacto.js';

/**
 * Botón flotante de WhatsApp. Abre el chat directo al número de contacto.
 * Se muestra en el panel autenticado y en la página de inicio.
 *
 * @param {object} props
 * @param {string} [props.mensaje] - texto precargado del chat
 * @param {string} [props.clase] - clase adicional opcional
 */
export default function BotonWhatsApp({ mensaje, clase = '' }) {
  const href = mensaje ? urlWhatsApp(mensaje) : urlWhatsApp();

  return (
    <a
      href={href}
      className={`whatsapp-fab ${clase}`.trim()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Escríbenos por WhatsApp al ${WHATSAPP_DISPLAY}`}
    >
      <span className="whatsapp-fab__icono" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor">
          <path d="M16.02 3C9.4 3 4.02 8.38 4.02 15c0 2.11.55 4.09 1.52 5.81L4 29l8.37-1.5A11.94 11.94 0 0 0 16.02 27C22.64 27 28 21.62 28 15S22.64 3 16.02 3Zm0 21.8c-1.78 0-3.44-.48-4.86-1.31l-.35-.21-4.13.74.75-4.02-.23-.37A9.75 9.75 0 0 1 6.2 15c0-5.42 4.41-9.82 9.82-9.82 5.42 0 9.8 4.4 9.8 9.82 0 5.42-4.38 9.8-9.8 9.8Zm5.55-7.34c-.3-.15-1.79-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.18.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.79-1.68-2.09-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.68-1.63-.93-2.24-.24-.58-.49-.5-.68-.51-.17-.01-.38-.01-.58-.01s-.53.07-.8.38c-.28.3-1.06 1.03-1.06 2.51 0 1.48 1.08 2.92 1.23 3.12.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.79-.73 2.04-1.44.25-.7.25-1.31.18-1.44-.08-.13-.28-.2-.58-.35Z" />
        </svg>
      </span>
      <span className="whatsapp-fab__texto">
        <span className="whatsapp-fab__etiqueta">Escríbenos</span>
        <span className="whatsapp-fab__numero">{WHATSAPP_DISPLAY}</span>
      </span>
    </a>
  );
}
