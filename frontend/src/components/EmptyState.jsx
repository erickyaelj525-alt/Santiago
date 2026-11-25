/**
 * Estado vacío reutilizable: se muestra cuando una colección no tiene datos.
 * Incluye una acción opcional (p. ej. "Crear el primero").
 */
export default function EmptyState({ icono = '🐝', titulo, mensaje, accion }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icono" aria-hidden="true">{icono}</div>
      <h3>{titulo}</h3>
      {mensaje && <p className="texto-suave">{mensaje}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}
