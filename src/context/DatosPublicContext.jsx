import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useLocation } from "react-router-dom";
import API from "../Apis/API";

const DatosPublicContext = createContext();

export const useDatosPublic = () => useContext(DatosPublicContext);

export const ProductosProvider = ({ children }) => {
  const [productos, setProductos] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [barrios, setBarrios] = useState([]);
  const [envio, setEnvio] = useState([]);
  const [descuentos, setDescuentos] = useState([]);
  const [talles, setTalles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [estadosDeVenta, setEstadosDeVenta] = useState([]);
  const [contenidosWeb, setContenidosWeb] = useState([]);
  const [informacionWeb, setInformacionWeb] = useState([]);
  const [puntosDeUsuario, setPuntosDeUsuarios] = useState([]);
  const [comprasDeUsuario, setComprasDeUsuario] = useState([]);
  const [comentariosDeUsuario, setComentariosDeusuario] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const fetchData = async (endpoint, setData) => {
    try {
      const res = await API.get(endpoint);
      setData(res.data);
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error.message);
      setData([]);
    }
  };

  const actualizarProductos = async () => {
    await fetchData("productos/", setProductos);
  };

  const actualizarCategorias = async () => {
    await fetchData("categorias/", setCategorias);
  };

  const actualizarComentarios = async () => {
    await fetchData("reviews/", setReviews);
  };

  const actualizarPuntosDeUsuario = async () => {
    if (user) {
      await fetchData(
        `perfilesUsuarios/puntos/${user?.username}`,
        setPuntosDeUsuarios
      );
    }
  };

  const actualizarComprasDeUsuario = async () => {
    await fetchData("ventas/mis-compras/", setComprasDeUsuario);
  };

  const actualizarComentariosDeUsuario = async () => {
    await fetchData("reviews/mis-comentarios/", setComentariosDeusuario);
  };

  const recargarDatos = async () => {
    setCargando(true);
    if (isAuthenticated) {
      await Promise.all([
        actualizarPuntosDeUsuario(),
        actualizarComprasDeUsuario(),
        actualizarComentariosDeUsuario(),
        actualizarProductos(),
        actualizarCategorias(),
        fetchData("vendedores/", setVendedores),
        fetchData("envio/", setEnvio),
        fetchData("barrios/", setBarrios),
        fetchData("descuentos/", setDescuentos),
        fetchData("talles/", setTalles),
        actualizarComentarios(),
        fetchData("contenidosWeb/", setContenidosWeb),
        fetchData("estados/", setEstadosDeVenta),
        fetchData("informacionWeb/", setInformacionWeb),
      ]);
      setCargando(false);
    }
  };

  useEffect(() => {
    if (cargando) {
      recargarDatos();
    }
  }, [location.pathname, user?.username]);

  return (
    <DatosPublicContext.Provider
      value={{
        productos,
        cargando,
        envio,
        categorias,
        vendedores,
        barrios,
        descuentos,
        talles,
        reviews,
        contenidosWeb,
        informacionWeb,
        puntosDeUsuario,
        comprasDeUsuario,
        comentariosDeUsuario,
        estadosDeVenta,
        actualizarProductos,
        actualizarCategorias,
        actualizarComentarios,
        actualizarPuntosDeUsuario,
        actualizarComprasDeUsuario,
        actualizarComentariosDeUsuario,
        recargarDatos,
      }}
    >
      {children}
    </DatosPublicContext.Provider>
  );
};
