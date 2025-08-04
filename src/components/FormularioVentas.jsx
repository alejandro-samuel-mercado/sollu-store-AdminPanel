import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDatosPublic } from "../context/DatosPublicContext.jsx";
import { useDatosAdmin } from "../context/DatosAdminContext.jsx";
import API from "../Apis/API.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../context/AuthContext.jsx";
import { useActions } from "../context/ActionsContext.jsx";
import { SuccessNotification } from "./SuccessNotification.jsx";
import { FailedNotification } from "./FailedNotification.jsx";
import { FaEye } from "react-icons/fa";
import { LoadingSpinner } from "./LoadingSpinner.jsx";

export const FormularioVenta = () => {
  const {
    productos,
    barrios,
    vendedores,
    envio,
    recargarDatos,
    estadosDeVenta,
    informacionWeb,
  } = useDatosPublic();
  const { perfilesUsuarios, recargarDatosAdmin, usuarios } = useDatosAdmin();
  const { user } = useAuth();
  const { generarPDF } = useActions();
  const [vendedor, setVendedor] = useState("");
  const [esUsuarioNuevo, setEsUsuarioNuevo] = useState(true);
  const [compradorSinCuenta, setCompradorSinCuenta] = useState({
    usuario: "",
    nombre_apellido: "",
    dni: "",
    telefono: "",
    domicilio: "",
    barrio: "",
    correo: "",
    password: "",
  });
  const [comprador, setComprador] = useState(null);
  const [fechaVenta, setFechaVenta] = useState(new Date());
  const [precioTotal, setPrecioTotal] = useState(0);
  const [precioFinalSinImpuesto, setPrecioFinalSinImpuesto] = useState(0)
  const [barrio, setBarrio] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [finalEnvio, setFinalEnvio] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState(null);
  const [precioEnvio, setPrecioEnvio] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [cupon, setCupon] = useState("");
  const [impuesto, setImpuesto] = useState(0);
  const [horarioEntrega, setHorarioEntrega] = useState("");
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [errores, setErrores] = useState({});
  const [mensajeCupon, setMensajeCupon] = useState("");
  const [cuponEncontrado, setCuponEncontrado] = useState(false);
  const [usuariosCompletos, setUsuariosCompletos] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [failedSuccess, setFailedSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const estado = estadosDeVenta?.find((est) => est.estado === "Vendido-Local");
  const tipoEnvioDefault = envio?.find(
    (env) => env.nombre === "Retiro en local"
  );

  const nombre = informacionWeb?.find((info) => info.nombre === "Nombre_empresa")
  const direccion = informacionWeb?.find((info) => info.nombre === "Direccion_local")
  const telefono = informacionWeb?.find((info) => info.nombre === "Telefono")
  const email = informacionWeb?.find((info) => info.nombre === "Correo_sitio")
  const ciudad = informacionWeb?.find((info) => info.nombre === "Ciudad")
  const pais = informacionWeb?.find((info) => info.nombre === "Pais")
  const moneda_local = informacionWeb?.find((info) => info.nombre === "Moneda_local")


  // Validaciones (sin cambios)
  const validarUsuario = useCallback(
    (username) => {
      if (!username) return "El usuario es obligatorio.";
      const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,}$/;
      if (!regex.test(username))
        return "El usuario debe tener letras y números, mínimo 4 caracteres.";
      if (usuariosCompletos.some((u) => u.username === username))
        return "El usuario ya existe.";
      return "";
    },
    [usuariosCompletos]
  );

  const validarNombreApellido = (nombreApellido) => {
    if (!nombreApellido) return "El nombre y apellido son obligatorios.";
    const palabras = nombreApellido.trim().split(/\s+/);
    if (palabras.length < 2) return "Debe ingresar al menos nombre y apellido.";
    return "";
  };

  const validarDNI = useCallback(
    async (dni) => {
      if (!dni) return "El DNI es obligatorio.";
      if (dni.length !== 8 || !/^\d{8}$/.test(dni)) return "Formato inválido";
      const dniStr = String(dni);
      const existe = usuariosCompletos.some((u) => String(u.dni) === dniStr);
      if (existe) return "El DNI ya existe.";
      return "";
    },
    [usuariosCompletos]
  );

  const validarTelefono = (telefono) => {
    if (!telefono) return "El teléfono es obligatorio.";
    const regex = /^\d{6,15}$/;
    if (!regex.test(telefono))
      return "El teléfono debe ser un número válido (6-15 dígitos).";
    return "";
  };

  const validarCorreo = useCallback(
    (correo) => {
      if (!correo) return "El correo es obligatorio.";
      const regex = /^[^\s@]+@[^\s@]+\.(com|org|net|edu|gov|co|ar)$/;
      if (!regex.test(correo))
        return "El correo debe tener @ y una terminación válida (ej. gmail.com).";
      if (usuariosCompletos.some((u) => u.email === correo))
        return "El correo ya está registrado.";
      return "";
    },
    [usuariosCompletos]
  );

  const validarPassword = (password) => {
    if (!password) return "La contraseña es obligatoria.";
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[A-Z])[A-Za-z\d]{8,}$/;
    if (!regex.test(password))
      return "La contraseña debe tener al menos 8 caracteres, con letras, números y mayúsculas.";
    return "";
  };

  const validarCampo = useCallback(
    async (name, value) => {
      switch (name) {
        case "comprador_sin_cuenta.usuario":
          return validarUsuario(value);
        case "comprador_sin_cuenta.nombre_apellido":
          return validarNombreApellido(value);
        case "comprador_sin_cuenta.dni":
          return await validarDNI(value);
        case "comprador_sin_cuenta.telefono":
          return validarTelefono(value);
        case "comprador_sin_cuenta.correo":
          return validarCorreo(value);
        case "comprador_sin_cuenta.password":
          return validarPassword(value);
        case "comprador_sin_cuenta.domicilio":
          return value ? "" : "El domicilio es obligatorio.";
        case "comprador_sin_cuenta.barrio":
          return value ? "" : "El barrio es obligatorio.";
        case "tipo_envio":
          return value ? "" : "El tipo de envío es obligatorio.";
        default:
          return "";
      }
    },
    [validarUsuario, validarCorreo, validarDNI]
  );

  useEffect(() => {
    if (usuarios && perfilesUsuarios) {
      const completos = usuarios.map((usuario) => {
        const perfil =
          perfilesUsuarios.find((p) => p.usuario === usuario.id) || {};
        return {
          id: usuario.id,
          username: usuario.username,
          email: usuario.email,
          dni: perfil.dni || "",
          barrio: perfil.barrio || null,
          domicilio: perfil.domicilio || "",
          nombre_apellido: perfil.nombre_apellido || "",
          telefono: perfil.telefono || "",
          pais: perfil.pais || ""
        };
      });
      setUsuariosCompletos(completos);
    }
  }, [usuarios, perfilesUsuarios]);

  useEffect(() => {
    resetForm();
  }, []);

  const resetForm = useCallback(() => {
    setComprador(null);
    setCompradorSinCuenta({
      usuario: "",
      nombre_apellido: "",
      dni: "",
      telefono: "",
      domicilio: "",
      barrio: "",
      pais: "",
      correo: "",
      password: "",
    });
    setFechaVenta(new Date());
    setPrecioTotal(0);
    setBarrio("");
    setDomicilio("");
    setFechaEntrega(null);
    setHorarioEntrega("");
    setProductosSeleccionados([]);
    setUsuarioSeleccionado(null);
    setEsUsuarioNuevo(true);
    setBusquedaProducto("");
    setBusquedaUsuario("");
    setErrores({});
    setFinalEnvio("");
  }, []);

  const handleCompradorSinCuentaChange = useCallback((e) => {
    const { name, value } = e.target;
    const field = name.split(".")[1];
    setCompradorSinCuenta((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleFieldChange = useCallback(
    (setter) => (e) => {
      setter(e.target.value);
    },
    []
  );

  const handleBlur = useCallback(
    async (e) => {
      const { name, value } = e.target;
      const field = name.includes("comprador_sin_cuenta")
        ? name.split(".")[1]
        : name;
      const error = await validarCampo(name, value);
      setErrores((prev) => ({ ...prev, [field]: error }));
    },
    [validarCampo]
  );

  const hayStock = (producto) => {
    return producto.talles.some((talle) => talle.stock > 0);
  };

  const datosUsuarioEsCompleto = (perfil) => {
    const verificacion = Object.values(perfil).every(
      (p) => p !== "" && p !== null
    );
    return verificacion;
  };

  const handleSeleccionProducto = useCallback((producto) => {
    if (hayStock(producto)) {
      const idUnico = Date.now() + Math.random();
      setProductosSeleccionados((prev) => [
        ...prev,
        {
          idUnico,
          producto: producto.id,
          producto_final: null,
          talleSeleccionado: null,
          cantidad: 1,
          precio_unitario: producto.precio_final,
          subtotal: parseFloat(producto.precio_final) || 0,
        },
      ]);
      setBusquedaProducto("");
      setErrores((prev) => ({ ...prev, productos: "" }));
    } else {
      setErrores((prev) => ({
        ...prev,
        productos: "No hay stock disponible para este producto.",
      }));
    }
  }, []);

  const handleSeleccionTalle = useCallback(
    (idUnico, talleId) => {
      const producto = productos.find((p) =>
        productosSeleccionados.some(
          (ps) => ps.idUnico === idUnico && ps.producto === p.id
        )
      );
      const talle = producto.talles.find((t) => t.id === parseInt(talleId));

      const tallaYaSeleccionada = productosSeleccionados.some(
        (p) =>
          p.producto === producto.id &&
          p.producto_final === talle.id &&
          p.idUnico !== idUnico
      );

      if (tallaYaSeleccionada) {
        setErrores((prev) => ({
          ...prev,
          productos: `La talla ${talle.talle} del producto ${producto.nombre} ya está seleccionada.`,
        }));
        return;
      }

      if (talle && talle.stock > 0) {
        setProductosSeleccionados((prev) =>
          prev.map((p) =>
            p.idUnico === idUnico
              ? {
                ...p,
                producto_final: talle.id,
                talleSeleccionado: talle.talle,
                cantidad: Math.min(p.cantidad || 1, talle.stock),
                subtotal:
                  parseFloat(p.precio_unitario) *
                  Math.min(p.cantidad || 1, talle.stock),
              }
              : p
          )
        );
        setErrores((prev) => ({ ...prev, productos: "" }));
      } else {
        setErrores((prev) => ({
          ...prev,
          productos: "La talla seleccionada no tiene stock disponible.",
        }));
      }
    },
    [productos, productosSeleccionados]
  );

  const handleCambiarCantidad = useCallback(
    (productoSeleccionado, nuevaCantidadRaw) => {
      if (!productoSeleccionado.producto_final) {
        setErrores((prev) => ({
          ...prev,
          productos: "Selecciona un talle antes de cambiar la cantidad.",
        }));
        return;
      }

      const producto = productos.find(
        (p) => p.id === productoSeleccionado.producto
      );
      const talle = producto.talles.find(
        (t) => t.id === productoSeleccionado.producto_final
      );
      const nuevaCantidad =
        nuevaCantidadRaw === "" ? "" : parseInt(nuevaCantidadRaw, 10);

      if (nuevaCantidad === "") {
        setProductosSeleccionados((prev) =>
          prev.map((p) =>
            p.idUnico === productoSeleccionado.idUnico
              ? { ...p, cantidad: "" }
              : p
          )
        );
        return;
      }

      if (isNaN(nuevaCantidad)) return;

      const cantidadAjustada = Math.max(
        1,
        Math.min(talle.stock, nuevaCantidad)
      );
      setProductosSeleccionados((prev) =>
        prev.map((p) =>
          p.idUnico === productoSeleccionado.idUnico
            ? {
              ...p,
              cantidad: cantidadAjustada,
              subtotal: parseFloat(p.precio_unitario) * cantidadAjustada || 0,
            }
            : p
        )
      );
    },
    [productos]
  );

  const handleEliminarProducto = useCallback((idUnico) => {
    setProductosSeleccionados((prev) =>
      prev.filter((p) => p.idUnico !== idUnico)
    );
  }, []);

  const totalCalculado = useMemo(() => {
    return productosSeleccionados.reduce(
      (sum, p) => sum + parseFloat(p.subtotal || 0),
      0
    );
  }, [productosSeleccionados]);

  const validarCupon = async () => {
    if (!cupon) {
      setMensajeCupon("Ingresa un cupón para validar.");
      return;
    }
    try {
      const response = await API.post("validar-cupon/", {
        codigo: cupon,
      });
      if (response.status === 200) {
        setCuponEncontrado(true);
        setDescuento(response.data.descuento);
        setMensajeCupon(
          `Obtuviste un descuento del ${response.data.descuento}%`
        );
      }
    } catch (error) {
      setMensajeCupon(error.response?.data?.error || "El cupón no es válido.");
      setDescuento(0);
      setCuponEncontrado(false);
    }
  };

  useEffect(() => {
    let barrioSeleccionadoId = esUsuarioNuevo
      ? compradorSinCuenta.barrio
      : barrio;
    if (finalEnvio === "Envío a domicilio" && barrios && barrioSeleccionadoId) {
      const barrioSeleccionado = barrios.find(
        (b) => b.id === Number(barrioSeleccionadoId)
      );
      if (barrioSeleccionado) {
        setPrecioEnvio(Number(barrioSeleccionado.precio));
      } else {
        setPrecioEnvio(0);
      }
    } else {
      setPrecioEnvio(0);
    }
  }, [finalEnvio, barrio, compradorSinCuenta.barrio, barrios, esUsuarioNuevo]);

  useEffect(() => {
    if (!informacionWeb || informacionWeb.length < 1) return;
    const impuestoDato = informacionWeb.find(
      (inf) => inf.nombre.toLowerCase() === "impuesto"
    );
    if (impuestoDato) {
      setImpuesto(Number(impuestoDato.contenido));
    }
  }, [informacionWeb]);

  useEffect(() => {
    const precioSinImpuesto = totalCalculado -
      totalCalculado * (descuento / 100) +
      precioEnvio
    const nuevoPrecio =
      totalCalculado -
      totalCalculado * (descuento / 100) +
      precioEnvio +
      totalCalculado * (impuesto / 100);
    setPrecioTotal(Number(nuevoPrecio.toFixed(2)));
    setPrecioFinalSinImpuesto(precioSinImpuesto.toFixed(2))
  }, [totalCalculado, descuento, precioEnvio, impuesto]);

  const filtrarProductos = useCallback(() => {
    if (busquedaProducto) {
      const filtrados = productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
          p.id.toString().includes(busquedaProducto)
      );
      setProductosFiltrados(filtrados);
    } else {
      setProductosFiltrados([]);
    }
  }, [busquedaProducto, productos]);

  useEffect(() => {
    filtrarProductos();
  }, [filtrarProductos]);

  const filtrarUsuarios = useCallback(() => {
    if (busquedaUsuario && usuariosCompletos.length > 0) {
      const filtrados = usuariosCompletos.filter((perfil) => {
        const username = (perfil.username || "").toLowerCase();
        const email = (perfil.email || "").toLowerCase();
        const nombreApellido = (perfil.nombre_apellido || "").toLowerCase();
        const dni = (perfil.dni || "").toLowerCase();
        const busqueda = busquedaUsuario.toLowerCase();
        return (
          username.includes(busqueda) ||
          email.includes(busqueda) ||
          nombreApellido.includes(busqueda) ||
          dni.includes(busqueda)
        );
      });
      setUsuariosFiltrados(filtrados || []);
    } else {
      setUsuariosFiltrados([]);
    }
  }, [busquedaUsuario, usuariosCompletos]);

  useEffect(() => {
    filtrarUsuarios();
  }, [filtrarUsuarios]);

  useEffect(() => {
    if (vendedores) {
      const vendedorEncontrado = vendedores.find((v) => v.usuario === user.id);
      setVendedor(vendedorEncontrado || "");
    }
  }, [vendedores, user]);

  const handleSeleccionUsuario = useCallback((perfil) => {
    const datosSonCompletos = datosUsuarioEsCompleto(perfil);
    if (datosSonCompletos) {
      setUsuarioSeleccionado(perfil);
      setComprador(perfil.id);
      setBarrio(perfil.barrio || "");
      setDomicilio(perfil.domicilio || "");
      setBusquedaUsuario("");
      setUsuariosFiltrados([]);
    }
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setErrores({});
      setIsLoading(true);

      const nuevosErrores = {};
      if (esUsuarioNuevo) {
        for (const [key, value] of Object.entries(compradorSinCuenta)) {
          const error = await validarCampo(
            `comprador_sin_cuenta.${key}`,
            value
          );
          if (error) nuevosErrores[key] = error;
        }
      } else if (!comprador) {
        nuevosErrores.comprador = "Debe seleccionar un usuario existente.";
      }

      if (!productosSeleccionados.length) {
        nuevosErrores.productos = "Debe seleccionar al menos un producto.";
      } else {
        productosSeleccionados.forEach((p, index) => {
          if (!p.producto_final) {
            nuevosErrores[`producto_${index}`] =
              "Debe seleccionar un talle para este producto.";
          }
          if (p.cantidad <= 0) {
            nuevosErrores[`cantidad_${index}`] =
              "La cantidad debe ser mayor a 0.";
          }
        });
      }

      if (!finalEnvio) {
        nuevosErrores.finalEnvio = "Debe seleccionar una forma de envío.";
      }

      if (Object.keys(nuevosErrores).length > 0) {
        setErrores(nuevosErrores);
        setIsLoading(false);
        return;
      }

      const tipoEnvioSeleccionado = envio.find(
        (env) => env.nombre === finalEnvio
      );

      const datosParaBackend = {
        estado: estado?.id || 1,
        vendedor: vendedor?.id,
        comprador: esUsuarioNuevo ? null : comprador,
        comprador_sin_cuenta: esUsuarioNuevo ? compradorSinCuenta.usuario : "---",
        fecha_venta: fechaVenta.toISOString().split("T")[0],
        precio_total: precioTotal,
        barrio: esUsuarioNuevo ? compradorSinCuenta.barrio : barrio,
        domicilio: esUsuarioNuevo ? compradorSinCuenta.domicilio : domicilio,
        fecha_venta: fechaVenta?.toISOString().split("T")[0] || null,
        fecha_entrega: fechaEntrega?.toISOString().split("T")[0] || null,
        horario_entrega: horarioEntrega || "---",
        tipo_envio: tipoEnvioSeleccionado?.id || tipoEnvioDefault?.id,
        detalles: productosSeleccionados.map((p) => ({
          producto_final_id: p.producto_final,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
          subtotal: p.subtotal,
        })),
      };

      if (esUsuarioNuevo) {
        datosParaBackend.usuario_nuevo = {
          username: compradorSinCuenta.usuario,
          email: compradorSinCuenta.correo,
          password: compradorSinCuenta.password,
        };
        datosParaBackend.perfil_usuario = {
          nombre_apellido: compradorSinCuenta.nombre_apellido,
          dni: compradorSinCuenta.dni,
          telefono: compradorSinCuenta.telefono,
          barrio: compradorSinCuenta.barrio,
          domicilio: compradorSinCuenta.domicilio,
        };
      } else if (!esUsuarioNuevo && (domicilio || barrio)) {
        datosParaBackend.perfil_usuario = {
          domicilio: domicilio || usuarioSeleccionado?.domicilio,
          barrio: barrio || usuarioSeleccionado?.barrio?.id,
        };
      }

      try {
        const response = await API.post(
          `${process.env.REACT_APP_API_BASE_URL}/api/crear-venta/`,
          datosParaBackend
        );
        const nuevaVenta = response?.data;

        if (response && nuevaVenta) {
          const datosCompra = {
            datosEmpresa: {
              nombre,
              email, telefono, direccion, ciudad, pais, moneda_local
            },
            nombre: esUsuarioNuevo
              ? compradorSinCuenta.nombre_apellido
              : usuarioSeleccionado?.nombre_apellido,
            correo: esUsuarioNuevo
              ? compradorSinCuenta.correo
              : usuarioSeleccionado?.email,
            telefono: esUsuarioNuevo
              ? compradorSinCuenta.telefono
              : usuarioSeleccionado?.telefono,
            domicilio: datosParaBackend.domicilio,
            idFiscal: esUsuarioNuevo
              ? compradorSinCuenta.id
              : usuarioSeleccionado?.id || "No proporcionado",
            cityComprador:
              barrios.find((b) => b.id === Number(datosParaBackend.barrio))
                ?.nombre || "N/A",
            paisComprador: esUsuarioNuevo
              ? compradorSinCuenta.pais
              : usuarioSeleccionado?.pais || "No proporcionado",
            precioEnvio: precioEnvio,
            fecha_venta: fechaVenta?.toISOString().split("T")[0] || null,
            fecha_entrega: fechaEntrega?.toISOString().split("T")[0] || null,
            horario_entrega: horarioEntrega || "---",
            impuesto: impuesto,
            finalEnvio,
            precioFinal: precioTotal,
            precioFinalSinImpuesto,
            productos: productosSeleccionados.map((p) => ({
              nombre:
                productos.find((prod) => prod.id === p.producto)?.nombre ||
                "Producto",
              cantidad: p.cantidad,
              precio_unitario: p.precio_unitario,
              subtotal: p.subtotal,
              talle: p.talleSeleccionado
            })),
          };
          await generarPDF(
            nuevaVenta.id,
            datosCompra,
            nuevaVenta.puntos_club_acumulados || 0
          );

          setShowSuccess(true);
          recargarDatosAdmin();
          recargarDatos();
          resetForm();
          setTimeout(() => setErrores({}), 4000);
        }
      } catch (error) {
        console.error(
          "Error al registrar la venta:",
          error.response?.data || error
        );
        setFailedSuccess(true);
        setErrores(
          error.response?.data || { general: "Error al registrar la venta" }
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      vendedor,
      esUsuarioNuevo,
      comprador,
      compradorSinCuenta,
      fechaVenta,
      precioTotal,
      barrio,
      domicilio,
      fechaEntrega,
      horarioEntrega,
      finalEnvio,
      productosSeleccionados,
      usuarioSeleccionado,
      recargarDatosAdmin,
      recargarDatos,
      validarCampo,
      generarPDF,
      productos,
      barrios,
      envio,
      estado,
      tipoEnvioDefault,
    ]
  );

  return (
    <>
      <div className="ver-ventas">
        <Link to="/ventas" className="ver-ventas-button">
          <FaEye /> Ver Ventas
        </Link>
      </div>
      <div className="formulario-venta container">
        {isLoading && <LoadingSpinner />}
        {showSuccess && (
          <SuccessNotification
            message="Venta registrada con éxito. El recibo ha sido descargado y enviado al correo del comprador."
            onClose={() => setShowSuccess(false)}
          />
        )}
        {failedSuccess && (
          <FailedNotification
            message="Error al registrar venta."
            onClose={() => setFailedSuccess(false)}
          />
        )}

        <h2 className="text-center mb-4">REGISTRO DE VENTA</h2>
        <form onSubmit={handleSubmit} autoComplete="off" className="mx-5">
          {/* Datos del Comprador */}
          <div className="seccion mb-4">
            <h3 className="mb-3">Datos del Comprador</h3>
            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                checked={esUsuarioNuevo}
                onChange={(e) => {
                  setEsUsuarioNuevo(e.target.checked);
                  setBarrio("");
                }}
                id="esUsuarioNuevo"
              />
              <label className="form-check-label" htmlFor="esUsuarioNuevo">
                ¿Usuario nuevo?
              </label>
            </div>
            {esUsuarioNuevo ? (
              <div className="row">
                <div className="col-md-6 mb-3">
                  <input
                    type="text"
                    name="comprador_sin_cuenta.usuario"
                    placeholder="Usuario"
                    value={compradorSinCuenta.usuario}
                    onChange={handleCompradorSinCuentaChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                    required
                    className="form-control"
                  />
                  {errores.usuario && (
                    <p className="error">{errores.usuario}</p>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <input
                    type="text"
                    name="comprador_sin_cuenta.nombre_apellido"
                    placeholder="Nombre y Apellido"
                    value={compradorSinCuenta.nombre_apellido}
                    onChange={handleCompradorSinCuentaChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                    required
                    className="form-control"
                  />
                  {errores.nombre_apellido && (
                    <p className="error">{errores.nombre_apellido}</p>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <input
                    type="text"
                    name="comprador_sin_cuenta.dni"
                    placeholder="DNI"
                    value={compradorSinCuenta.dni}
                    onChange={handleCompradorSinCuentaChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                    required
                    className="form-control"
                  />
                  {errores.dni && <p className="error">{errores.dni}</p>}
                </div>
                <div className="col-md-6 mb-3">
                  <input
                    type="text"
                    name="comprador_sin_cuenta.telefono"
                    placeholder="Teléfono"
                    value={compradorSinCuenta.telefono}
                    onChange={handleCompradorSinCuentaChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                    required
                    className="form-control"
                  />
                  {errores.telefono && (
                    <p className="error">{errores.telefono}</p>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <input
                    type="email"
                    name="comprador_sin_cuenta.correo"
                    placeholder="Correo Electrónico"
                    value={compradorSinCuenta.correo}
                    onChange={handleCompradorSinCuentaChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                    required
                    className="form-control"
                  />
                  {errores.correo && <p className="error">{errores.correo}</p>}
                </div>
                <div className="col-md-6 mb-3">
                  <input
                    type="password"
                    name="comprador_sin_cuenta.password"
                    placeholder="Contraseña"
                    value={compradorSinCuenta.password}
                    onChange={handleCompradorSinCuentaChange}
                    onBlur={handleBlur}
                    autoComplete="new-password"
                    required
                    className="form-control"
                  />
                  {errores.password && (
                    <p className="error">{errores.password}</p>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <input
                    type="text"
                    name="comprador_sin_cuenta.domicilio"
                    placeholder="Domicilio"
                    value={compradorSinCuenta.domicilio}
                    onChange={handleCompradorSinCuentaChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                    required
                    className="form-control"
                  />
                  {errores.domicilio && (
                    <p className="error">{errores.domicilio}</p>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <select
                    name="comprador_sin_cuenta.barrio"
                    value={compradorSinCuenta.barrio}
                    onChange={(e) => {
                      handleCompradorSinCuentaChange(e);
                      setBarrio(e.target.value);
                    }}
                    onBlur={handleBlur}
                    autoComplete="off"
                    required
                    className="form-select"
                  >
                    <option value="">Seleccionar Barrio</option>
                    {barrios.map((barrio) => (
                      <option key={barrio.id} value={barrio.id}>
                        {barrio.nombre}
                      </option>
                    ))}
                  </select>
                  {errores.barrio && <p className="error">{errores.barrio}</p>}
                </div>
              </div>
            ) : (
              <div className="row">
                <div className="col-12 mb-3">
                  <input
                    type="text"
                    placeholder="Buscar usuario por nombre o email"
                    value={busquedaUsuario}
                    onChange={handleFieldChange(setBusquedaUsuario)}
                    autoComplete="off"
                    className="form-control"
                  />
                  {busquedaUsuario && (
                    <div className="lista-usuarios card mt-2">
                      {usuariosFiltrados.map((usuario) => (
                        <div
                          key={usuario.id}
                          className="usuario card-body"
                          onClick={() => handleSeleccionUsuario(usuario)}
                          style={
                            !datosUsuarioEsCompleto(usuario)
                              ? {
                                backgroundColor: "#ee080888",
                                borderBottom: "solid 1px #333",
                              }
                              : { borderBottom: "solid 1px #333" }
                          }
                        >
                          <span
                            className={`${!datosUsuarioEsCompleto(usuario) ? "tachado" : ""
                              }`}
                          >
                            {usuario.username}
                          </span>
                          , <span>{usuario.nombre_apellido}</span>,{" "}
                          <span>{usuario.dni}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {usuarioSeleccionado && (
                  <>
                    <div className="col-12 mb-3">
                      <p className="text-muted">
                        Usuario seleccionado: {usuarioSeleccionado.username} (
                        {usuarioSeleccionado.email})
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <input
                        type="text"
                        name="domicilio"
                        placeholder="Domicilio (opcional)"
                        value={domicilio}
                        onChange={handleFieldChange(setDomicilio)}
                        autoComplete="off"
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <select
                        name="barrio"
                        value={barrio}
                        onChange={handleFieldChange(setBarrio)}
                        autoComplete="off"
                        className="form-select"
                      >
                        <option value="">Seleccionar Barrio (opcional)</option>
                        {barrios.map((barrio) => (
                          <option key={barrio.id} value={barrio.id}>
                            {barrio.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                {errores.comprador && (
                  <p className="error col-12">{errores.comprador}</p>
                )}
              </div>
            )}
          </div>

          {/* Productos */}
          <div className="seccion mb-4">
            <h3 className="mb-3">Productos</h3>
            <div className="row">
              <div className="col-12 mb-3">
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o ID"
                  value={busquedaProducto}
                  onChange={handleFieldChange(setBusquedaProducto)}
                  autoComplete="new-random-value"
                  className="form-control"
                />
                {busquedaProducto && (
                  <div className="lista-productos card mt-2">
                    {productosFiltrados.map((producto) => (
                      <div
                        key={producto.id}
                        className="producto card-body"
                        onClick={() => handleSeleccionProducto(producto)}
                        style={
                          !hayStock(producto)
                            ? {
                              backgroundColor: "#ee080888",
                              borderBottom: "solid 1px #333",
                            }
                            : { borderBottom: "solid 1px #333" }
                        }
                      >
                        <span
                          className={`${!hayStock(producto) ? "tachado" : ""}`}
                        >
                          {producto.nombre}
                        </span>{" "}
                        <span>${producto.precio_final}</span>
                      </div>
                    ))}
                  </div>
                )}
                {errores.productos && (
                  <p className="error">{errores.productos}</p>
                )}
              </div>
              <div className="col-12">
                <div className="productos-seleccionados">
                  {productosSeleccionados.map((p, index) => {
                    const producto = productos.find(
                      (prod) => prod.id === p.producto
                    );
                    return (
                      <div
                        key={p.idUnico}
                        className="producto-seleccionado card mb-2 p-3"
                      >
                        <div className="row align-items-center">
                          <div className="col-md-3">{producto?.nombre}</div>
                          <div className="col-md-3">
                            <select
                              value={p.producto_final || ""}
                              onChange={(e) =>
                                handleSeleccionTalle(p.idUnico, e.target.value)
                              }
                              className="form-select"
                            >
                              <option value="">Seleccionar Talle</option>
                              {producto.talles.map((talle) => {
                                const tallaOcupada =
                                  productosSeleccionados.some(
                                    (prod) =>
                                      prod.producto === p.producto &&
                                      prod.producto_final === talle.id &&
                                      prod.idUnico !== p.idUnico
                                  );
                                return (
                                  <option
                                    key={talle.id}
                                    value={talle.id}
                                    disabled={talle.stock === 0 || tallaOcupada}
                                  >
                                    {talle.talle} (Stock: {talle.stock})
                                  </option>
                                );
                              })}
                            </select>
                            {errores[`producto_${index}`] && (
                              <p className="error">
                                {errores[`producto_${index}`]}
                              </p>
                            )}
                          </div>
                          <div className="col-md-2">
                            <div className="input-group">
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() =>
                                  handleCambiarCantidad(
                                    p,
                                    Math.max(1, p.cantidad - 1)
                                  )
                                }
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={p.cantidad}
                                onChange={(e) =>
                                  handleCambiarCantidad(p, e.target.value)
                                }
                                min="1"
                                max={
                                  producto.talles.find(
                                    (t) => t.id === p.producto_final
                                  )?.stock || 0
                                }
                                step="1"
                                onKeyDown={(e) =>
                                  e.key === "e" && e.preventDefault()
                                }
                                className="form-control text-center w-30"
                                style={{
                                  WebkitAppearance: "none",
                                  MozAppearance: "textfield",
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() =>
                                  handleCambiarCantidad(p, p.cantidad + 1)
                                }
                              >
                                +
                              </button>
                            </div>
                            {errores[`cantidad_${index}`] && (
                              <p className="error">
                                {errores[`cantidad_${index}`]}
                              </p>
                            )}
                          </div>
                          <div className="col-md-2 text-center">
                            ${p.subtotal.toFixed(2)}
                          </div>
                          <div className="col-md-2 text-end">
                            <button
                              type="button"
                              onClick={() => handleEliminarProducto(p.idUnico)}
                              className="btn btn-danger w-100"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Envío y Fecha */}
          <div className="seccion mb-4">
            <h3 className="mb-3">Envío y Fecha</h3>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Fecha de Venta:</label>
                <DatePicker
                  selected={fechaVenta}
                  onChange={(date) => setFechaVenta(date)}
                  className="form-control"
                  dateFormat="dd-MM-yyyy"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Fecha de Entrega:</label>
                <DatePicker
                  selected={fechaEntrega}
                  onChange={(date) => setFechaEntrega(date)}
                  minDate={null}
                  className="form-control"
                  dateFormat="dd-MM-yyyy"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Horario de entrega:</label>
                <input
                  type="text"
                  name="horario_entrega"
                  placeholder="(ej. 10:00-12:00)"
                  value={horarioEntrega}
                  onChange={handleFieldChange(setHorarioEntrega)}
                  onBlur={handleBlur}
                  autoComplete="off"
                  className="form-control"
                />
                {errores.horario_entrega && (
                  <p className="error">{errores.horario_entrega}</p>
                )}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Forma de envío:</label>
                <select
                  name="finalEnvio"
                  id="finalEnvio"
                  value={finalEnvio}
                  onChange={(e) => setFinalEnvio(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="">-- Selecciona una opción --</option>
                  {envio.map((en) => (
                    <option key={en.id} value={en.nombre}>
                      {en.nombre}
                    </option>
                  ))}
                </select>
                {errores.finalEnvio && (
                  <p className="error">{errores.finalEnvio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Cupón de descuento */}
          <div className="seccion mb-4">
            <h3 className="mb-3">Cupón de descuento</h3>
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type="text"
                name="cupon"
                id="cupon"
                value={cupon}
                onChange={(e) => setCupon(e.target.value)}
                className="form-control"
                style={{ width: "50%" }}
                placeholder="Ingresa tu cupón"
              />
              <button
                type="button"
                style={{ width: "20%", marginLeft: "5%" }}
                onClick={validarCupon}
                className="btn btn-primary"
              >
                Validar
              </button>
            </div>
            {mensajeCupon && (
              <p
                className="error-message"
                style={{ color: cuponEncontrado ? "green" : "red" }}
              >
                {mensajeCupon}
              </p>
            )}
          </div>

          {/* Resumen */}
          <div
            className="seccion"
            style={{ display: "flex", marginBottom: "8vh" }}
          >
            <div style={{ width: "50%" }}>
              <h3 className="mb-3">Resumen: </h3>
              <div className="sub-total">
                <p className="form-label">Total en productos: </p>
                <p className="form-label" style={{ color: "var(--terciario)" }}>
                  ${totalCalculado.toFixed(2)}
                </p>
              </div>
              <div className="sub-total">
                <p className="form-label">Descuento por cupón: </p>
                <p className="form-label" style={{ color: "green" }}>
                  - ${(totalCalculado * (descuento / 100)).toFixed(2)}
                </p>
              </div>
              <div className="sub-total">
                <p className="form-label">Precio de envío: </p>
                <p className="form-label" style={{ color: "var(--terciario)" }}>
                  ${precioEnvio.toFixed(2)}
                </p>
              </div>
              <div className="sub-total">
                <p className="form-label">Impuestos: </p>
                <p className="form-label">
                  {`$${(totalCalculado * (impuesto / 100)).toFixed(
                    2
                  )} (${impuesto}%)`}
                </p>
              </div>
            </div>
            <div className="text-center price-final">
              <h3>Precio Total</h3>
              <p>${precioTotal.toFixed(2)}</p>
            </div>
          </div>

          {errores.general && (
            <p className="error general-error text-center">{errores.general}</p>
          )}
          {errores.success && (
            <p className="success text-center">{errores.success}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-enviar-venta"
            style={{ marginBottom: "6vh" }}
          >
            Registrar Venta
          </button>
        </form>
      </div>
    </>
  );
};

export default FormularioVenta;
