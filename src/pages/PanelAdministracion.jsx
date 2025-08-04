import React, { useState, useEffect } from "react";
import { useDatosPublic } from "../context/DatosPublicContext";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { useDatosAdmin } from "../context/DatosAdminContext";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useLocation } from "react-router-dom";


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AdminPanel = () => {
  const location = useLocation()
  const { productos, barrios, cargando: cargandoPublic } = useDatosPublic();
  const { ventas, usuarios, ventasXVendedor, cargando: cargandoAdmin } = useDatosAdmin();

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const [cantidadEnviosAdomicilio, setCantidadEnviosADomicilio] = useState(0);
  const [cantidadRetiroEnLocal, setCantidadRetiroEnLocal] = useState(0);
  const [usuariosConMasCompras, setUsuariosConMasCompras] = useState([]);
  const [usuariosConMayorRecaudacion, setUsuariosConMayorRecaudacion] = useState([]);
  const [recaudacionUltimoMes, setRecaudacionUltimoMes] = useState(0);
  const [barrioConMasVentas, setBarrioConMasVentas] = useState("");

  // Paso 1: Ordenar los productos por cantidad vendida y tomar los primeros 10
  const prevProductosMasVendidos = [...productos]
    .sort((a, b) => {
      const cantVendidaA = a.talles.reduce(
        (acc, talle) => acc + talle.cantidad_vendida,
        0
      );
      const cantVendidaB = b.talles.reduce(
        (acc, talle) => acc + talle.cantidad_vendida,
        0
      );
      return cantVendidaB - cantVendidaA;
    })
    .slice(0, 10);


  const productosMasVendidos = prevProductosMasVendidos.map((prod) => {
    const cantidadVendidaTotal = prod.talles.reduce(
      (acc, talle) => acc + talle.cantidad_vendida,
      0
    );
    return { nombre: prod.nombre, cantidad: cantidadVendidaTotal };
  });


  const mesActual = new Date().getMonth() + 1;

  const obtenerBarrioConMasVentas = () => {
    if (!Array.isArray(ventas)) return "Sin datos";
    const frecuencia = ventas.reduce((acc, venta) => {
      if (venta.barrio) {
        acc[venta.barrio] = (acc[venta.barrio] || 0) + 1;
      }
      return acc;
    }, {});

    if (Object.keys(frecuencia).length === 0) return "Sin datos";
    const elementoMasFrecuente = Object.keys(frecuencia).reduce((a, b) =>
      frecuencia[a] > frecuencia[b] ? a : b
    );
    const barrio = barrios?.find(
      (barr) => parseInt(barr.id) === parseInt(elementoMasFrecuente)
    );
    return barrio?.nombre || "Sin datos";
  };

  useEffect(() => {
    if (!Array.isArray(ventas)) return;

    const ventasUltimoMes = ventas.filter(
      (venta) => new Date(venta.fecha_venta).getMonth() + 1 === mesActual
    );
    const recaudacion = ventasUltimoMes.reduce(
      (acumulador, venta) => acumulador + (parseFloat(venta.precio_total) || 0),
      0
    );
    setRecaudacionUltimoMes(recaudacion);
    setBarrioConMasVentas(obtenerBarrioConMasVentas());

    let enviosDomicilio = 0;
    let retirosLocal = 0;
    ventas.forEach((venta) => {
      if (venta.tipo_envio === 1) enviosDomicilio++;
      else retirosLocal++;
    });
    setCantidadEnviosADomicilio(enviosDomicilio);
    setCantidadRetiroEnLocal(retirosLocal);

    const comprasPorUsuario = {};
    const totalPorUsuario = {};

    ventas.forEach((venta) => {
      const detalles = Array.isArray(venta.detalles) ? venta.detalles : [];
      const comprador = venta.comprador;
      const cantidadAcumulada = detalles.reduce(
        (acc, detalle) => acc + (detalle.cantidad || 0),
        0
      );
      const precioTotalAcumulado = parseFloat(venta.precio_total) || 0;

      if (comprasPorUsuario[comprador]) {
        comprasPorUsuario[comprador] += cantidadAcumulada;
      } else {
        comprasPorUsuario[comprador] = cantidadAcumulada;
      }

      if (totalPorUsuario[comprador]) {
        totalPorUsuario[comprador] += precioTotalAcumulado;
      } else {
        totalPorUsuario[comprador] = precioTotalAcumulado;
      }
    });

    const usuariosConCompras = Object.keys(comprasPorUsuario)
      .map((usuario) => ({
        usuario,
        cantidadComprada: comprasPorUsuario[usuario],
      }))
      .sort((a, b) => b.cantidadComprada - a.cantidadComprada)
      .slice(0, 10);

    const usuariosConRecaudacion = Object.keys(totalPorUsuario)
      .map((usuario) => ({
        usuario,
        totalRecaudado: totalPorUsuario[usuario],
      }))
      .sort((a, b) => b.totalRecaudado - a.totalRecaudado)
      .slice(0, 10);

    setUsuariosConMasCompras(usuariosConCompras);
    setUsuariosConMayorRecaudacion(usuariosConRecaudacion);
  }, [ventas, barrios, usuarios, mesActual, location]);

  const datosProductosMasVendidos = {
    labels: productosMasVendidos.map((producto) => producto.nombre),
    datasets: [
      {
        label: "Cantidad Vendida",
        data: productosMasVendidos.map(
          (producto) => producto.cantidad || 0
        ),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const datosVentasPorBarrio = {
    labels: barrios.map((barrio) => barrio.nombre),
    datasets: [
      {
        label: "Ventas por Barrio",
        data: barrios.map(
          (barrio) =>
            ventas.filter((venta) => venta.barrio === barrio.id).length
        ),
        backgroundColor: barrios.map(
          () =>
            `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
              Math.random() * 255
            )}, ${Math.floor(Math.random() * 255)}, 0.6)`
        ),
        borderColor: barrios.map(
          () =>
            `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
              Math.random() * 255
            )}, ${Math.floor(Math.random() * 255)}, 1)`
        ),
        borderWidth: 1,
      },
    ],
  };

  const datosTendenciaVentas = {
    labels: meses,
    datasets: [
      {
        label: "Ventas Mensuales",
        data: meses.map(
          (mes, index) =>
            ventas.filter(
              (venta) => new Date(venta.fecha_venta).getMonth() === index
            ).length
        ),
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 12,
          },
          padding: 10,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: { size: 12 },
        bodyFont: { size: 10 },
      },
      title: {
        display: true,
        font: { size: 14 },
        padding: 10,
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 10,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
  };

  return (
    <div className="dashboard-wrapper">
      {cargandoAdmin && cargandoPublic && <LoadingSpinner />}

      <div className="dashboard-container">
        <h1 className="dashboard-title">Dashboard de Ventas</h1>

        {/* Tarjetas de Resumen */}
        <div className="dashboard-stats">
          <div className="stat-card primary-card">
            <h5>Total Ventas Último Mes</h5>
            <p>${recaudacionUltimoMes.toFixed(2)}</p>
          </div>
          <div className="stat-card success-card">
            <h5>Barrio con Más Ventas</h5>
            <p>{barrioConMasVentas || "Sin datos"}</p>
          </div>
          <div className="stat-card warning-card">
            <h5>Envíos a Domicilio</h5>
            <p>{cantidadEnviosAdomicilio}</p>
          </div>
          <div className="stat-card danger-card">
            <h5>Retiros en Local</h5>
            <p>{cantidadRetiroEnLocal}</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="dashboard-charts">
          <div className="chart-card">
            <h5>Productos Más Vendidos</h5>
            <div className="chart-wrapper">
              <Bar
                data={datosProductosMasVendidos}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                    },
                  },
                }}
              />
            </div>
          </div>
          <div className="chart-card tendencia-card">
            <h5>Tendencia de Ventas</h5>
            <div className="chart-wrapper">
              <Line
                data={datosTendenciaVentas}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,

                    },
                  },
                }}
              />
            </div>
          </div>

        </div>
        <div className="chart-card barrio-card">
          <h5>Ventas por Barrio</h5>
          <div className="chart-wrapper chart-barrio">
            <Pie
              data={datosVentasPorBarrio}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,

                  },
                },
              }}
            />
          </div>
        </div>
        {/* Tablas */}
        <div className="dashboard-tables">
          <div className="table-card">
            <h5>Usuarios con Más Compras</h5>
            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Productos Comprados</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosConMasCompras.map((usuario) => {
                    const usuarioEncontrado = usuarios.find(
                      (user) => user.id === parseInt(usuario.usuario)
                    );
                    return (
                      <tr key={usuario.usuario} className="table-row">
                        <td>{usuarioEncontrado?.username || "Desconocido"}</td>
                        <td>{usuarioEncontrado?.email || "N/A"}</td>
                        <td>{usuario.cantidadComprada}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="table-card">
            <h5>Usuarios con Mayor Recaudación</h5>
            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Total Comprado</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosConMayorRecaudacion.map((usuario) => {
                    const usuarioEncontrado = usuarios.find(
                      (user) => user.id === parseInt(usuario.usuario)
                    );
                    return (
                      <tr key={usuario.usuario} className="table-row">
                        <td>{usuarioEncontrado?.username || "Desconocido"}</td>
                        <td>{usuarioEncontrado?.email || "N/A"}</td>
                        <td>${usuario.totalRecaudado.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="table-card">
            <h5>Ventas por Vendedor</h5>
            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>DNI</th>
                    <th>Ventas Realizadas</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasXVendedor.map((vendedor, index) => (
                    <tr key={vendedor.nombre || index} className="table-row">
                      <td>{vendedor.nombre || "Anónimo"}</td>
                      <td>{vendedor.dni || "-"}</td>
                      <td>{vendedor.numero_ventas || 0}</td>
                      <td>${(vendedor.total_recaudado || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;