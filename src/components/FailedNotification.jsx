import "./FailedNotification.css";

export const FailedNotification = ({ message, onClose }) => {
  return (
    <div className="success-notification-failed">
      <div className="success-content-failed">
        <div className="success-icon">x</div>
        <h3>¡Error!</h3>
        <p>{message}</p>
        <button className="btn-close-notification" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};
