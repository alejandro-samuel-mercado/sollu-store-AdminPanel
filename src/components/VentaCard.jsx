import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export const VentaCard = ({
  venta,
  estados,
  handleEstadoVentaChange,
  obtenerUsuario,
  obtenerSegunId,
}) => {

  const comprador = obtenerUsuario(venta.comprador, "compradores");
  const vendedor = obtenerUsuario(venta.vendedor, "vendedores");

  return (
    <motion.div
      className={`venta-card ${obtenerSegunId(venta.estado, "estados") === "Vendido-Local" ? "vendido-local" : ""} ${obtenerSegunId(venta.estado, "estados") === "Vendido-Domicilio" ? "vendido-domicilio" : ""
        } ${obtenerSegunId(venta.estado, "estados") === "Cancelada" ? "cancelada" : ""}`}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      <div className="venta-header">
        <h3>Venta #{venta.id}</h3>
        <select
          value={typeof venta.estado === "object" ? venta.estado?.id : venta.estado || ""}
          onChange={(e) => handleEstadoVentaChange(venta.id, parseInt(e.target.value))}
          className="estado-select"
        >
          {estados.map((estado) => (
            <option key={estado.id} value={estado.id}>
              {estado.estado}
            </option>
          ))}
        </select>
      </div>
      <div className="venta-details">
        <div className="main-details">
          <p>
            <strong>Comprador:</strong>{" "}
            {comprador?.nombre_apellido || venta.comprador_sin_cuenta || "Desconocido"}
          </p>
          <p>
            <strong>Vendedor:</strong> {vendedor?.nombre || "Desconocido"}
          </p>
          <p>
            <strong>Fecha de Venta:</strong> {new Date(venta.fecha_venta).toLocaleDateString()}
          </p>
          <p>
            <strong>Fecha de Entrega:</strong> {venta.fecha_entrega || "Pendiente"}
          </p>
          <p>
            <strong>Tipo de Envío:</strong> {obtenerSegunId(venta.tipo_envio, "envio")}
          </p>
          <p>
            <strong>Estado:</strong> {obtenerSegunId(venta.estado, "estados")}
          </p>
        </div>
        <div className="toggle-details">
          <Link to={`/detalle-venta/${venta.id}`} className="toggle-button btn btn-primary">
            Ver Venta
          </Link>
        </div>
      </div>
    </motion.div>
  );
};