import { FormularioVenta } from "../components/FormularioVentas";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef } from "react";

function Home() {
  const { isAuthenticated } = useAuth();
  const timeoutRef = useRef(null);
  useEffect(() => {
    if (!isAuthenticated) {
      timeoutRef.current = setTimeout(() => {
        window.location.href = "/Mi-Cuenta/";
      }, 3000);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAuthenticated]);

  return (
    <>
      {!isAuthenticated && (
        <div className="loading-screen">
          <div className="spinner-home"></div>
          <div>
            <h2>Debes iniciar sesión.</h2>
            <h2>Redirigiendo...</h2>
          </div>
        </div>
      )}
      <div className="content" style={{ paddingTop: "90px" }}>
        <FormularioVenta />
      </div>
    </>
  );
}

export default Home;
