import React, { useState, useEffect } from "react";
import API from "../Apis/API.js";
import { useDatosPublic } from "../context/DatosPublicContext.jsx";
import { useDatosAdmin } from "../context/DatosAdminContext.jsx";
import { useDatosPublicComponetes } from "../context/ControladorComponentes.jsx";
import { SuccessNotification } from "./SuccessNotification";
import { FailedNotification } from "./FailedNotification.jsx";
import { LoadingSpinner } from "./LoadingSpinner";
import { useAuth } from "../context/AuthContext.jsx";

export const EditCreateData = ({
  cerrarModal,
  dato = null,
  editable = false,
  setOpen,
  param,
}) => {
  const { categorias, talles, barrios, recargarDatos, vendedores } = useDatosPublic();
  const { recargarDatosAdmin, usuarios, perfilesUsuarios, colores, roles } = useDatosAdmin();
  const { fuentes, crearTema } = useDatosPublicComponetes();
  const { user } = useAuth();

  const [showSuccess, setShowSuccess] = useState(false);
  const [failedSuccess, setFailedSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isModerador, setIsModerador] = useState(false);
  const [isWebmaster, setIsWebmaster] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const obtenerRol = (id) => {
    if (!roles) return "Sin roles";
    const rol = roles?.find((r) => r.id === parseInt(id));
    return rol ? rol.nombre : "Sin rol";
  };

  useEffect(() => {
    if (!user || !user.id) return;
    const vendedor = vendedores?.find((v) => v.usuario === user.id);
    const rol = obtenerRol(vendedor?.rol);
    setIsSuperAdmin(rol === "Propietario");
    setIsModerador(rol === "Moderador");
    setIsWebmaster(rol === "Gestor");

    if (editable && dato && param === "vendedores") {
      if (isSuperAdmin) {
        setFormData((prev) => ({
          ...prev,
          rol: dato.rol || "",
        }));
      }
    }
  }, [roles, user?.id, editable, dato, param, vendedores]);

  const fields = {
    productos: [
      "nombre",
      "descripcion",
      "precio",
      "valor_en_puntos",
      "descuentio",
      "categoria",
      "puntos_club_acumulables",
      "imagen",
      "tendencia",
    ],
    vendedores: isSuperAdmin
      ? ["usuario", "nombre", "dni", "telefono", "barrio", "domicilio", "rol"]
      : ["usuario", "nombre", "dni", "telefono", "barrio", "domicilio"],
    categorias: ["nombre", "imagen"],
    cupones: ["codigo", "descuento", "fecha_expiracion"],
    descuentos: ["categoria", "porcentaje"],
    temas: [
      "titulo",
      "fuente_primaria_fuente",
      "fuente_primaria_color",
      "fuente_secundaria_fuente",
      "fuente_secundaria_color",
      "fuente_terciaria_fuente",
      "fuente_terciaria_color",
      "primario1",
      "primario2",
      "secundario1",
      "secundario2",
      "terciario",
      "cuarto",
      "fondo1",
      "fondo2",
      "fondo3",
      "fondo4",
      "fondo5",
    ],
    contenidosWeb: ["contenido", "imagen"],
    informacionWeb: ["nombre", "contenido", "imagen"],
    barrios: ["nombre", "precio"],
    talles: ["nombre"],
    usuarios: ["usuario", "nombre", "dni", "telefono", "barrio", "domicilio"],
  };

  const normalizeDato = (dato, param) => {
    if (!dato || !editable) return dato;
    const normalized = { ...dato };
    if (param === "productos") {
      normalized.categoria = dato.categoria?.id || dato.categoria || "";
      normalized.talles = dato.talles || [];
    }
    if (param === "usuarios") {
      const perfil = perfilesUsuarios.find((p) => p.usuario === dato.id) || {};
      normalized.usuario = dato.id || "";
      normalized.nombre = perfil.nombre_apellido || dato.nombre || "";
      normalized.dni = perfil.dni || "";
      normalized.telefono = perfil.telefono || "";
      normalized.barrio = perfil.barrio?.id || perfil.barrio || "";
      normalized.domicilio = perfil.domicilio || "";
    }
    if (param === "vendedores") {
      normalized.rol = dato.rol || "";
    }
    if (param === "temas") {
      normalized.primario1 = dato.primario1 || "";
      normalized.primario2 = dato.primario2 || "";
      normalized.secundario1 = dato.secundario1 || "";
      normalized.secundario2 = dato.secundario2 || "";
      normalized.terciario = dato.terciario || "";
      normalized.cuarto = dato.cuarto || "";
      normalized.fondo1 = dato.fondo1 || "";
      normalized.fondo2 = dato.fondo2 || "";
      normalized.fondo3 = dato.fondo3 || "";
      normalized.fondo4 = dato.fondo4 || "";
      normalized.fondo5 = dato.fondo5 || "";
      normalized.fuente_primaria_fuente = dato.fuente_primaria?.fuente?.id || "";
      normalized.fuente_primaria_color = dato.fuente_primaria?.color?.id || "";
      normalized.fuente_secundaria_fuente = dato.fuente_secundaria?.fuente?.id || "";
      normalized.fuente_secundaria_color = dato.fuente_secundaria?.color?.id || "";
      normalized.fuente_terciaria_fuente = dato.fuente_terciaria?.fuente?.id || "";
      normalized.fuente_terciaria_color = dato.fuente_terciaria?.color?.id || "";
    }
    return normalized;
  };

  const getInitialState = () => {
    const normalizedDato = normalizeDato(dato, param);
    const initialState = fields[param].reduce((acc, field) => {
      if (editable && normalizedDato) {
        if (field === "imagen") {
          acc[field] = normalizedDato[field] || null;
          acc["imagenPreview"] = normalizedDato[field] || null;
        } else if (field === "tendencia") {
          acc[field] =
            normalizedDato[field] !== undefined
              ? Boolean(normalizedDato[field])
              : false;
        } else {
          acc[field] =
            normalizedDato[field] !== undefined ? normalizedDato[field] : "";
        }
      } else {
        acc[field] =
          field === "imagen"
            ? null
            : field === "tendencia"
              ? false
              : "";
      }
      return acc;
    }, {});
    if (param === "productos") {
      initialState.talles =
        normalizedDato?.talles.map((t) => ({
          talle_id: t.talle.id || t.talle,
          stock: t.stock || 0,
          cantidad_vendida: t.cantidad_vendida || 0,
          id: t.id || null,
        })) || [];
    }
    return initialState;
  };

  const [formData, setFormData] = useState(getInitialState());
  const [errors, setErrors] = useState({});
  const [openTallesModal, setOpenTallesModal] = useState(false);

  useEffect(() => {
    if (editable && dato) {
      setFormData(getInitialState());
    }
  }, [dato, editable, param]);

  const validateField = (name, value) => {
    let error = "";
    switch (param) {
      case "productos":
        if (name === "nombre" && !value)
          error = "El nombre del producto es obligatorio (máx. 100 caracteres).";
        if (name === "descripcion" && !value)
          error = "La descripción es obligatoria.";
        if (name === "precio") {
          if (!value) error = "El precio es obligatorio.";
          else if (isNaN(value) || parseFloat(value) <= 0)
            error = "El precio debe ser un número mayor a 0.";
        }
        if (name === "categoria" && !value) error = "Seleccione una categoría.";
        if (
          name === "puntos_club_acumulables" &&
          value &&
          (isNaN(value) || parseInt(value) < 0)
        )
          error = "Los puntos deben ser un número entero positivo.";
        break;
      case "vendedores":
      case "usuarios":
        if (name === "usuario" && !value) error = "Seleccione un usuario.";
        if (name === "usuario") {
          const usuario = usuarios?.find((user) => user.id === parseInt(value));
          const yaExisteUsuario = usuario && (vendedores?.find((v) => v.usuario === usuario.id) || null) || null;
          if (yaExisteUsuario && !editable) {
            error = "El usuario ya existe en la base de datos";
          }
        }
        if (name === "nombre") {
          if (!value)
            error = "El nombre completo (nombre y apellido) es obligatorio.";
          else if (value.split(" ").length < 2)
            error = "Ingrese al menos nombre y apellido.";
        }
        if (name === "dni") {
          const dniExiste = vendedores?.find((ven) => ven.dni === value) || null;
          if (!value) error = "El DNI es obligatorio.";
          else if (!/^\d{8}$/.test(value))
            error = "El DNI debe tener exactamente 8 dígitos numéricos.";
          if (dniExiste && !editable)
            error = "El DNI ya pertenece a un usuario existente";
        }
        if (name === "telefono" && value && !/^\d{6,20}$/.test(value))
          error = "El teléfono debe tener entre 6 y 20 dígitos.";
        if (name === "domicilio" && !value)
          error = "El domicilio es obligatorio.";
        if (name === "rol" && isSuperAdmin && !value)
          error = "Seleccione un rol.";
        break;
      case "temas":
        if (name === "titulo" && !value) error = "El título es obligatorio.";
        if (
          [
            "primario1", "primario2", "secundario1", "secundario2",
            "terciario", "cuarto", "fondo1", "fondo2", "fondo3", "fondo4", "fondo5"
          ].includes(name) && !value
        ) {
          error = `Seleccione un valor para ${name}.`;
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          imagen: "Seleccione un archivo de imagen válido (ej. JPG, PNG).",
        }));
      } else if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          imagen: "La imagen no debe superar los 5MB.",
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          imagen: file,
          imagenPreview: URL.createObjectURL(file),
        }));
        setErrors((prev) => ({ ...prev, imagen: "" }));
      }
    }
  };

  const handleTalleChange = (index, field, value) => {
    const newTalles = [...formData.talles];
    newTalles[index] = { ...newTalles[index], [field]: value };
    setFormData((prev) => ({ ...prev, talles: newTalles }));

    let error = "";
    if (field === "talle_id" && !value) {
      error = "Seleccione un talle.";
      setErrorMessage("Seleccione un talle.")
    } else if (field === "stock" && (isNaN(value) || parseInt(value) < 0)) {
      error = "El stock debe ser un número positivo.";
    }
    setErrors((prev) => ({ ...prev, [`talle_${index}_${field}`]: error }));
  };

  const addTalle = () => {
    setFormData((prev) => ({
      ...prev,
      talles: [...prev.talles, { talle_id: "", stock: 0, cantidad_vendida: 0 }],
    }));
  };

  const removeTalle = (index) => {
    const newTalles = formData.talles.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, talles: newTalles }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`talle_${index}_talle_id`];
      delete newErrors[`talle_${index}_stock`];
      return newErrors;
    });
  };

  const selectInput = (field, label, lista) => {
    const selectedItem = lista?.find((item) => item.id === formData[field]);
    return (
      <div key={field} className="label-input">
        <label>{label}: </label>
        <select name={field} value={formData[field] || ""} onChange={handleChange}>
          <option value="">Seleccionar {label}</option>
          {lista?.map((elemento) => (
            <option key={elemento.id} value={elemento.id}>
              {label === "Usuario" ? elemento.email : elemento.nombre}
            </option>
          ))}
        </select>
        {selectedItem && field.includes("color") && (
          <div
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: selectedItem.codigo_hex,
              border: "1px solid #000",
              marginLeft: "10px",
              display: "inline-block",
            }}
          />
        )}
        {errors[field] && <p className="text-danger">{errors[field]}</p>}
      </div>
    );
  };

  const validateForm = () => {
    const newErrors = {};
    fields[param].forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    if (param === "productos" && formData.talles.length > 0) {
      formData.talles.forEach((talle, index) => {
        if (!talle.talle_id)
          newErrors[`talle_${index}_talle_id`] = "Seleccione un talle.";
        setErrorMessage("Complete todos los talles")
        setFailedSuccess(true)
        if (isNaN(talle.stock) || parseInt(talle.stock) < 0)
          newErrors[`talle_${index}_stock`] = "El stock debe ser un número positivo.";
      });
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    if (param === "productos" && formData.talles.length === 0) {
      setErrorMessage("Los talles no pueden estar vacíos.");
      setFailedSuccess(true);
      setIsLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    if (param === "temas") {
      formDataToSend.append("titulo", formData.titulo || "");
      formDataToSend.append("primario1", formData.primario1 || "");
      formDataToSend.append("primario2", formData.primario2 || "");
      formDataToSend.append("secundario1", formData.secundario1 || "");
      formDataToSend.append("secundario2", formData.secundario2 || "");
      formDataToSend.append("terciario", formData.terciario || "");
      formDataToSend.append("cuarto", formData.cuarto || "");
      formDataToSend.append("fondo1", formData.fondo1 || "");
      formDataToSend.append("fondo2", formData.fondo2 || "");
      formDataToSend.append("fondo3", formData.fondo3 || "");
      formDataToSend.append("fondo4", formData.fondo4 || "");
      formDataToSend.append("fondo5", formData.fondo5 || "");
      formDataToSend.append("activo", "false");
      formDataToSend.append("fuente_primaria", formData.fuente_primaria_fuente && formData.fuente_primaria_color ? "" : "");
      formDataToSend.append("fuente_secundaria", formData.fuente_secundaria_fuente && formData.fuente_secundaria_color ? "" : "");
      formDataToSend.append("fuente_terciaria", formData.fuente_terciaria_fuente && formData.fuente_terciaria_color ? "" : "");
    } else {
      Object.keys(formData).forEach((key) => {
        if (key === "imagenPreview" || key === "talles") return;
        if (["precio", "stock", "porcentaje", "puntos_club_acumulables"].includes(key)) {
          formDataToSend.append(key, parseFloat(formData[key]) || 0);
        } else if (key === "imagen") {
          if (formData[key] instanceof File) {
            formDataToSend.append(key, formData[key]);
          }
        } else if (key === "nombre" && param === "usuarios") {
          formDataToSend.append("nombre_apellido", formData[key] || "");
        } else if (key === "barrio" && param === "usuarios") {
          const barrioValue = formData[key] ? parseInt(formData[key]) : "";
          if (barrioValue) formDataToSend.append("barrio", barrioValue);
        } else {
          formDataToSend.append(key, formData[key] || "");
        }
      });
    }

    if (param === "productos" && formData.talles.length > 0) {
      const tallesData = formData.talles.map((t) => ({
        talle_id: parseInt(t.talle_id),
        stock: parseInt(t.stock) || 0,
      }));
      formDataToSend.append("talles", JSON.stringify(tallesData));
    }

    const fuentesData = param === "temas" ? {
      fuente_primaria: {
        fuente: formData.fuente_primaria_fuente || null,
        color: formData.fuente_primaria_color || null,
      },
      fuente_secundaria: {
        fuente: formData.fuente_secundaria_fuente || null,
        color: formData.fuente_secundaria_color || null,
      },
      fuente_terciaria: {
        fuente: formData.fuente_terciaria_fuente || null,
        color: formData.fuente_terciaria_color || null,
      },
    } : {};

    try {
      let urlBase = `${param}/`;
      if (param === "usuarios") urlBase = `perfilesUsuarios/`;
      let itemId;

      if (editable) {
        const response = await API.patch(
          `${urlBase}${dato.id}/`,
          formDataToSend,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        itemId = dato.id;
      } else {
        const response = await API.post(urlBase, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        itemId = response.data.id;
      }

      if (param === "productos" && formData.talles.length > 0) {
        const tallesData = {
          talles: formData.talles.map((t) => ({
            talle_id: parseInt(t.talle_id),
            stock: parseInt(t.stock) || 0,
          })),
        };
        await API.post(`${param}/${itemId}/gestionar-talles/`, tallesData, {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (param === "temas") {
        for (const [fuenteCampo, { fuente, color }] of Object.entries(fuentesData)) {
          if (fuente || color) {
            await API.patch(
              `temas/${itemId}/actualizar-fuente/`,
              { fuente_campo: fuenteCampo, fuente_id: fuente, color_id: color },
              { headers: { "Content-Type": "application/json" } }
            );
          }
        }
      }

      setShowSuccess(true);
    } catch (error) {
      const errorData = error.response?.data || {};
      console.error("Error del backend:", errorData);
      const errorMessages = Object.entries(errorData)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(" ") : value}`)
        .join("\n");
      setErrorMessage(errorMessages || "Error al enviar datos.");
      setFailedSuccess(true);

    } finally {
      setIsLoading(false);
    }
  };

  const renderInputs = () => {
    const inputs = fields[param].map((field) => {
      if (field === "imagen") {
        return (
          <div key={field} className="label-input-image">
            <label>Imagen:</label>
            <input
              type="file"
              name={field}
              onChange={handleFileChange}
              accept="image/*"
            />
            {formData.imagenPreview && (
              <img src={formData.imagenPreview} alt="Vista previa" />
            )}
            {errors[field] && <p className="text-danger">{errors[field]}</p>}
          </div>
        );
      }

      if (field === "fecha_expiracion") {
        return (
          <div key={field} className="label-input">
            <label>Fecha de Expiración:</label>
            <input
              type="datetime-local"
              name={field}
              value={formData[field] || ""}
              onChange={handleChange}
            />
            {errors[field] && <p className="text-danger">{errors[field]}</p>}
          </div>
        );
      }

      if (field === "categoria")
        return selectInput(field, "Categorías", categorias);
      if (field === "barrio")
        return selectInput(field, "Barrio", barrios);
      if (field === "rol" && param === "vendedores" && isSuperAdmin)
        return selectInput(field, "Rol", roles);
      if (field === "usuario")
        return selectInput(field, "Usuario", usuarios);

      if (
        [
          "primario1", "primario2", "secundario1", "secundario2", "terciario",
          "cuarto", "fondo1", "fondo2", "fondo3", "fondo4", "fondo5"
        ].includes(field)
      ) {
        return selectInput(field, field.charAt(0).toUpperCase() + field.slice(1), colores);
      }

      if (field === "fuente_primaria_fuente")
        return selectInput(field, "Fuente Primaria", fuentes);
      if (field === "fuente_primaria_color")
        return selectInput(field, "Color Fuente Primaria", colores);
      if (field === "fuente_secundaria_fuente")
        return selectInput(field, "Fuente Secundaria", fuentes);
      if (field === "fuente_secundaria_color")
        return selectInput(field, "Color Fuente Secundaria", colores);
      if (field === "fuente_terciaria_fuente")
        return selectInput(field, "Fuente Terciaria", fuentes);
      if (field === "fuente_terciaria_color")
        return selectInput(field, "Color Fuente Terciaria", colores);

      if (field === "tendencia") {
        return (
          <div key={field} className="label-input">
            <label>Tendencia:</label>
            <input
              type="checkbox"
              name={field}
              checked={formData[field] || false}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, [field]: e.target.checked }))
              }
            />
            {errors[field] && <p className="text-danger">{errors[field]}</p>}
          </div>
        );
      }

      return (
        <div key={field} className="label-input">
          <label>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
          {field === "descripcion" || field === "contenido" || field === "domicilio" ? (
            <textarea
              name={field}
              value={formData[field] || ""}
              onChange={handleChange}
              placeholder="Escribe..."
              required={field === "domicilio" && param === "usuarios"}
            />
          ) : (
            <input
              type={
                ["porcentaje", "precio", "stock", "puntos_club_acumulables", "valor_en_puntos", "descuentos"].includes(field)
                  ? "number"
                  : "text"
              }
              name={field}
              value={formData[field] || ""}
              onChange={handleChange}
              required={["dni", "domicilio"].includes(field) && param === "usuarios"}
            />
          )}
          {errors[field] && <p className="text-danger">{errors[field]}</p>}
        </div>
      );
    });

    if (param === "productos") {
      inputs.push(
        <div key="talles" className="label-input">
          <button
            type="button"
            className="btn btn-info"
            onClick={() => setOpenTallesModal(true)}
          >
            Gestionar Talles
          </button>
        </div>
      );
    }

    return inputs;
  };

  return (
    <div className="registration-form">
      {failedSuccess && (
        <FailedNotification
          message={errorMessage}
          onClose={() => setFailedSuccess(false)}
        />
      )}
      {isLoading && <LoadingSpinner />}
      {showSuccess && (
        <SuccessNotification
          message={`${param.slice(0, param.length)} ${editable ? "actualizado" : "creado"} con éxito`}
          onClose={() => {
            setShowSuccess(false);
            recargarDatos();
            recargarDatosAdmin();
            cerrarModal(true);
          }}
        />
      )}
      <div className="d-flex">
        <h2>
          {editable
            ? `Editar ${param.slice(0, param.length)}`
            : param === "contenidosWeb"
              ? "Añadir Contenido Web"
              : `Añadir ${param.slice(0, param.length)}`}
        </h2>
        <button onClick={() => cerrarModal(false)} className="btn-closed">
          X
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        {renderInputs()}

        <button className="btn-add" type="submit">
          {editable ? "ACTUALIZAR" : "AÑADIR"}
        </button>
      </form>
      {openTallesModal && param === "productos" && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Gestionar Talles</h5>
              </div>
              <div className="modal-body">
                {formData.talles.length > 0 ? (
                  formData.talles.map((talle, index) => (
                    <div key={index} className="talle-row">
                      <div className="talle-inputs">
                        <div className="input-group">
                          <label>Talle:</label>
                          <select
                            value={talle.talle_id}
                            onChange={(e) =>
                              handleTalleChange(index, "talle_id", e.target.value)
                            }
                            required
                          >
                            <option value="">Seleccionar Talle</option>
                            {talles?.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.nombre}
                              </option>
                            ))}
                          </select>
                          {errors[`talle_${index}_talle_id`] && (
                            <p className="text-danger">{errors[`talle_${index}_talle_id`]}</p>
                          )}
                        </div>
                        <div className="input-group">
                          <label>Stock:</label>
                          <input
                            type="number"
                            value={talle.stock}
                            onChange={(e) =>
                              handleTalleChange(index, "stock", e.target.value)
                            }
                            placeholder="Stock"
                            min="0"
                          />
                          {errors[`talle_${index}_stock`] && (
                            <p className="text-danger">{errors[`talle_${index}_stock`]}</p>
                          )}
                        </div>
                        <div className="input-group">
                          <label>Cantidad vendida:</label>
                          <input
                            type="number"
                            value={talle.cantidad_vendida}
                            disabled
                            placeholder="Vendidos"
                          />
                        </div>
                      </div>
                      <div className="talle-actions">
                        <button
                          type="button"
                          onClick={() => removeTalle(index)}
                          className="btn btn-danger btn-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-talles">No hay talles añadidos aún.</p>
                )}
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={addTalle}
                    className="btn btn-primary btn-sm"
                  >
                    Añadir Talle
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenTallesModal(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};