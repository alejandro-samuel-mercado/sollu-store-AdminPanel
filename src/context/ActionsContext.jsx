import React, { createContext, useContext } from "react";
import API from "../Apis/API";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ActionsContext = createContext();

export const useActions = () => useContext(ActionsContext);


export const ActionsProvider = ({ children }) => {

  const generarPDF = async (ventaId, datosCompra, totalPuntos) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 8;
      let yPosition = margin;

      // Encabezado: Información de la Empresa
      doc.setFillColor(220, 220, 220);
      doc.rect(0, 0, pageWidth, 30, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text("Factura Fiscal", margin, yPosition + 10);
      doc.setFontSize(20);
      doc.text(
        datosCompra?.datosEmpresa.nombre.contenido || "Empresa",
        pageWidth - 70,
        yPosition
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Dirección: ${datosCompra?.datosEmpresa.direccion.contenido || "N/A"}, ${datosCompra?.datosEmpresa.ciudad.contenido || "N/A"
        }, ${datosCompra?.datosEmpresa.pais.contenido || "N/A"}`,
        pageWidth - 120,
        yPosition + 15
      );
      doc.text(
        `Tel: ${datosCompra?.datosEmpresa.telefono.contenido || "N/A"} | Email: ${datosCompra?.datosEmpresa.email.contenido || "N/A"
        }`,
        pageWidth - 120,
        yPosition + 20
      );
      yPosition += 35;

      // Datos del Documento
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Factura N°: ${ventaId.toString().padStart(8, "0")}`,
        margin,
        yPosition
      );
      doc.text(
        `Fecha de Emisión: ${new Date().toLocaleDateString("es-ES")}`,
        pageWidth - margin - 60,
        yPosition
      );
      yPosition += 10;

      // Datos del Cliente
      doc.setFont("helvetica", "bold");
      doc.text("Cliente:", margin, yPosition);
      yPosition += 5;
      doc.setFont("helvetica", "normal");
      doc.text(
        `Nombre: ${datosCompra?.nombre || "Desconocido"}`,
        margin,
        yPosition
      );
      doc.text(
        `Teléfono: ${datosCompra?.telefono || "No disponible"}`,
        margin,
        yPosition + 5
      );
      doc.text(
        `Correo: ${datosCompra?.correo || "No disponible"}`,
        margin,
        yPosition + 10
      );
      doc.text(
        `Dirección: ${datosCompra?.domicilio || "No disponible"}`,
        margin,
        yPosition + 15
      );
      doc.text(
        `Ciudad: ${datosCompra?.cityComprador || "N/A"}`,
        margin,
        yPosition + 20
      );
      doc.text(
        `País/Estado: ${datosCompra?.paisComprador || "N/A"}`,
        margin,
        yPosition + 25
      );
      doc.text(
        `ID Fiscal: ${datosCompra?.idFiscal || "No proporcionado"}`,
        margin,
        yPosition + 30
      );
      yPosition += 35;

      // Detalles de Entrega
      doc.setFont("helvetica", "bold");
      doc.text("Detalles de Entrega:", margin, yPosition);
      yPosition += 5;
      doc.setFont("helvetica", "normal");
      doc.text(
        `Método: ${datosCompra?.finalEnvio || "No disponible"}`,
        margin,
        yPosition
      );
      doc.text(
        `Fecha de Venta: ${datosCompra?.fecha_venta?.split("T")[0] || "No disponible"
        }`,
        margin,
        yPosition + 5
      );
      doc.text(
        `Fecha de Entrega: ${datosCompra?.fecha_entrega?.split("T")[0] || "No disponible"
        }`,
        margin,
        yPosition + 10
      );
      doc.text(
        `Horario: ${datosCompra?.horario_entrega || "No disponible"}`,
        margin,
        yPosition + 15
      );
      yPosition += 20;

      // Línea divisoria
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Tabla de Productos
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Detalles de la Compra", margin, yPosition);
      yPosition += 5;

      const productos =
        datosCompra?.productos?.map((item, index) => [
          index + 1,
          `${item?.nombre || "Desconocido"} (Talle: ${item?.talle || "N/A"})`,
          `$${parseFloat(item?.precio_unitario || 0).toFixed(2)}`,
          item?.cantidad || 1,
          `$${parseFloat(item?.subtotal || 0).toFixed(2)}`,
        ]) || [];

      doc.autoTable({
        startY: yPosition,
        head: [["#", "Descripción", "Precio Unitario", "Cantidad", "Subtotal"]],
        body: productos,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 3, overflow: "linebreak" },
        headStyles: {
          fillColor: [50, 50, 50],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 90 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 30 },
        },
      });

      // Totales e Impuestos
      yPosition = doc.lastAutoTable.finalY + 10;
      const tasaImpuesto = datosCompra?.impuesto / 100 || 0;
      const precioFinalSinImpuesto =
        datosCompra?.precioFinalSinImpuesto || datosCompra?.precioFinal || 0;
      const precioEnvio = datosCompra?.precioEnvio || 0;
      const impuestoValor = precioFinalSinImpuesto * tasaImpuesto;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text(
        `Subtotal: $${parseFloat(precioFinalSinImpuesto).toFixed(2)}`,
        pageWidth - margin - 60,
        yPosition
      );
      doc.text(
        `Envío: $${parseFloat(precioEnvio).toFixed(2)}`,
        pageWidth - margin - 60,
        yPosition + 10
      );
      doc.text(
        `Impuesto (${(tasaImpuesto * 100).toFixed(1)}%): $${impuestoValor.toFixed(
          2
        )}`,
        pageWidth - margin - 60,
        yPosition + 20
      );
      doc.setFont("helvetica", "bold");
      doc.text(
        `Total: $${parseFloat(datosCompra?.precioFinal || 0).toFixed(2)}`,
        pageWidth - margin - 60,
        yPosition + 30
      );
      doc.text(
        `Moneda: ${datosCompra?.datosEmpresa.moneda_local.contenido || "USD"}`,
        pageWidth - margin - 60,
        yPosition + 40
      );
      yPosition += 50;

      // Puntos Acumulados
      doc.setFont("helvetica", "normal");
      doc.text(`Puntos acumulados: ${totalPuntos || 0}`, margin, yPosition);
      yPosition += 10;

      // Pie de Página: Información Legal
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const legalText = [
        "Este documento es un comprobante fiscal válido. Conservar para fines fiscales.",
        `Emitido conforme a las leyes fiscales aplicables en ${datosCompra?.datosEmpresa?.pais || "N/A"
        }.`,
        "Para reclamos, contactar a info@empresa.com dentro de los 30 días posteriores a la emisión.",
      ];
      legalText.forEach((line, index) => {
        doc.text(line, margin, pageHeight - margin - 15 + index * 5, {
          align: "left",
        });
      });

      // Guardar el PDF localmente
      const pdfName = `Factura_${ventaId.toString().padStart(8, "0")}.pdf`;
      doc.save(pdfName);

      const response = await API.post("enviar-pdf/", {
        venta_id: ventaId,
        datos_compra: datosCompra,
        total_puntos: totalPuntos,
      });

      if (response.status === 200) {
        const { pdf_url } = response.data;
        console.log("PDF enviado al backend con éxito:", pdf_url);
        return pdf_url;
      } else {
        throw new Error("Error al enviar el PDF al backend");
      }
    } catch (error) {
      console.error("Error en generarPDF:", error.response?.data || error);
      throw error;
    }
  };

  const deleteItem = async (param, id) => {
    try {
      await API.delete(`/${param}/${id}/`);
    } catch (error) {
      console.error("Error al eliminar: ", error);
    }
  };


  const handleEstadoChange = async (ventaId, newEstadoId) => {
    const payload = { estado: parseInt(newEstadoId) };
    try {
      const response = await API.patch(`ventas/${ventaId}/`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error(
        "Error al actualizar el estado:",
        error.response ? error.response.data : error.message
      );
    }
  };


  return (
    <ActionsContext.Provider value={{ deleteItem, generarPDF, handleEstadoChange }}>
      {children}
    </ActionsContext.Provider>
  );
};