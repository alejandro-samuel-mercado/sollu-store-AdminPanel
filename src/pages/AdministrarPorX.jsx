import React, { useEffect, useState, useCallback, useRef } from "react";
import { EditCreateData } from "../components/EditCreateData";
import API from "../Apis/API";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { VentanaConfirmacion } from "../components/VentanaConfirmacion";
import { useDatosPublicComponetes } from "../context/ControladorComponentes";
import { useDatosPublic } from "../context/DatosPublicContext";
import { useActions } from "../context/ActionsContext";
import { useDatosAdmin } from "../context/DatosAdminContext";
import Switch from "@mui/material/Switch";
import { FailedNotification } from "../components/FailedNotification";
import { SuccessNotification } from "../components/SuccessNotification";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";

const label = { inputProps: { "aria-label": "Switch demo" } };

export const AdministrarPorX = () => {
  const { param } = useParams();
  const navigate = useNavigate();
  const [datos, setDatos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const { fuentesAplicar } = useAppData()
  console.log(fuentesAplicar)
  const {
    componentes,
    updateComponentes, diseños, diseñoActivo, activarDiseño,
    temas, fuentes,
    eliminarTema,
    temaActivo,
    activarTema,
    puntosClub,
    toggleActivoPuntosClub,
  } = useDatosPublicComponetes();
  const { deleteItem } = useActions();
  const {
    cargando,
    productos,
    reviews,
    categorias,
    descuentos,
    vendedores,
    contenidosWeb,
    informacionWeb,
    barrios,
    recargarDatos,
    talles,
  } = useDatosPublic();

  const {
    usuarios,
    cupones, colores,
    roles,
    recargarDatosAdmin,
    perfilesUsuarios,
    cargandoAdmin,
  } = useDatosAdmin();

  const { user, updateUserRole } = useAuth();
  const componentesTitle = [
    "tendencia",
    "categoria",
    "anuncios",
    "reseñas",
    "carrito_animado",
  ];
  const [failedSuccess, setFailedSuccess] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [open, setOpen] = useState(false);
  const [editable, setEditable] = useState(false);
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null);
  const [updateData, setUpdateData] = useState(false);
  const [openVentana, setOpenVentana] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState(null);
  const [valorInput, setValorInput] = useState("");
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const paramsInc = ["productos", "vendedores", "barrios", "usuarios", "talles"];
  const [openTallesModal, setOpenTallesModal] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isModerador, setIsModerador] = useState(false);
  const [isGestor, setIsGestor] = useState(false);
  const [error, setError] = useState(null);
  const prevRolesRef = useRef();

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

    if (prevRolesRef.current && JSON.stringify(prevRolesRef.current) !== JSON.stringify(roles)) {
      setIsSuperAdmin(false);
      setIsModerador(false);
      setIsGestor(false);
    }
    prevRolesRef.current = roles;
    const vendedor = vendedores?.find((v) => v.usuario === user.id);
    const rol = obtenerRol(vendedor?.rol);
    if (rol === "Sin rol") {
      console.error("No se encontró un rol para el usuario:", user.id);
      setError("No se encontró un rol válido para el usuario. Contacta al administrador.");
      setIsLoading(false);
      return;
    }
    setIsSuperAdmin(rol === "Propietario");
    setIsModerador(rol === "Moderador");
    setIsGestor(rol === "Gestor");

    const viewPermissions = {
      Propietario: [
        "productos",
        "vendedores",
        "reviews",
        "temas",
        "categorias",
        "cupones",
        "descuentos",
        "usuarios",
        "contenidosWeb",
        "informacionWeb",
        "barrios",
        "talles",
      ],
      Moderador: [
        "productos",
        "vendedores",
        "reviews",
        "categorias",
        "cupones",
        "descuentos",
        "usuarios",
        "barrios",
        "talles",
        "contenidosWeb",
        "informacionWeb",
      ],
      Gestor: [
        "productos",
        "vendedores",
        "categorias",
        "talles",
        "cupones",
        "descuentos",
        "barrios",
        "usuarios",
      ],
    };

    if (!viewPermissions[rol]?.includes(param)) {
      console.warn(`Acceso de visualización denegado a ${param} para el rol ${rol}`);
      navigate("/acceso-denegado");
    }
    setIsLoading(false);
  }, [user, roles, param, navigate]);

  useEffect(() => {
    if (isLoading) return;
    const datosSeleccionados = {
      productos,
      vendedores,
      reviews,
      temas,
      categorias,
      cupones,
      descuentos,
      usuarios,
      contenidosWeb,
      informacionWeb,
      barrios,
      talles,
    }[param];

    if (datosSeleccionados !== undefined) {
      setDatos(datosSeleccionados || []);
    } else {
      console.error(`No se encontraron datos para el parámetro: ${param}`);
      setDatos([]);
    }
  }, [param, isLoading, productos, vendedores, reviews, temas, categorias, cupones, descuentos, usuarios, barrios, talles, contenidosWeb, informacionWeb, location]);

  const abrirVentanaConfirmacion = (id) => {
    if (isLoading) return;
    setIdAEliminar(id);
    setOpenVentana(true);
  };

  const confirmarEliminacion = useCallback(async () => {
    if (isLoading || !idAEliminar) return;
    setIsLoadingAction(true);
    try {
      if (param === "temas" && isSuperAdmin) {
        eliminarTema(idAEliminar);
      } else if (
        (isSuperAdmin && [
          "productos",
          "vendedores",
          "reviews",
          "categorias",
          "cupones",
          "descuentos",
          "usuarios",
          "contenidosWeb",
          "informacionWeb",
          "barrios",
          "talles",
        ].includes(param)) ||
        (isModerador && ["reviews", "contenidosWeb", "usuarios", "informacionWeb"].includes(param)) ||
        (isGestor && ["productos", "categorias", "talles", "cupones", "descuentos", "barrios"].includes(param))
      ) {
        const result = await deleteItem(param, idAEliminar);
        recargarDatos();
        recargarDatosAdmin();
      }
      setShowSuccess(true);
    } catch (error) {
      console.error("Error en confirmarEliminacion:", error);
      setFailedSuccess(true);
    } finally {
      setIsLoadingAction(false);
      setOpenVentana(false);
      setIdAEliminar(null);
    }
  }, [idAEliminar, param, deleteItem, eliminarTema, recargarDatos, recargarDatosAdmin, isSuperAdmin, isModerador, isGestor, isLoading]);

  const addDato = () => {
    if (isLoading) return;
    const editCreatePermissions = {
      Propietario: [
        "productos",
        "vendedores",
        "reviews",
        "temas",
        "categorias",
        "cupones",
        "descuentos",
        "usuarios",
        "contenidosWeb",
        "informacionWeb",
        "barrios",
        "talles",
      ],
      Moderador: ["reviews", "contenidosWeb", "usuarios", "informacionWeb"],
      Gestor: ["productos", "categorias", "talles", "cupones", "descuentos", "barrios"],
    };

    const role = isSuperAdmin ? "Propietario" : isModerador ? "Moderador" : isGestor ? "Gestor" : "Sin rol";
    if (editCreatePermissions[role].includes(param)) {
      setElementoSeleccionado(null);
      setEditable(false);
      setOpen(true);
    } else {
      console.warn(`No tiene permiso para crear en ${param}`);
    }
  };

  const editarDato = (dato) => {
    if (isLoading) return;
    const isOwnVendorOrAdmin =
      param === "vendedores" &&
      obtenerDatosUsuario(dato.usuario, "usuarios").id === user.id;
    const editCreatePermissions = {
      Propietario: [
        "productos",
        "vendedores",
        "reviews",
        "temas",
        "categorias",
        "cupones",
        "descuentos",
        "usuarios",
        "contenidosWeb",
        "informacionWeb",
        "barrios",
        "talles",
      ],
      Moderador: ["reviews", "contenidosWeb", "usuarios", "informacionWeb"],
      Gestor: ["productos", "categorias", "talles", "cupones", "descuentos", "barrios"],
    };

    const role = isSuperAdmin ? "Propietario" : isModerador ? "Moderador" : isGestor ? "Gestor" : "Sin rol";
    if (
      editCreatePermissions[role].includes(param) ||
      (isModerador && param === "vendedores" && isOwnVendorOrAdmin) ||
      (isGestor && param === "vendedores" && isOwnVendorOrAdmin)
    ) {
      setEditable(true);
      setElementoSeleccionado(dato);
      setOpen(true);
    } else {
      console.warn(`No tiene permiso para editar en ${param}`);
    }
  };

  const cerrarModal = useCallback(
    (shouldReload) => {
      if (isLoading) return;
      setOpen(false);
      setElementoSeleccionado(null);
      if (shouldReload === true) {
        setIsLoadingAction(true);
        recargarDatos();
        recargarDatosAdmin();
        setIsLoadingAction(false);
      }
    },
    [recargarDatos, recargarDatosAdmin, isLoading]
  );

  const handleApproved = useCallback(
    async (reviewId, action) => {
      if (isLoading || !(isModerador || isSuperAdmin)) return;
      setIsLoadingAction(true);
      try {
        await API.patch(`/reviews/${reviewId}/`, { action });
        setUpdateData((prev) => !prev);
        setDatos((prev) =>
          prev.map((review) =>
            review.id === reviewId ? { ...review, approved: action === "approve" } : review
          )
        );
        setShowSuccess(true);
        recargarDatos();
      } catch (error) {
        console.error(
          `Error ${action === "approve" ? "approving" : "rejecting"} review:`,
          error
        );
        setFailedSuccess(true);
      } finally {
        setIsLoadingAction(false);
      }
    },
    [recargarDatos, isModerador, isSuperAdmin, isLoading]
  );

  const mostrarTalles = (producto) => {
    if (isLoading || !(isGestor || isSuperAdmin)) return;
    setSelectedProducto(producto);
    setOpenTallesModal(true);
  };

  const datosOrdenados =
    param === "reviews"
      ? [...datos].sort((a, b) => a.approved - b.approved)
      : datos;

  const datosFiltrados = paramsInc.some((par) => param.includes(par))
    ? datosOrdenados.filter((dato) => {
      const input = valorInput.toLowerCase();
      if (!dato) return false;
      if (param === "vendedores") {
        const usuario = usuarios?.find((u) => u.id === dato.usuario) || {};
        return (
          (dato.nombre?.toLowerCase() || "").includes(input) ||
          (dato.dni?.toString() || "").includes(input) ||
          (usuario.username?.toLowerCase() || "").includes(input) ||
          (usuario.email?.toLowerCase() || "").includes(input)
        );
      } else if (param === "usuarios") {
        const perfil =
          perfilesUsuarios?.find((p) => p.usuario === dato.id) || {};
        return (
          (perfil.nombre_apellido?.toLowerCase() || "").includes(input) ||
          (perfil.dni?.toString() || "").includes(input) ||
          (dato.username?.toLowerCase() || "").includes(input) ||
          (dato.email?.toLowerCase() || "").includes(input)
        );
      } else if (param === "productos") {
        return (
          (dato.nombre?.toLowerCase() || "").includes(input) ||
          (dato.id?.toString() || "").includes(input)
        );
      } else {
        return (dato.nombre?.toLowerCase() || "").includes(input);
      }
    })
    : datosOrdenados;

  const obtenerCategoria = (categoria) => {
    if (isLoading || !categorias || !categoria) return "Sin categoría";
    const categoriaEncontrada = categorias?.find(
      (cat) => cat.id === parseInt(categoria.categoria)
    );
    return categoriaEncontrada?.nombre || "Sin categoría";
  };

  const obtenerPuntosPorUsuario = (usuario) => {
    if (isLoading || !Array.isArray(perfilesUsuarios) || !usuario?.id) return 0;
    const usuarioEncontrado = perfilesUsuarios?.find(
      (user) => user.usuario === usuario.id
    );
    return usuarioEncontrado?.puntos_acumulados || 0;
  };

  const obtenerDatosUsuario = (usuario, tipo) => {
    if (isLoading) return {};
    const user =
      tipo === "usuarios"
        ? usuarios?.find((us) => us.id === parseInt(usuario)) || {}
        : perfilesUsuarios?.find((perfil) => perfil.usuario === parseInt(usuario)) || {};
    return user;
  };

  const obtenerBarrio = (id) => {
    if (isLoading || !barrios) return "Sin barrio";
    const barrio = barrios?.find((barr) => barr.id === parseInt(id));
    return barrio ? barrio.nombre : "Sin barrio";
  };


  const obtenerFuente = (id) => {
    const fuente = fuentesAplicar?.find((f) => f.id === id)
    return fuente
  }

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="admin-container">
      {(cargando || cargandoAdmin || isLoadingAction) && <LoadingSpinner />}
      {failedSuccess && (
        <FailedNotification
          message="Error al eliminar el item."
          onClose={() => setFailedSuccess(false)}
        />
      )}
      {showSuccess && (
        <SuccessNotification
          message="Acción realizada con éxito."
          onClose={() => setShowSuccess(false)}
        />
      )}
      <h1 className="admin-title">
        {param === "vendedores"
          ? "Administradores"
          : param === "temas"
            ? "Configuración del sistema"
            : `Administración de ${param === "reviews" ? "Comentarios" : param}`}
      </h1>
      <div className="admin-header">
        {paramsInc.some((par) => par === param) && (
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar..."
              value={valorInput}
              onChange={(e) => setValorInput(e.target.value)}
            />
            <i className="bi bi-search search-btn" />
          </div>
        )}
        {param !== "reviews" && param !== "temas" && (
          <button className="add-btn" onClick={addDato}>
            Añadir Nuevo
          </button>
        )}
      </div>
      {param === "temas" && isSuperAdmin ? (
        <div className="config-sections">
          {/* Sección: Configuración General */}
          <div className="config-section">
            <h3 className="section-title">
              <i className="bi bi-gear section-icon"></i> Configuración General
            </h3>
            <div className="config-item">
              <span>Puntos Club</span>
              <p>Los usuarios/compradores tendrán la posibilidad de obtener puntos por cada compra, los cuales podrán ser "canjeados" por productos marcados como canjeables. </p>
              <Switch
                checked={puntosClub?.activo}
                onChange={(e) => toggleActivoPuntosClub(e.target.checked)}
              />
            </div>
            <div key="componente_sonido" className="config-item">
              <span>Sonido de fondo</span>
              <p>Activa o desactiva la reproducción automática de la música de fondo del sitio.  </p>
              <Switch
                checked={componentes?.["componente_sonido"]}
                onChange={() =>
                  updateComponentes("componente_sonido", !componentes?.["componente_sonido"])
                }
              />
            </div>
          </div>

          {/* Sección: Componentes del Sistema */}
          <div className="config-section">
            <h3 className="section-title">
              <i className="bi bi-display section-icon"></i> Componentes del Sistema
            </h3>
            {componentesTitle.map((componente) => {
              const nombreComponente = `componente_${componente}`;
              const estadoComponente = componentes[nombreComponente];
              return (
                <div key={nombreComponente} className="config-item">
                  <span>{componente.charAt(0).toUpperCase() + componente.slice(1)}</span>
                  <Switch
                    checked={estadoComponente}
                    onChange={() =>
                      updateComponentes(nombreComponente, !estadoComponente)
                    }
                  />
                </div>
              );
            })}
          </div>

          {/* Sección: Temas y Fuentes */}
          <div className="config-section">
            <h3 className="section-title">
              <i className="bi bi-palette section-icon"></i>Diseños, Temas y Fuentes
            </h3>
            <div className="config-item">
              <span>Diseño Activo</span>
              <select
                value={diseñoActivo?.id || ""}
                onChange={(e) => activarDiseño(e.target.value)}
                className="theme-select"
              >
                <option value="" disabled>
                  Seleccione un diseño
                </option>
                {diseños.map((diseño) => (
                  <option key={diseño.id} value={diseño.id}>
                    {diseño.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="config-item">
              <span>Tema Activo</span>
              <select
                value={temaActivo?.id || ""}
                onChange={(e) => activarTema(e.target.value)}
                className="theme-select"
              >
                <option value="" disabled>
                  Seleccione un tema
                </option>
                {temas.map((tema) => (
                  <option key={tema.id} value={tema.id}>
                    {tema.titulo}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Sección: Temas del Sistema */}
          <div className="config-section config-edit-theme">
            <h3 className="section-title">
              <i className="bi bi-brush section-icon"></i> Temas del Sistema
            </h3>
            <div className="table-responsive table-themes-responsive">
              <table className="admin-table themes-table">
                <thead>
                  <tr>
                    <th>Tema</th>
                    <th>Texto Principal</th>
                    <th>Texto Secundario</th>
                    <th>Color 1</th>
                    <th>Color 2</th>
                    <th>Color 3</th>
                    <th>Color 4</th>
                    <th>Color 5</th>
                    <th>Color 6</th>
                    <th>Color Fondo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {temas?.map((tema) => {
                    const getColor = (id) =>
                      colores && colores.find((color) => color.id === id);
                    const colors = [
                      { id: "primario1", value: getColor(tema.primario1) },
                      { id: "primario2", value: getColor(tema.primario2) },
                      { id: "secundario1", value: getColor(tema.secundario1) },
                      { id: "secundario2", value: getColor(tema.secundario2) },
                      { id: "terciario", value: getColor(tema.terciario) },
                      { id: "cuarto", value: getColor(tema.cuarto) },
                      { id: "fondo1", value: getColor(tema.fondo1) },
                    ];
                    const fuente1 = obtenerFuente(tema.fuente_primaria)
                    const fuente2 = obtenerFuente(tema.fuente_secundaria)
                    return (
                      <tr key={tema.id}>
                        <td>{tema.titulo || "Sin título"}</td>
                        <td>{fuente1.fuente.nombre || "N/A"}<div
                          className="color-preview"
                          style={{
                            backgroundColor: fuente1.color.codigo_hex || "",
                          }}
                        ></div></td>
                        <td>{fuente2.fuente.nombre || "N/A"}<div
                          className="color-preview"
                          style={{
                            backgroundColor: fuente2.color.codigo_hex || "",
                          }}
                        /></td>
                        {colors.map((color) => (
                          <td key={`${tema.id}-${color.id}`}>
                            {color.value ? (
                              <div
                                className="color-preview"
                                style={{
                                  backgroundColor: color.value.codigo_hex,
                                }}
                              />
                            ) : (
                              "N/A"
                            )}
                          </td>
                        ))}
                        <td>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => abrirVentanaConfirmacion(tema.id)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button className="add-btn theme-add-btn" onClick={addDato}>
              Añadir Nuevo Tema
            </button>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                {param === "vendedores" ? (
                  <>
                    <th>Nombre</th>
                    <th>DNI</th>
                    <th>Correo</th>
                    <th>Usuario</th>
                    <th>Teléfono</th>
                    <th>Barrio</th>
                    <th>ROL</th>
                    <th>Acciones</th>
                  </>
                ) : param === "productos" ? (
                  <>
                    <th>Imagen</th>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Precio</th>
                    <th>Talles</th>
                    <th>Código QR</th>
                    {(isGestor || isSuperAdmin) && <th>Acciones</th>}
                  </>
                ) : param === "categorias" ? (
                  <>
                    <th>Nombre</th>
                    <th>Imagen</th>
                    {(isGestor || isSuperAdmin) && <th>Acciones</th>}
                  </>
                ) : param === "cupones" ? (
                  <>
                    <th>Código</th>
                    <th>Descuento</th>
                    {(isGestor || isSuperAdmin) && <th>Acciones</th>}
                  </>
                ) : param === "descuentos" ? (
                  <>
                    <th>Categoría</th>
                    <th>Descuento</th>
                    {(isGestor || isSuperAdmin) && <th>Acciones</th>}
                  </>
                ) : param === "barrios" ? (
                  <>
                    <th>Nombre</th>
                    <th>Recargo</th>
                    {(isGestor || isSuperAdmin) && <th>Acciones</th>}
                  </>
                ) : param === "usuarios" ? (
                  <>
                    <th>Correo</th>
                    <th>Nombre</th>
                    <th>DNI</th>
                    <th>Teléfono</th>
                    <th>Barrio</th>
                    <th>Domicilio</th>
                    <th>Puntos</th>
                    {(isModerador || isSuperAdmin) && <th>Acciones</th>}
                  </>
                ) : param === "talles" ? (
                  <>
                    <th>Nombre/Número</th>
                    {(isGestor || isSuperAdmin) && <th>Acciones</th>}
                  </>
                ) : param === "contenidosWeb" && (isModerador || isSuperAdmin) ? (
                  <>
                    <th>Elemento</th>
                    <th>Contenido</th>
                    <th>Imagen</th>
                    <th>Acciones</th>
                  </>
                ) : param === "informacionWeb" && (isModerador || isSuperAdmin) ? (
                  <>
                    <th>Dato</th>
                    <th style={{ width: "30% !important" }}>Contenido</th>
                    <th>Imagen</th>
                    <th>Acciones</th>
                  </>
                ) : param === "reviews" && (isModerador || isSuperAdmin) ? (
                  <>
                    <th>Usuario</th>
                    <th>Calificación</th>
                    <th>Comentario</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {datosFiltrados?.length === 0 &&
                !cargando &&
                !cargandoAdmin &&
                !isLoadingAction ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                datosFiltrados.map((dato, index) => (
                  <tr key={dato.id || `item-${index}`} className="table-row">
                    {param === "vendedores" ? (
                      <>
                        <td>{dato.nombre || "Sin nombre"}</td>
                        <td>{dato.dni || "N/A"}</td>
                        <td>
                          {obtenerDatosUsuario(dato.usuario, "usuarios").email ||
                            "N/A"}
                        </td>
                        <td>
                          {obtenerDatosUsuario(dato.usuario, "usuarios").username ||
                            "N/A"}
                        </td>
                        <td>{dato.telefono || "N/A"}</td>
                        <td>{obtenerBarrio(dato?.barrio) || "Sin barrio"}</td>
                        <td>{obtenerRol(dato.rol) || "Sin rol"}</td>
                        {isSuperAdmin ? (
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => editarDato(dato)}
                              >
                                Editar
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => abrirVentanaConfirmacion(dato.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        ) : user.id === obtenerDatosUsuario(dato.usuario, "usuarios").id ? (
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => editarDato(dato)}
                              >
                                Editar
                              </button>
                            </div>
                          </td>
                        ) : (
                          ""
                        )}
                      </>
                    ) : param === "productos" ? (
                      <>
                        <td className="table-image">
                          <img
                            src={dato.imagen || null}
                            alt="Producto"
                            onClick={() => mostrarTalles(dato)}
                          />
                        </td>
                        <td>{dato.id || "N/A"}</td>
                        <td>{dato.nombre || "Sin nombre"}</td>
                        <td>{(dato.descripcion?.slice(0, 50) || "") + "..."}</td>
                        <td>{dato.precio_final || "N/A"}</td>
                        <td>
                          <button
                            className="action-btn info-btn"
                            onClick={() => mostrarTalles(dato)}
                          >
                            Ver Talles
                          </button>
                        </td>
                        <td className="zoom-container">
                          <img src={dato.qr_code || null} alt="QR" />
                        </td>
                        {(isGestor || isSuperAdmin) && (
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => editarDato(dato)}
                              >
                                Editar
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => abrirVentanaConfirmacion(dato.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        )}
                      </>
                    ) : param === "usuarios" ? (
                      <>
                        <td>{dato.email || "N/A"}</td>
                        <td>
                          {obtenerDatosUsuario(dato.id, "perfil").nombre_apellido ||
                            "Sin nombre"}
                        </td>
                        <td>
                          {obtenerDatosUsuario(dato.id, "perfil").dni || "N/A"}
                        </td>
                        <td>
                          {obtenerDatosUsuario(dato.id, "perfil").telefono || "N/A"}
                        </td>
                        <td>
                          {obtenerBarrio(
                            obtenerDatosUsuario(dato.id, "perfil").barrio
                          ) || "Sin barrio"}
                        </td>
                        <td>
                          {obtenerDatosUsuario(dato.id, "perfil").domicilio ||
                            "Sin domicilio"}
                        </td>
                        <td>{obtenerPuntosPorUsuario(dato) || 0}</td>
                        {(isModerador || isSuperAdmin) && (
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => editarDato(dato)}
                              >
                                Editar
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => abrirVentanaConfirmacion(dato.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        )}
                      </>
                    ) : param === "barrios" ? (
                      <>
                        <td>{dato.nombre || "Sin nombre"}</td>
                        <td>{dato.precio || "N/A"}</td>
                        {(isGestor || isSuperAdmin) && (
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => editarDato(dato)}
                              >
                                Editar
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => abrirVentanaConfirmacion(dato.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        )}
                      </>
                    ) : param === "talles" ? (
                      <>
                        <td>{dato.nombre || "Sin nombre"}</td>
                        {(isGestor || isSuperAdmin) && (
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => editarDato(dato)}
                              >
                                Editar
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => abrirVentanaConfirmacion(dato.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        )}
                      </>
                    ) : param === "contenidosWeb" && (isModerador || isSuperAdmin) ? (
                      <>
                        <td>{dato.nombre || "Sin nombre"}</td>
                        <td>{dato.contenido || "Sin contenido"}</td>
                        <td>
                          <img
                            src={dato.imagen || null}
                            alt="Contenido"
                            className="table-image"
                          />
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn edit-btn"
                              onClick={() => editarDato(dato)}
                            >
                              Editar
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => abrirVentanaConfirmacion(dato.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </>
                    ) : param === "informacionWeb" && (isModerador || isSuperAdmin) ? (
                      <>
                        <td>{dato.nombre || "Sin nombre"}</td>
                        <td style={{ width: "30% !important" }}>{dato.contenido || "Sin contenido"}</td>
                        <td>
                          <img
                            src={dato.imagen || null}
                            alt="Contenido"
                            className="table-image"
                          />
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn edit-btn"
                              onClick={() => editarDato(dato)}
                            >
                              Editar
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => abrirVentanaConfirmacion(dato.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </>
                    ) : param === "cupones" ? (
                      <>
                        <td>{dato.codigo || "Sin código"}</td>
                        <td>
                          {dato.descuento
                            ? `${Math.round(dato.descuento, 2)} %`
                            : "N/A"}
                        </td>
                        {(isGestor || isSuperAdmin) && (
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => editarDato(dato)}
                              >
                                Editar
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => abrirVentanaConfirmacion(dato.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        )}
                      </>
                    ) : param === "descuentos" ? (
                      <>
                        <td>{obtenerCategoria(dato) || "Sin categoría"}</td>
                        <td>{dato.porcentaje || "N/A"} %</td>
                        {(isGestor || isSuperAdmin) && (
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => editarDato(dato)}
                              >
                                Editar
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => abrirVentanaConfirmacion(dato.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        )}
                      </>
                    ) : param === "categorias" ? (
                      <>
                        <td>{dato.nombre || "Sin nombre"}</td>
                        <td>
                          <img
                            src={dato.imagen || null}
                            alt={dato.nombre || "Sin imagen"}
                            className="table-image"
                          />
                        </td>
                        {(isGestor || isSuperAdmin) && (
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => editarDato(dato)}
                              >
                                Editar
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => abrirVentanaConfirmacion(dato.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        )}
                      </>
                    ) : param === "reviews" && (isModerador || isSuperAdmin) ? (
                      <>
                        <td>{dato.user || "N/A"}</td>
                        <td>{dato.rating || "N/A"}</td>
                        <td>{dato.comment || "Sin comentario"}</td>
                        <td>{dato.created_at || "N/A"}</td>
                        <td>
                          {dato.approved ? (
                            "Aprobado"
                          ) : (
                            <button
                              className="action-btn approve-btn"
                              onClick={() => handleApproved(dato.id, "approve")}
                            >
                              Aprobar
                            </button>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            {dato.approved === false && (
                              <button
                                className="action-btn delete-btn"
                                onClick={() => abrirVentanaConfirmacion(dato.id)}
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <div className="modal-overlay">
          <EditCreateData
            cerrarModal={cerrarModal}
            dato={elementoSeleccionado}
            editable={editable}
            setOpen={setOpen}
            param={param}
          />
        </div>
      )}
      {openVentana && (
        <div className="modal-overlay">
          <VentanaConfirmacion
            mensaje="¿Desea eliminar el elemento?"
            confirmar={confirmarEliminacion}
            cancelar={() => {
              setOpenVentana(false);
              setIdAEliminar(null);
            }}
          />
        </div>
      )}
      {openTallesModal && selectedProducto && (
        <div className="modal-overlay">
          <div className="modal-content sizes-modal">
            <div className="modal-header">
              <h5 className="modal-title">
                Talles de {selectedProducto.nombre || "Producto"}
              </h5>
              <button
                className="close-btn"
                onClick={() => setOpenTallesModal(false)}
              >
                ✖
              </button>
            </div>
            <div className="modal-body">
              {selectedProducto?.talles && selectedProducto?.talles.length > 0 ? (
                <table className="admin-table sizes-table">
                  <thead>
                    <tr>
                      <th>Talle</th>
                      <th>Stock</th>
                      <th>Vendidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducto.talles.map((talle) => (
                      <tr key={talle.id}>
                        <td>{talle.talle || "N/A"}</td>
                        <td>{talle.stock || 0}</td>
                        <td>{talle.cantidad_vendida || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No hay talles disponibles.</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="action-btn secondary-btn"
                onClick={() => setOpenTallesModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};