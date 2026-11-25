/**
 * Códigos de verificación de correo.
 * Se comparten entre el auto-registro del dueño y la creación de trabajadores
 * que hace el dueño, para que ambos fluyan igual (código de 6 dígitos + 15 min).
 */

/** Minutos de vigencia del código. */
export const MINUTOS_VIGENCIA_CODIGO = 15;

/** Genera un código numérico de 6 dígitos. */
export function generarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Fecha de expiración del código (ahora + minutos de vigencia). */
export function fechaExpiracionCodigo() {
  return new Date(Date.now() + MINUTOS_VIGENCIA_CODIGO * 60 * 1000);
}
