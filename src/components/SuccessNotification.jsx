import "./SuccessNotification.css";

export const SuccessNotification = ({ message, onClose }) => {
  return (
    <div className="success-notification">
      <div className="success-content">
        <div className="success-icon">✓</div>
        <h3>¡Éxito!</h3>
        <p>{message}</p>
        <button className="btn-close-notification" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};
