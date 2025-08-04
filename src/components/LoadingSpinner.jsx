import "./LoadingSpinner.css";

export const LoadingSpinner = () => {
  return (
    <div className="loading-overlay">
      <div className="spinner-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    </div>
  );
};