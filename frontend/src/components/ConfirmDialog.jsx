import Modal from './Modal.jsx';

/**
 * Diálogo de confirmación para acciones destructivas (eliminar).
 * Reutiliza <Modal> para heredar la accesibilidad (Escape, foco, aria-modal).
 */
export default function ConfirmDialog({
  abierto,
  titulo = 'Confirmar acción',
  mensaje,
  textoConfirmar = 'Eliminar',
  textoCancelar = 'Cancelar',
  peligro = true,
  alConfirmar,
  alCancelar,
  procesando = false,
}) {
  return (
    <Modal
      abierto={abierto}
      alCerrar={procesando ? () => {} : alCancelar}
      titulo={titulo}
      pie={
        <>
          <button type="button" className="btn btn--secundario" onClick={alCancelar} disabled={procesando}>
            {textoCancelar}
          </button>
          <button
            type="button"
            className={`btn ${peligro ? 'btn--peligro' : 'btn--primario'}`}
            onClick={alConfirmar}
            disabled={procesando}
          >
            {procesando ? 'Procesando…' : textoConfirmar}
          </button>
        </>
      }
    >
      <p className="mb-2">{mensaje}</p>
    </Modal>
  );
}
