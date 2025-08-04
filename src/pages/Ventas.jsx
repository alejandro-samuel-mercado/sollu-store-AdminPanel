import React, { useState, useEffect, useRef } from "react";
import API from "../Apis/API";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaSort,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaCalendarAlt,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDatosAdmin } from "../context/DatosAdminContext";
import { useDatosPublic } from "../context/DatosPublicContext";
import { VentaCard } from "../components/VentaCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useActions } from "../context/ActionsContext";

const VerVentas = () => {
  const { ventas, recargarDatosAdmin, perfilesUsuarios, usuarios, cargando } =
    useDatosAdmin();
  const { handleEstadoChange } = useActions()
  const { barrios, envio, vendedores, estadosDeVenta } = useDatosPublic();
  const [filteredVentas, setFilteredVentas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("id");
  const [sortField, setSortField] = useState("fecha_venta");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterEstado, setFilterEstado] = useState("");
  const [estados, setEstados] = useState();
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateFilterField, setDateFilterField] = useState("fecha_venta");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  useEffect(() => {
    setEstados(estadosDeVenta);
  }, [estadosDeVenta, estados]);

  const handleEstadoVentaChange = (idVenta, nuevoEstado) => {
    handleEstadoChange(idVenta, nuevoEstado)
    recargarDatosAdmin();
    setFilteredVentas([...ventas]);
  }

  useEffect(() => {
    let filtered = [...ventas];

    if (filterEstado) {
      filtered = filtered.filter(
        (venta) => obtenerSegunId(venta.estado, "estados") === filterEstado
      );
    }

    if (searchTerm) {
      filtered = filtered.filter((venta) => {
        if (searchField === "id") {
          return venta.id.toString().includes(searchTerm);
        } else if (searchField === "comprador_nombre") {
          const comprador = perfilesUsuarios.find(
            (p) => p.usuario === (venta.comprador?.id || venta.comprador)
          );
          return (
            comprador?.nombre_apellido ||
            venta.comprador_sin_cuenta ||
            ""
          )
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        } else if (searchField === "comprador_dni") {
          const comprador = perfilesUsuarios.find(
            (p) => p.usuario === (venta.comprador?.id || venta.comprador)
          );
          return (comprador?.dni || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        } else if (searchField === "comprador_email") {
          const usuario = obtenerUsuario(venta.comprador, "usuarios");
          return (usuario?.mail || usuario?.email || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        } else if (searchField === "vendedor_nombre") {
          const vendedor = vendedores.find(
            (v) => v.id === (venta.vendedor?.id || venta.vendedor)
          );
          return (vendedor?.nombre || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        } else if (searchField === "vendedor_dni") {
          const vendedor = vendedores.find(
            (v) => v.id === (venta.vendedor?.id || venta.vendedor)
          );
          return (vendedor?.dni || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        } else if (searchField === "vendedor_email") {
          const vendedor = vendedores.find(
            (v) => v.id === (venta.vendedor?.id || venta.vendedor)
          );
          const usuarioId = vendedor?.usuario;
          const usuario = usuarioId
            ? usuarios.find((u) => u.id === usuarioId)
            : null;
          return (usuario?.mail || usuario?.email || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        }
        return false;
      });
    }

    if (selectedDate) {
      filtered = filtered.filter((venta) => {
        const dateToCompare =
          dateFilterField === "fecha_venta"
            ? new Date(venta.fecha_venta)
            : new Date(venta.fecha_entrega || "1970-01-01");
        return (
          dateToCompare.getFullYear() === selectedDate.getFullYear() &&
          dateToCompare.getMonth() === selectedDate.getMonth() &&
          dateToCompare.getDate() === selectedDate.getDate()
        );
      });
    }

    // Ordenar
    filtered.sort((a, b) => {
      const fieldA =
        sortField === "fecha_venta"
          ? new Date(a.fecha_venta)
          : new Date(a.fecha_entrega || "1970-01-01");
      const fieldB =
        sortField === "fecha_venta"
          ? new Date(b.fecha_venta)
          : new Date(b.fecha_entrega || "1970-01-01");
      return sortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA;
    });

    setFilteredVentas(filtered);
  }, [
    searchTerm,
    searchField,
    filterEstado,
    sortField,
    sortOrder,
    selectedDate,
    dateFilterField,
    ventas,
    perfilesUsuarios,
    vendedores,
    usuarios,
  ]);

  const obtenerUsuario = (id, tipo) => {
    if (!id || (!perfilesUsuarios && !vendedores && !usuarios)) return null;
    if (tipo === "compradores" && perfilesUsuarios) {
      const usuarioId = typeof id === "object" ? id?.id || id : id;
      const usuario = perfilesUsuarios.find((p) => p.usuario === usuarioId);
      return usuario || { nombre_apellido: "Desconocido", mail: "", email: "" };
    } else if (tipo === "vendedores" && vendedores) {
      const vendedorId = typeof id === "object" ? id?.id || id : id;
      const vendedor = vendedores.find((v) => v.id === vendedorId);
      return vendedor || { nombre: "Desconocido", usuario: null };
    } else if (tipo === "usuarios" && usuarios) {
      const usuarioId = typeof id === "object" ? id?.id || id : id;
      const usuario = usuarios.find((u) => u.id === usuarioId);
      return usuario || { username: "Desconocido", mail: "", email: "" };
    }
    return null;
  };

  const obtenerSegunId = (id, valor) => {
    if ((!id && id !== 0) || (!barrios && !envio && !estados))
      return "No especificado";
    if (valor === "barrio" && barrios) {
      const encontrado = barrios.find((barrio) => barrio.id === id);
      return encontrado?.nombre || "No especificado";
    } else if (valor === "envio" && envio) {
      const encontrado = envio.find((env) => env.id === id);
      return encontrado?.nombre || "No especificado";
    } else if (valor === "estados" && estados) {
      const encontrado = estados.find((estado) => estado.id === id);
      return encontrado?.estado || "No especificado";
    }
    return "No especificado";
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
    setShowDatePicker(false);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVentas = filteredVentas.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredVentas.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="ver-ventas-container">
      {cargando && <LoadingSpinner />}
      <motion.div
        className="hero-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      ></motion.div>

      <motion.div
        className="filters-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="search"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="search-select"
          >
            <option value="id">ID de Venta</option>
            <option value="comprador_nombre">Nombre del Comprador</option>
            <option value="comprador_dni">DNI del Comprador</option>
            <option value="comprador_email">Email del Comprador</option>
            <option value="vendedor_nombre">Nombre del Vendedor</option>
            <option value="vendedor_dni">DNI del Vendedor</option>
            <option value="vendedor_email">Email del Vendedor</option>
          </select>
        </div>

        <div className="sort-container">
          <FaSort className="sort-icon" />
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="sort-select"
          >
            <option value="fecha_venta">Fecha de Venta</option>
            <option value="fecha_entrega">Fecha de Entrega</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="sort-select"
          >
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </select>
        </div>

        <div className="date-filter-container">
          <button
            onClick={() => setShowDatePicker((prev) => !prev)}
            className="date-filter-button"
          >
            <FaCalendarAlt className="calendar-icon" />
            {selectedDate
              ? `Filtrando por: ${selectedDate.toLocaleDateString()}`
              : "Filtrar por Fecha"}
          </button>

          {showDatePicker && (
            <div className="date-picker-wrapper">
              <select
                value={dateFilterField}
                onChange={(e) => setDateFilterField(e.target.value)}
                className="date-field-select"
              >
                <option value="fecha_venta">Fecha de Venta</option>
                <option value="fecha_entrega">Fecha de Entrega</option>
              </select>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  setShowDatePicker(false);
                }}
                dateFormat="yyyy-MM-dd"
                placeholderText="Selecciona una fecha"
                className="date-picker"
              />
              <button onClick={clearDateFilter} className="clear-date-button">
                Limpiar
              </button>
            </div>
          )}
        </div>

        <div className="filter-container">
          <FaFilter className="filter-icon" />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los Estados</option>
            {estados?.map((estado) => (
              <option key={estado.id} value={estado.estado}>
                {estado.estado}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Lista de Ventas */}
      <motion.div
        className={`ventas-list ${currentVentas.length <= 2 ? "few-cards" : ""
          }`}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
          },
        }}
        initial="hidden"
        animate="visible"
      >
        {currentVentas.map((venta) => (
          <VentaCard
            key={venta.id}
            venta={venta}
            estados={estados}
            handleEstadoVentaChange={handleEstadoVentaChange}
            obtenerUsuario={obtenerUsuario}
            obtenerSegunId={obtenerSegunId}
          />
        ))}
      </motion.div>

      {/* Controles de Paginación */}
      {filteredVentas.length > itemsPerPage && (
        <div className="pagination-controls">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            <FaArrowLeft />
          </button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            <FaArrowRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default VerVentas;
