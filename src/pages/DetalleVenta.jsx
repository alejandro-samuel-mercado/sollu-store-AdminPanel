import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useDatosAdmin } from "../context/DatosAdminContext";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useDatosPublic } from "../context/DatosPublicContext";
import { useActions } from "../context/ActionsContext";

const DetalleVenta = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [venta, setVenta] = useState(null);
    const { barrios, envio, vendedores, estadosDeVenta } = useDatosPublic();
    const { ventas, perfilesUsuarios } = useDatosAdmin();
    const { handleEstadoChange } = useActions()

    useEffect(() => {
        if (!ventas) {
            setLoading(true);
            return;
        }
        const ventaEncontrada = ventas?.find((p) => p.id === parseInt(id));
        if (ventaEncontrada) {
            setVenta(ventaEncontrada);
            setLoading(false);
        } else {
            setError("No se encontró la venta");
            setLoading(false);
        }
    }, [ventas, id]);

    const obtenerSegunId = (id, valor) => {
        if ((!id && id !== 0) || (!barrios && !envio)) return "No especificado";
        if (valor === "barrio" && barrios) {
            const encontrado = barrios.find((barrio) => barrio.id === id);
            return encontrado?.nombre || "No especificado";
        } else if (valor === "envio" && envio) {
            const encontrado = envio.find((env) => env.id === id);
            return encontrado?.nombre || "No especificado";
        }
        return "No especificado";
    };

    if (loading) {
        return (
            <div className=" ver-ventas-container">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="ver-ventas-container text-center" style={{ color: "#ff4d4d" }}>
                {error}
            </div>
        );
    }

    if (!venta) {
        return (
            <div className="ver-ventas-container text-center" style={{ color: "var(--terciario)" }}>
                No se encontró la venta
            </div>
        );
    }

    const comprador = perfilesUsuarios?.find((v) => v.usuario === venta.comprador);
    const vendedor = vendedores?.find((v) => v.id === venta.vendedor);

    return (
        <div className=" detalles-ventas-container">
            <Link to="/ventas" className="toggle-button-back mb-4">
                <FaArrowLeft /> Volver a Ventas
            </Link>
            <div
                className={`venta-card `}
            >
                <div className="venta-header">
                    <h3>Detalles de la Venta #{venta.id}</h3>
                </div>
                <div className="venta-details">

                    <div className="venta-main" style={{ justifyItems: "center" }}>
                        {/* Información General */}
                        <div className="main-details" style={{ justifyItems: "center" }}>
                            <h4 style={{ color: "var(--primario1)", marginBottom: "15px" }}>Información General</h4>
                            <p><strong>Comprador:</strong> {comprador?.nombre_apellido || venta.comprador_sin_cuenta || "Desconocido"}</p>
                            <p><strong>Vendedor:</strong> {vendedor?.nombre || "Desconocido"}</p>
                            <p><strong>Estado:</strong> {venta.estado_detail?.estado || "N/A"}</p>
                            <p><strong>Fecha de Venta:</strong> {new Date(venta.fecha_venta).toLocaleDateString()}</p>
                            <p><strong>Fecha de Entrega:</strong> {venta.fecha_entrega || "Pendiente"}</p>
                            <p><strong>Tipo de Envío:</strong> {obtenerSegunId(venta.tipo_envio, "envio")}</p>
                        </div>

                        {/* Detalles de Entrega */}
                        <div className="main-details mt-4" style={{ justifyItems: "center !important" }}>
                            <h4 style={{ color: "var(--primario1)", marginBottom: "15px" }}>Detalles de Entrega</h4>
                            <p><strong>Domicilio:</strong> {venta.domicilio || "No especificado"}</p>
                            <p><strong>Barrio:</strong> {obtenerSegunId(venta.barrio, "barrio")}</p>
                            <p><strong>Horario de Entrega:</strong> {venta.horario_entrega || "No especificado"}</p>
                        </div>
                    </div>

                    {/* Productos */}
                    <div className="main-details mt-4">
                        <h4 style={{ color: "var(--primario1)", marginBottom: "15px" }}>Productos</h4>
                        <div className="table-responsive">
                            <table className="table">
                                <thead style={{ background: "var(--primario1)", color: "#fff" }}>
                                    <tr>
                                        <th>#</th>
                                        <th>Producto</th>
                                        <th>Talle</th>
                                        <th>Cantidad</th>
                                        <th>Precio Unitario</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody style={{ background: "var(--fondo2)", color: "var(--terciario)" }}>
                                    {venta.detalles.map((detalle, index) => (
                                        <tr key={detalle.id || index}>
                                            <td>{index + 1}</td>
                                            <td>{detalle.producto_final?.producto?.nombre || "N/A"}</td>
                                            <td>{detalle.producto_final?.talle || "N/A"}</td>
                                            <td>{detalle.cantidad}</td>
                                            <td>${parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                                            <td>${parseFloat(detalle.subtotal).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totales */}
                    <div style={{ display: "flex" }}>
                        <div className="main-details mt-4" style={{ justifyItems: "center" }}>
                            <h4 style={{ color: "var(--primario1)", marginBottom: "15px" }}>Totales</h4>
                            <p><strong>Precio Total:</strong> ${parseFloat(venta.precio_total).toFixed(2)}</p>
                            <p><strong>Puntos Acumulados:</strong> {venta.puntos_club_acumulados || 0}</p>
                        </div>

                        <div className="main-details mt-4" style={{ justifyItems: "center" }}>
                            <h4 style={{ color: "var(--primario1)", marginBottom: "15px" }}>Estado</h4>
                            <select
                                value={typeof venta.estado === "object" ? venta.estado?.id : venta.estado || ""}
                                onChange={(e) => handleEstadoChange(venta.id, parseInt(e.target.value))}
                                className="estado-select"
                            >
                                {estadosDeVenta?.map((estado) => (
                                    <option key={estado.id} value={estado.id}>
                                        {estado.estado}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Comprobante */}
                    <div className="main-details mt-4">
                        <h4 style={{ color: "var(--primario1)", marginBottom: "15px" }}>Comprobante</h4>
                        <p>
                            {venta.comprobante_pdf ? (
                                <a
                                    href={venta.comprobante_pdf}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="toggle-button"
                                >
                                    Ver/Descargar PDF
                                </a>
                            ) : (
                                "No disponible"
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default DetalleVenta;