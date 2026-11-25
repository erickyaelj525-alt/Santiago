/**
 * Datos de contacto del proyecto (WhatsApp).
 * Centralizados para no repetir el número en varias pantallas.
 */
export const WHATSAPP_NUMERO = '525627553499';
export const WHATSAPP_DISPLAY = '+52 562 755 3499';

/**
 * Enlace a WhatsApp con un mensaje inicial.
 * @param {string} [mensaje] texto que aparecerá precargado en el chat
 */
export function urlWhatsApp(mensaje = 'Hola, quiero información sobre Apiario Digital.') {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

export const WHATSAPP_URL = urlWhatsApp();
