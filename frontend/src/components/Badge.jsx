/**
 * Etiqueta de estado con variantes de color.
 * @param {'neutro'|'ok'|'alerta'|'peligro'|'info'} variante
 */
export default function Badge({ variante = 'neutro', children, titulo }) {
  return (
    <span className={`badge badge--${variante}`} title={titulo}>
      {children}
    </span>
  );
}
