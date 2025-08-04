import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import API from "../Apis/API";
import { useAuth } from "./AuthContext";

const DatosAdminContext = createContext();

export const useDatosAdmin = () => useContext(DatosAdminContext);

export const DatosAdminProvider = ({ children }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [perfilesUsuarios, setPerfilesUsuarios] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [colores, setColores] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [misVentas, setMisVentas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [miPerfil, setMiPerfil] = useState([]);
  const [ventasXVendedor, setVentasXVendedor] = useState([]);
  const [fuentes, setFuentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const fetchData = async (endpoint, setData) => {
    try {
      const res = await API.get(endpoint);
      setData(res.data);
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error.message);
      setData([]);
    }
  };
  const actualizarVentas = async () => {
    await fetchData("/ventas", setVentas);
  };
  const actualizarRoles = async () => {
    await fetchData("/roles", setRoles);
  };
  const actualizarUsuarios = async () => {
    await fetchData("/usuarios", setUsuarios);
  };
  const actualizarPerfilesUsuarios = async () => {
    await fetchData("/perfilesUsuarios", setPerfilesUsuarios);
  };

  const actualizarCupones = async () => {
    await fetchData("/cupones", setCupones);
  };
  const actualizarFuentes = async () => {
    await fetchData("/fuentes/", setFuentes);
  };
  const actualizarColores = async () => {
    await fetchData("/colores/", setColores);
  };

  const recargarDatosAdmin = async () => {
    setCargando(true);
    if (isAuthenticated) {
      await Promise.all([
        actualizarColores(),
        actualizarCupones(),
        actualizarUsuarios(),
        actualizarPerfilesUsuarios(),
        actualizarVentas(),
        actualizarRoles(), actualizarFuentes(),
        fetchData(`ventas/mis-ventas/`, setMisVentas),
        fetchData(`ventas/ventas-por-vendedor/`, setVentasXVendedor),
        fetchData(`vendedores/mi-perfil/`, setMiPerfil),
      ]);
      setCargando(false);
    }
  };

  useEffect(() => {
    if (cargando) {
      recargarDatosAdmin();
    }
  }, [location.pathname]);

  return (
    <DatosAdminContext.Provider
      value={{
        cargando, colores,
        usuarios, fuentes,
        perfilesUsuarios,
        ventas, roles,
        cupones,
        misVentas,
        miPerfil,
        ventasXVendedor, fuentes,
        recargarDatosAdmin,
      }}
    >
      {children}
    </DatosAdminContext.Provider>
  );
};
