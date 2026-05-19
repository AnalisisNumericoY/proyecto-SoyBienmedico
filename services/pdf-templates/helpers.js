/**
 * Funciones auxiliares reutilizables para generación de PDFs
 * Compartidas entre diferentes templates de evaluaciones
 */
const path = require('path');
const fs = require('fs');

/**
 * Agregar header con branding SoyBienmedico
 * @param {PDFDocument} doc - Documento PDF
 * @param {string} titulo - Título de la evaluación
 */
const agregarHeader = (doc, titulo = 'EVALUACIÓN MÉDICA') => {
  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  
  // Rectángulo de header
  const headerHeight = 80;
  const colorPrimario = '#667eea';
  
  // Fondo principal
  doc.rect(0, 0, pageWidth, headerHeight)
    .fill(colorPrimario);
  
  // Logo a la izquierda
  try {
    const logoPath = path.join(__dirname, '../../public/membrete.jpg');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, margin + 5, 15, { 
        width: 120,
        height: 50
      });
    }
  } catch (error) {
    console.warn('⚠️ Logo no cargado en header:', error.message);
  }
  
  // Texto del header (a la derecha del logo)
  const textoX = margin + 135; // Después del logo
  
  doc.fillColor('#FFFFFF')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('SOYBIENMÉDICO', textoX, 20, { align: 'left' });
  
  doc.fontSize(12)
    .font('Helvetica')
    .text('Plataforma de Telemedicina y Evaluaciones Médicas', textoX, 50);
  
  // Línea separadora
  doc.moveTo(margin, headerHeight + 5)
    .lineTo(pageWidth - margin, headerHeight + 5)
    .strokeColor('#667eea')
    .lineWidth(2)
    .stroke();
  
  doc.y = headerHeight + 25;
  
  // Reset color
  doc.fillColor('#000000');
};

/**
 * Agregar información del paciente en box
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} pacienteData - Datos del paciente
 * @param {Object} evaluacion - Datos de la evaluación
 */
const agregarInfoPaciente = (doc, pacienteData, evaluacion) => {
  const margin = doc.page.margins.left;
  const pageWidth = doc.page.width;
  
  doc.moveDown(0.5);
  
  // Box con datos del paciente
  const boxY = doc.y;
  const boxHeight = 80;
  
  // Fondo gris claro
  doc.rect(margin, boxY, pageWidth - (margin * 2), boxHeight)
    .fillAndStroke('#F8F9FA', '#E9ECEF')
    .lineWidth(1);
  
  // Título "DATOS DEL PACIENTE"
  doc.fillColor('#000000')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('DATOS DEL PACIENTE', margin + 15, boxY + 12);
  
  doc.y = boxY + 32;
  
  // Calcular edad
  let edad = '';
  if (pacienteData.fecha_nacimiento) {
    const fechaNac = new Date(pacienteData.fecha_nacimiento);
    const hoy = new Date();
    let edadAnios = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edadAnios--;
    }
    edad = `${edadAnios} años`;
  }
  
  // Datos en dos columnas
  doc.fontSize(10).font('Helvetica');
  
  const col1X = margin + 15;
  const col2X = margin + 280;
  const rowHeight = 15;
  let currentY = doc.y;
  
  // Columna 1
  doc.fillColor('#666666').text('Nombre:', col1X, currentY);
  doc.fillColor('#000000').text(`${pacienteData.nombre} ${pacienteData.apellidos}`, col1X + 80, currentY);
  
  currentY += rowHeight;
  doc.fillColor('#666666').text('Documento:', col1X, currentY);
  doc.fillColor('#000000').text(`${pacienteData.tipo_documento} ${pacienteData.numero_documento}`, col1X + 80, currentY);
  
  // Columna 2
  currentY = doc.y - rowHeight;
  if (edad) {
    doc.fillColor('#666666').text('Edad:', col2X, currentY);
    doc.fillColor('#000000').text(edad, col2X + 50, currentY);
  }
  
  currentY += rowHeight;
  if (pacienteData.sexo) {
    const sexoTexto = pacienteData.sexo === 'hombre' ? 'Masculino' : 
                      pacienteData.sexo === 'mujer' ? 'Femenino' : pacienteData.sexo;
    doc.fillColor('#666666').text('Sexo:', col2X, currentY);
    doc.fillColor('#000000').text(sexoTexto, col2X + 50, currentY);
  }
  
  doc.y = boxY + boxHeight + 15;
  
  // Fecha de evaluación
  doc.fontSize(9)
    .fillColor('#999999')
    .text(`Fecha de evaluación: ${new Date(evaluacion.fecha).toLocaleString('es-CO')}`, margin, doc.y, { align: 'right' });
  
  doc.fillColor('#000000');
  doc.moveDown(1.5);
};

/**
 * Agregar footer con información del sistema
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} evaluacion - Datos de la evaluación
 */
