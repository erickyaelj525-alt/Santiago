/**
 * Spinner de carga accesible. Muestra un mensaje opcional.
 */
export default function Loader({ mensaje = 'Cargando…', pequeno = false }) {
  return (
    <div className="loader-caja" role="status" aria-live="polite">
      <div
        className="spinner"
        style={pequeno ? { width: 22, height: 22, borderWidth: 2 } : undefined}
        aria-hidden="true"
      />
      {mensaje && <p className="texto-suave texto-pequeno mb-2">{mensaje}</p>}
    </div>
  );
}
