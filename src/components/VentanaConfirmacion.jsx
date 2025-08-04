import "./VentanaConfirmacion.css";

export const VentanaConfirmacion = ({ mensaje, cancelar, confirmar }) => {
  return (
    <div className="confirmation-modal">
      <div className="confirmation-content">
        <div className="confirmation-header">
          <h2>Confirmación</h2>
        </div>
        <p>{mensaje}</p>
        <div className="confirmation-buttons">
          <button className="btn-cancel" onClick={cancelar}>
            Cancelar
          </button>
          <button className="btn-confirm" onClick={confirmar}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};
