import React, { useState, useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LateralBar } from "./LateralBar";

export const Navbar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const [navBarFloat, setNavBarFloat] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [prevScrollY, setPrevScrollY] = useState(0);
  const { isAuthenticated } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 100) {
        setNavBarFloat(true);
      } else {
        setNavBarFloat(false);
      }
      if (currentScrollY > prevScrollY && currentScrollY > 200) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
      setPrevScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (loadingTimeout) clearTimeout(loadingTimeout); // Limpiar el timeout al desmontar
    };
  }, [prevScrollY]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []); return (
    <>
      <nav
        className={`navbar navbar-expand-lg navbar-light px-4 ${navBarFloat ? "floating" : ""} ${isHidden ? "hidden" : ""
          }`}
      >
        <Link className="navbar-brand" to="/">
          {<img src={'/static/logo.png'} alt="Logo" className="navbar-logo" />}
        </Link>

        <div className="navbar-content">
          <div className="d-flex align-items-center items-right">
            {location.pathname !== "/" && (
              <Link className="nav-link" to="/">
                Ventas
              </Link>
            )}
            {!location.pathname.includes("/Mi-cuenta") && (
              <Link className="nav-link" to="/Mi-cuenta">
                {isAuthenticated ? "Mi Cuenta" : "Login"}
              </Link>
            )}
            {location.pathname.includes("/admin-panel/gestionar/") ? (
              <button className="menu-btn" onClick={toggleSidebar}>
                ☰  <p>Administrar</p>
              </button>
            ) : (
              <Link className="nav-link" to="/admin-panel/gestionar/">
                Panel Admin
              </Link>
            )}
          </div>
        </div>
      </nav>
      <LateralBar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
};
