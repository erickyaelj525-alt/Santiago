/**
 * Campo de formulario accesible: asocia label + control + mensaje de error
 * mediante los atributos id / htmlFor / aria-describedby.
 *
 * @param {object} props
 * @param {string} props.id - identificador único (obligatorio para accesibilidad)
 * @param {string} props.label
 * @param {string} [props.error]
 * @param {string} [props.ayuda]
 * @param {boolean} [props.requerido]
 * @param {React.ReactNode} props.children - el control (input/select/textarea)
 */
export default function Field({ id, label, error, ayuda, requerido, children }) {
  return (
    <div className="campo">
      <label className="campo__label" htmlFor={id}>
        {label}
        {requerido && <span className="campo__req" aria-hidden="true"> *</span>}
      </label>
      {children}
      {ayuda && !error && (
        <span className="campo__ayuda" id={`${id}-ayuda`}>{ayuda}</span>
      )}
      {error && (
        <span className="campo__error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
