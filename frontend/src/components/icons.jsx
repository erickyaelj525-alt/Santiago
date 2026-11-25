/**
 * Íconos SVG en línea reutilizables (stroke currentColor, 20x20).
 * Se usan en la navegación; todos son decorativos (aria-hidden).
 */
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

export const IconoDashboard = (p) => (
  <svg {...base} {...p}><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
);
export const IconoApiario = (p) => (
  <svg {...base} {...p}><path d="M12 2l9 5v10l-9 5-9-5V7z" /><path d="M3 7l9 5 9-5" /><path d="M12 12v10" /></svg>
);
export const IconoColmena = (p) => (
  <svg {...base} {...p}><rect x="5" y="3" width="14" height="5" rx="1" /><rect x="5" y="10" width="14" height="5" rx="1" /><rect x="5" y="17" width="14" height="4" rx="1" /><path d="M8 18v1M16 18v1" /></svg>
);
export const IconoPerfil = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
);
export const IconoSalir = (p) => (
  <svg {...base} {...p}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M10 17l-5-5 5-5" /><path d="M5 12h12" /></svg>
);
export const IconoMenu = (p) => (
  <svg {...base} {...p}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
);
export const IconoMas = (p) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
