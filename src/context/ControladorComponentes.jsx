import { createContext, useContext, useState, useEffect } from "react";
import API from "../Apis/API";
import { useDatosAdmin } from "./DatosAdminContext";
import { useLocation } from "react-router-dom";

const ComponentesContext = createContext();
export const useDatosPublicComponetes = () => useContext(ComponentesContext);

export const ComponentesProvider = ({ children }) => {
  const [componentes, setComponentes] = useState({});
  const [puntosClub, setPuntosClub] = useState({});
  const { colores } = useDatosAdmin();
  const [diseños, setDiseños] = useState([]);
  const [fuentes, setFuentes] = useState([]);
  const [diseñoActivo, setDiseñoActivo] = useState(null);
  const [temas, setTemas] = useState([]);
  const [temaActivo, setTemaActivo] = useState(null);

  const location = useLocation();

  useEffect(() => {
    if (temaActivo && colores && colores.length > 0) {
      aplicarTema(temaActivo);
    }
  }, [temaActivo, colores]);

  const fetchComponentes = async () => {
    try {
      const { data } = await API.get("componentes/1/");
      setComponentes(data);
    } catch (error) {
      console.error("Error al obtener componentes:", error);
    }
  };

  const updateComponentes = async (nombreComponente, estado) => {
    try {
      const formData = new FormData();
      formData.append(nombreComponente, estado);

      const { data } = await API.patch("componentes/1/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setComponentes((prev) => ({
        ...prev,
        [nombreComponente]: data[nombreComponente],
      }));
    } catch (error) {
      console.error("Error al actualizar componentes:", error);
    }
  };

  const fetchPuntosClub = async () => {
    try {
      const { data } = await API.get("puntos-club/1/");
      setPuntosClub(data);
    } catch (error) {
      console.error("Error al obtener el estado de puntos club:", error);
    }
  };

  const toggleActivoPuntosClub = async (activo) => {
    try {
      const updatedPuntosClub = { activo: activo };
      await API.patch(`puntos-club/1/`, updatedPuntosClub);
      fetchPuntosClub();
    } catch (error) {
      console.error("Error updating PuntosClub:", error);
    }
  };

  const fetchFuentes = async () => {
    try {
      const { data } = await API.get("fuentes/");
      setFuentes(data);
    } catch (error) {
      setFuentes([]);
      console.error("Error al obtener fuentes:", error);
    }
  };

  const fetchDiseños = async () => {
    try {
      const { data } = await API.get("diseños/");
      setDiseños(data);
    } catch (error) {
      setDiseños([]);
      console.error("Error al obtener diseños:", error);
    }
  };

  const fetchTemas = async () => {
    try {
      const { data } = await API.get("temas/");
      setTemas(data);
    } catch (error) {
      setTemas([]);
      console.error("Error al obtener colores:", error);
    }
  };

  const fetchDiseñoActivo = async () => {
    try {
      const { data } = await API.get("diseños/activo/");
      setDiseñoActivo(data);
    } catch (error) {
      console.error("Error al obtener diseño activo:", error);
    }
  };
  const activarDiseño = async (id) => {
    try {
      const { data } = await API.post(`diseños/${id}/activar/`, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDiseñoActivo(data);
    } catch (error) {
      console.error("Error al activar diseño:", error);
    }
  };

  const crearTema = async (TemaNuevo) => {
    try {
      const { data } = await API.post("temas/", TemaNuevo);
      setTemas((prev) => [...prev, data]);
    } catch (error) {
      console.error("Error al crear color:", error);
    }
  };

  const eliminarTema = async (id) => {
    try {
      await API.delete(`temas/${id}/`, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTemas((prev) => prev.filter((color) => color.id !== id));
    } catch (error) {
      console.error("Error al eliminar color:", error);
    }
  };

  const fetchTemaActivo = async () => {
    try {
      const { data } = await API.get("temas/activo/");
      setTemaActivo(data);
      aplicarTema(data);
    } catch (error) {
      console.error("Error al obtener tema activo:", error);
    }
  };
  const aplicarTema = (tema) => {
    if (tema && colores && colores.length > 0) {
      Object.keys(tema).forEach((key) => {
        if (key !== "id" && key !== "titulo" && key !== "activo") {
          const color = colores.find((c) => c.id === tema[key]);
          if (color) {
            document.documentElement.style.setProperty(
              `--${key}`,
              color.codigo_hex
            );
          } else {
            console.warn(
              `No se encontró un color para el key '${key}' con id ${tema[key]} en colores:`,
              colores
            );
          }
        }
      });
    } else {
      console.warn("Datos incompletos para aplicar tema:", { tema, colores });
    }
  };

  const activarTema = async (id) => {
    try {
      const { data } = await API.post(`temas/${id}/activar/`, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTemaActivo(data);
      aplicarTema(data);
    } catch (error) {
      console.error("Error al activar tema:", error);
    }
  };

  useEffect(() => {
    fetchDiseños();
    fetchDiseñoActivo();
    fetchTemas();
    fetchFuentes();
    fetchTemaActivo();
    fetchPuntosClub();
    fetchComponentes();
  }, [location]);

  return (
    <ComponentesContext.Provider
      value={{
        componentes,
        updateComponentes,
        diseños,
        diseñoActivo,
        activarDiseño,
        temas,
        fuentes,
        crearTema,
        eliminarTema,
        temaActivo,
        activarTema,
        puntosClub,
        toggleActivoPuntosClub,
      }}
    >
      {children}
    </ComponentesContext.Provider>
  );
};
