import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDatosPublic } from "../context/DatosPublicContext";
import { useDatosAdmin } from "../context/DatosAdminContext";

export const LateralBar = ({ isSidebarOpen, toggleSidebar }) => {
  const sidebarRef = useRef(null);
  const { vendedores } = useDatosPublic();
  const { roles } = useDatosAdmin();
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isModerador, setIsModerador] = useState(false);
  const [isGestor, setIsGestor] = useState(false);

  const obtenerRol = (id) => {
    if (!roles || !Array.isArray(roles) || !id) {
      console.error("Roles no definidos o ID inválido:", { roles, id });
      return "Sin rol";
    }
    const rol = roles.find((r) => r.id === parseInt(id));
    return rol ? rol.nombre : "Sin rol";
  };

  useEffect(() => {
    if (!user || !user.id) {
      return;
    }
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return;
    }

    const vendedor = vendedores?.find((v) => v.usuario === user?.id);
    const rol = obtenerRol(vendedor?.rol)
    setIsSuperAdmin(rol === "Propietario");
    setIsModerador(rol === "Moderador");
    setIsGestor(rol === "Gestor");

  }, [user, roles, location]);

  useEffect(() => {
    if (isSidebarOpen) {
      toggleSidebar();
    }
  }, [location.pathname]);

  const handleClickOutside = useCallback((event) => {
    if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      toggleSidebar();
    }
  }, [isSidebarOpen, toggleSidebar]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen, toggleSidebar]);

  return (
    <div ref={sidebarRef} className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
      <button className="close-btn" onClick={toggleSidebar}>
        <span className="close-icon">✖</span>
      </button>
      <div className="sidebar-header">
        <h2>Panel de Administración</h2>
      </div>
      <div className="sidebar-content">
        <div className="filter-section">
          <h3 className="filter-title">Gestión Principal</h3>
          <ul className="filter-group">
            <li className="reset-btn">
              <Link to="/admin-panel/gestionar/">Dashboard</Link>
            </li>
            <li>
              <Link to="/admin-panel/gestionar/vendedores/">Administradores</Link>
            </li>
            <li>
              <Link to="/admin-panel/gestionar/usuarios/">
                Usuarios/Clientes
              </Link>
            </li>
          </ul>
        </div>
        <div className="filter-section">
          <h3 className="filter-title">Productos & Categorías</h3>
          <ul className="filter-group">
            <li>
              <Link to="/admin-panel/gestionar/productos/">
                Administrar Productos
              </Link>
            </li>
            <li>
              <Link to="/admin-panel/gestionar/categorias/">
                Administrar Categorías
              </Link>
            </li>
            <li>
              <Link to="/admin-panel/gestionar/talles/">
                Administrar Talles
              </Link>
            </li>
            <li>
              <Link to="/admin-panel/gestionar/barrios/">
                Administrar Barrios
              </Link>
            </li>
          </ul>
        </div>
        <div className="filter-section">
          <h3 className="filter-title">Promociones</h3>
          <ul className="filter-group">
            <li>
              <Link to="/admin-panel/gestionar/cupones/">
                Administrar Cupones
              </Link>
            </li>
            <li>
              <Link to="/admin-panel/gestionar/descuentos/">
                Administrar Descuentos
              </Link>
            </li>
          </ul>
        </div>

        {!isGestor &&
          <div className="filter-section">
            <h3 className="filter-title">Otras Configuraciones</h3>
            <ul className="filter-group">
              <li>
                <Link to="/admin-panel/gestionar/reviews/">
                  Administrar Comentarios
                </Link>
              </li>
              <li>
                <Link to="/admin-panel/gestionar/contenidosWeb/">
                  Administrar Contenidos
                </Link>
              </li>
              <li>
                <Link to="/admin-panel/gestionar/informacionWeb/">
                  Administrar Información
                </Link>
              </li>
              {isSuperAdmin && <li>
                <Link to="/admin-panel/gestionar/temas/">
                  Configuraciones del sistema
                </Link>
              </li>}
            </ul>
          </div>}
      </div>
    </div>
  );
};
