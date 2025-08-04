import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDatosPublic } from "../context/DatosPublicContext";
import { useState } from "react";
import { useEffect } from "react";
import { useDatosAdmin } from "../context/DatosAdminContext";

export const Cuenta = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { misVentas, perfilesUsuarios, miPerfil, cargando } = useDatosAdmin();
  const { productos } = useDatosPublic();
  const [avatar, setAvatar] = useState();
  const compras = misVentas?.sort(
    (a, b) => new Date(b.fecha_venta) - new Date(a.fecha_venta)
  );
  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const comprasPerPage = 5;
  const totalPages = Math.ceil(compras?.length / comprasPerPage) || 1;

  // Calcular las compras a mostrar en la página actual
  const indexOfLastCompra = currentPage * comprasPerPage;
  const indexOfFirstCompra = indexOfLastCompra - comprasPerPage;
  const currentVentas = compras?.slice(indexOfFirstCompra, indexOfLastCompra);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const obetenerComprador = (comprador) => {
    const compradorEncontrado =
      perfilesUsuarios?.find((c) => c.usuario === comprador) || "";
    return compradorEncontrado.nombre_apellido;
  };

  const avataresLista = [
    "pixel-art-neutral",
    "thumbs",
    "initials",
    "identicon",
    "fun-emoji",
    "bottts-neutral",
    "bottts",
    "big-ears-neutral",
    "avataaars-neutral",
    "adventurer-neutral",
    "adventurer",
  ];
  useEffect(() => {
    const obtenerAvatarRandom = (indice) => {
      return avataresLista[indice];
    };
    const indice = Math.floor(Math.random() * avataresLista.length);
    setAvatar(obtenerAvatarRandom(indice));
  }, []);

  // Funciones para manejar la paginación
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <>
      {cargando ? (
        <div className="text-center mb-3">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
        </div>
      ) : (
        <div
          className={`container-fluid mi-cuenta-container ${
            cargando ? "hidden" : "content"
          }`}
        >
          <div className="row">
            <div className="col-md-3 left p-5 bg-light">
              <div className="text-center">
                <img
                  src={`https://api.dicebear.com/9.x/${avatar}/svg`}
                  alt="Avatar"
                  className="img-fluid rounded-circle mb-3"
                  style={{ width: "150px", height: "150px" }}
                />
                <h5>{user?.username}</h5>
              </div>
              <button
                className="btn btn-danger w-100 mt-3 btn-close-session"
                onClick={handleLogout}
              >
                {" "}
                Cerrar Sesión
              </button>
            </div>

            {/* Columna Derecha*/}
            <div className="col-md-9 right p-4">
              <h2 className="mb-4">Mis Datos</h2>
              <div className="card mb-3">
                <div className="card-body">
                  <h5 className="card-title">{miPerfil[0]?.nombre}</h5>
                  <h6 className="card-title">DNI: {miPerfil[0]?.dni}</h6>
                  <h6 className="card-title">
                    Teléfono: {miPerfil[0]?.telefono}
                  </h6>
                  <h6 className="card-title">
                    Domicilio: {miPerfil[0]?.domicilio}
                  </h6>
                </div>
              </div>
              <h2 className="mb-4">Historial de Ventas</h2>
              {misVentas?.length > 0 ? (
                <>
                  {currentVentas?.map((venta) => (
                    <div key={venta.id} className="card mb-3">
                      <div className="card-body">
                        <h5 className="card-title">
                          Compra del{" "}
                          {new Date(venta.fecha_venta).toLocaleDateString()}
                        </h5>
                        <p className="card-text">
                          <strong>Comprador:</strong>
                          {obetenerComprador(venta.comprador)}
                        </p>
                        <p className="card-text">
                          <strong>Total:</strong> ${venta?.precio_total}
                        </p>
                        <ul className="list-group list-group-flush">
                          {venta.detalles?.map((detalle) => {
                            const producto = productos?.find(
                              (producto) => producto.id === detalle.producto
                            );
                            return (
                              <li key={detalle.id} className="list-group-item">
                                {producto?.nombre} - {detalle.cantidad} x $
                                {detalle.precio_unitario}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  ))}
                  {/* Controles de paginación */}
                  <div className="pagination-controls">
                    <button
                      className="btn btn-secondary"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </button>
                    <span className="pagination-info">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      className="btn btn-secondary"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </button>
                  </div>
                </>
              ) : (
                <p>No tienes compras recientes.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
