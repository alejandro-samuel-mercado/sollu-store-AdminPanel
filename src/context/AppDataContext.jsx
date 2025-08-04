import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../Apis/API";
import { useLoading } from "../context/LoadingContext";
import { LoadingSpinner } from "../components/LoadingSpinner";

const AppDataContext = createContext();

export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
  const [colores, setColores] = useState([]);
  const [fuentesAplicar, setFuentesAplicar] = useState([]);
  const [temaActivo, setTemaActivo] = useState(null);
  const [diseñoActivo, setDiseñoActivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [temaAplicado, setTemaAplicado] = useState(false);
  const { setLoading, loading } = useLoading();

  const fetchHomeData = async () => {
    try {
      const { data } = await API.get("fuentes-aplicar/");
      setFuentesAplicar(data || []);

      setCargando(true);
      setTemaAplicado(false);
      const { data: responseData } = await API.get("home-data/");
      console.log("Datos recibidos de home-data:", responseData);
      setColores(responseData.colores || []);
      setDiseñoActivo(responseData.diseño_activo || null);
      setTemaActivo(responseData.tema_activo || null);
    } catch (error) {
      console.error("Error fetching home data:", error);
      setColores([]);
      setFuentesAplicar([]);
      setDiseñoActivo(null);
      setTemaActivo(null);
    } finally {
      setCargando(false);
    }
  };
  const aplicarTema = (tema) => {
    if (tema && colores && colores.length > 0 && fuentesAplicar.length > 0) {
      Object.keys(tema).forEach((key) => {
        if (
          key !== "id" &&
          key !== "titulo" &&
          key !== "activo" &&
          !key.endsWith("_id")
        ) {
          const color = colores.find((c) => c.id === tema[key]);
          const colorHex = color?.codigo_hex || "#000000";
          const variableName = key.replace("_id", "");
          document.documentElement.style.setProperty(
            `--${variableName}`,
            colorHex
          );
        }
      });

      // Aplicar fuentes y sus colores
      const fuentes = [
        {
          campoId: "fuente_primaria_id",
          varFuente: "fuentePrimaria",
          varColor: "colorFuentePrimaria",
        },
        {
          campoId: "fuente_secundaria_id",
          varFuente: "fuenteSecundaria",
          varColor: "colorFuenteSecundaria",
        },
        {
          campoId: "fuente_terciaria_id",
          varFuente: "fuenteTerciaria",
          varColor: "colorFuenteTerciaria",
        },
      ];

      fuentes.forEach(({ campoId, varFuente, varColor }) => {
        const fuenteId = tema[campoId];
        const fuenteData = fuentesAplicar.find((f) => f.id === fuenteId);
        if (fuenteData && fuenteData.fuente && fuenteData.color) {
          const fuenteNombre = fuenteData.fuente.nombre || "Arial";
          const colorHex = fuenteData.color.codigo_hex || "#000000";
          document.documentElement.style.setProperty(
            `--${varFuente}`,
            `"${fuenteNombre}"`
          );
          document.documentElement.style.setProperty(`--${varColor}`, colorHex);
        } else {
          console.warn(
            `No se encontró fuente para ${campoId}: ${fuenteId}, usando valores por defecto`
          );
          document.documentElement.style.setProperty(
            `--${varFuente}`,
            `"Arial"`
          );
          document.documentElement.style.setProperty(
            `--${varColor}`,
            "#000000"
          );
        }
      });

      setTemaAplicado(true);
    } else {
      console.warn("No se pudo aplicar el tema: faltan colores o fuentes");
      setTemaAplicado(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (
        !colores.length &&
        !fuentesAplicar.length &&
        !diseñoActivo &&
        !temaActivo
      ) {
        await fetchHomeData();
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (temaActivo && colores.length > 0 && fuentesAplicar.length > 0) {
      aplicarTema(temaActivo);
    }
  }, [temaActivo, colores, fuentesAplicar]);

  useEffect(() => {
    if (!temaAplicado || cargando) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [temaAplicado, cargando, setLoading]);

  if (loading) {
    return (
      <AppDataContext.Provider value={{
        colores,
        fuentesAplicar,
        temaActivo,
        diseñoActivo,
        cargando,
      }}>
        <div className="loading-screen">
          <LoadingSpinner />
        </div>
      </AppDataContext.Provider>
    )
  } else {
    return (
      <AppDataContext.Provider
        value={{
          colores,
          fuentesAplicar,
          temaActivo,
          diseñoActivo,
          cargando,
        }}
      >
        <div
          className={
            diseñoActivo?.nombre === "Diseño 1" ? "design-one" : "design-two"
          }
        >
          {children}
        </div>
      </AppDataContext.Provider>
    );
  }
};