const agregarFooter = (doc, evaluacion) => {
  const margin = doc.page.margins.left;
  const pageHeight = doc.page.height;
  const pageWidth = doc.page.width;
  
  // Posición fija en el footer
  const footerY = pageHeight - 70;
  
  // Línea separadora
  doc.moveTo(margin, footerY)
    .lineTo(pageWidth - margin, footerY)
    .strokeColor('#E9ECEF')
    .lineWidth(1)
    .stroke();
  
  // Texto del footer
  doc.fontSize(8)
    .font('Helvetica')
    .fillColor('#999999')
    .text(
      `Documento generado el ${new Date().toLocaleString('es-CO')} | Sistema SoyBienmedico v${evaluacion.version_algoritmo || '1.0'}`,
      margin,
      footerY + 10,
      { align: 'center', width: pageWidth - (margin * 2) }
    );
  
  doc.text(
    `ID de evaluación: ${evaluacion.id}`,
    margin,
    footerY + 25,
    { align: 'center', width: pageWidth - (margin * 2) }
    );
  
  doc.fillColor('#000000');
};

/**
 * Dibujar una card con título, puntuación y barra de progreso
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} opciones - Opciones de la card
 */
const dibujarCard = (doc, opciones) => {
  const {
    x,
    y,
    ancho,
    alto,
    color,
    emoji,
    titulo,
    puntuacion,
    maxPuntuacion,
    nivel,
    descripcion
  } = opciones;
  
  const margin = doc.page.margins.left;
  
  // Fondo de la card con bordes redondeados
  doc.roundedRect(x, y, ancho, alto, 10)
    .fillAndStroke(color, '#000000')
    .lineWidth(2);
  
  // Emoji/ícono
  doc.fillColor('#FFFFFF')
    .fontSize(28)
    .text(emoji, x + 15, y + 15);
  
  // Título
  doc.fontSize(16)
    .font('Helvetica-Bold')
    .text(titulo, x + 60, y + 20, {
      width: ancho - 80,
      align: 'left'
    });
  
  // Puntuación
  doc.fontSize(32)
    .font('Helvetica-Bold')
    .text(`${puntuacion}`, x + 20, y + 55);
  
  doc.fontSize(14)
    .font('Helvetica')
    .text(`/ ${maxPuntuacion}`, x + puntuacion.toString().length * 20 + 25, y + 70);
  
  doc.fontSize(11)
    .text('puntos', x + 20, y + 90);
  
  // Barra de progreso
  const porcentaje = (puntuacion / maxPuntuacion) * 100;
  const anchoBarraTotal = ancho - 40;
  const anchoBarraLlena = (anchoBarraTotal * porcentaje) / 100;
  
  // Fondo barra (blanco semi-transparente)
  doc.rect(x + 20, y + alto - 50, anchoBarraTotal, 15)
    .fillColor('#FFFFFF')
    .fillOpacity(0.3)
    .fill()
    .fillOpacity(1);
  
  // Progreso (blanco sólido)
  doc.rect(x + 20, y + alto - 50, anchoBarraLlena, 15)
    .fillColor('#FFFFFF')
    .fill();
  
  // Nivel en texto
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#FFFFFF')
    .text(nivel.toUpperCase(), x + 20, y + alto - 30);
  
  // Reset
  doc.fillColor('#000000');
};

/**
 * Dibujar sección de recomendaciones con bullets
 * @param {PDFDocument} doc - Documento PDF
 * @param {Array} recomendaciones - Array de recomendaciones agrupadas
 */
const agregarRecomendaciones = (doc, recomendaciones) => {
  const margin = doc.page.margins.left;
  
  if (!recomendaciones || recomendaciones.length === 0) {
    return;
  }
  
  // Verificar si hay espacio, sino nueva página
  if (doc.y > 600) {
    doc.addPage();
    agregarHeader(doc, '');
  }
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#667eea')
    .text('💡 RECOMENDACIONES PERSONALIZADAS', margin, doc.y);
  
  doc.moveDown(0.8);
  
  recomendaciones.forEach((grupo) => {
    // Título del grupo (categoría)
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(`${grupo.categoria} (${grupo.nivel}):`, margin, doc.y);
    
    doc.moveDown(0.3);
    
    // Items de recomendaciones
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#333333');
    
    grupo.items.forEach((item) => {
      doc.text('•', margin + 10, doc.y, { continued: true, width: 15 });
      doc.text(item, margin + 25, doc.y, { width: doc.page.width - (margin * 2) - 25 });
      doc.moveDown(0.3);
    });
    
    doc.moveDown(0.5);
  });
  
  doc.fillColor('#000000');
};

module.exports = {
  agregarHeader,
  agregarInfoPaciente,
  agregarFooter,
  dibujarCard,
  agregarRecomendaciones
};
