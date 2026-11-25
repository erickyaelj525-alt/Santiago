/**
 * Funciones de formateo para localización mexicana (es-MX).
 */

/** Fecha larga legible: 12 de agosto de 2026. */
export function formatearFecha(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Fecha corta: 12/08/2026. */
export function formatearFechaCorta(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Fecha y hora: 12/08/2026 14:30. */
export function formatearFechaHora(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Convierte '2026-08' en 'Ago 2026' para las gráficas. */
export function formatearMesMensual(mesIso) {
  if (!mesIso || typeof mesIso !== 'string') return '—';
  const [anio, mes] = mesIso.split('-');
  const nombres = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];
  const indice = Number(mes) - 1;
  const nombre = nombres[indice] || mes;
  return `${nombre} ${anio}`.trim();
}

/** Número con separadores de miles. */
export function formatearNumero(valor, decimales = 0) {
  const num = Number(valor);
  if (Number.isNaN(num)) return '0';
  return num.toLocaleString('es-MX', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

/** Kilos con unidad: "12.5 kg". */
export function formatearKg(valor, decimales = 1) {
  const num = Number(valor);
  if (Number.isNaN(num)) return '0 kg';
  return `${formatearNumero(num, decimales)} kg`;
}

/** Capitaliza la primera letra. */
export const capitalizar = (texto = '') =>
  texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : '';

/** Etiqueta legible del rol del usuario ('dueno' | 'trabajador'). */
export function etiquetaRol(rol) {
  if (rol === 'dueno') return 'Dueño';
  if (rol === 'trabajador') return 'Trabajador';
  return '—';
}
