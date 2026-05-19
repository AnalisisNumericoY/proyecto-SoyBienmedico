const PDFDocument = require('pdfkit');

/**
 * Template profesional para PDF de Riesgo Cardiovascular
 * Diseño mejorado con estructura, colores y tipografía profesional
 */

/**
 * Genera PDF de Riesgo Cardiovascular con diseño profesional
 * @param {Object} evaluacion - Datos de la evaluación
 * @param {Object} pacienteData - Datos del paciente
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
const generarPDFRiesgoCardiovascular = async (evaluacion, pacienteData) => {
  return new Promise((resolve, reject) => {
    try {
      // Crear documento PDF
      const doc = new PDFDocument({ 
        margin: 50, 
        size: 'LETTER',
        bufferPages: true
      });

      // Array para almacenar chunks del PDF
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ==================== HEADER CON GRADIENTE ====================
      agregarHeader(doc);

      // ==================== INFORMACIÓN DEL PACIENTE ====================
      agregarInfoPaciente(doc, pacienteData, evaluacion);

      // ==================== RESULTADO PRINCIPAL ====================
      agregarResultadoPrincipal(doc, evaluacion.resultado);

      // ==================== PARÁMETROS EVALUADOS ====================
      agregarParametrosEvaluados(doc, evaluacion.datos_entrada);

      // ==================== INDICADORES ADICIONALES ====================
      agregarIndicadoresAdicionales(doc, evaluacion);

      // ==================== RECOMENDACIONES ====================
      agregarRecomendaciones(doc, evaluacion.resultado);

      // ==================== FOOTER ====================
      agregarFooter(doc, evaluacion);

      // Finalizar documento
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Agregar header con branding SoyBienmedico
 */
const agregarHeader = (doc) => {
  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  
  // Rectángulo de gradiente simulado (PDFKit no soporta gradientes nativos)
  // Usamos rectángulos con opacidad decreciente
  const headerHeight = 80;
  const colorPrimario = '#667eea';
  const colorSecundario = '#764ba2';
  
  // Fondo principal
  doc.rect(0, 0, pageWidth, headerHeight)
    .fill(colorPrimario);
  
  // Texto del header
  doc.fillColor('#FFFFFF')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('SOYBIENMÉDICO', margin, 20, { align: 'left' });
  
  doc.fontSize(12)
    .font('Helvetica')
    .text('Plataforma de Telemedicina y Evaluaciones Médicas', margin, 50);
  
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
 * Agregar información del paciente
 */
const agregarInfoPaciente = (doc, pacienteData, evaluacion) => {
  const margin = doc.page.margins.left;
  const pageWidth = doc.page.width;
  
  // Título sección
  doc.fontSize(16)
    .font('Helvetica-Bold')
    .fillColor('#667eea')
    .text('📊 EVALUACIÓN DE RIESGO CARDIOVASCULAR', margin, doc.y);
  
  doc.fontSize(11)
    .font('Helvetica')
    .fillColor('#666666')
    .text('Método PAHO/OPS - Organización Panamericana de la Salud', margin, doc.y + 5);
  
  doc.moveDown(1);
  
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
 * Agregar resultado principal con box de color
 */
const agregarResultadoPrincipal = (doc, resultado) => {
  const margin = doc.page.margins.left;
  const pageWidth = doc.page.width;
  
  // Determinar color según categoría
  let bgColor, textColor, emoji;
  switch (resultado.categoria) {
    case 'BAJO':
      bgColor = '#28a745';
      textColor = '#FFFFFF';
      emoji = '✓';
      break;
    case 'MODERADO':
      bgColor = '#ffc107';
      textColor = '#000000';
      emoji = '⚠';
      break;
    case 'ALTO':
      bgColor = '#dc3545';
      textColor = '#FFFFFF';
      emoji = '⚠';
      break;
    default:
      bgColor = '#6c757d';
      textColor = '#FFFFFF';
      emoji = '?';
  }
  
  // Box principal de resultado
  const boxY = doc.y;
  const boxHeight = 90;
  
  doc.rect(margin, boxY, pageWidth - (margin * 2), boxHeight)
    .fillAndStroke(bgColor, '#000000')
    .lineWidth(2);
  
  // Emoji/icono
  doc.fillColor(textColor)
    .fontSize(32)
    .text(emoji, margin + 20, boxY + 15);
  
  // Texto principal
  doc.fontSize(22)
    .font('Helvetica-Bold')
    .text(`RIESGO ${resultado.categoria}`, margin + 70, boxY + 15, {
      width: pageWidth - (margin * 2) - 90,
      align: 'left'
    });
  
  doc.fontSize(14)
    .font('Helvetica')
    .text(resultado.riesgo, margin + 70, boxY + 45);
  
  doc.fontSize(12)
    .text(`Puntuación PAHO: ${resultado.puntuacion} puntos`, margin + 70, boxY + 67);
  
  doc.fillColor('#000000');
  doc.y = boxY + boxHeight + 20;
};

/**
 * Agregar parámetros evaluados en tabla estructurada
 */
const agregarParametrosEvaluados = (doc, datos) => {
  const margin = doc.page.margins.left;
  
  // Título
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#667eea')
    .text('PARÁMETROS EVALUADOS', margin, doc.y);
  
  doc.moveDown(0.5);
  
  // Tabla de parámetros
  const tableTop = doc.y;
  const colWidth = 180;
  
  doc.fontSize(10).font('Helvetica').fillColor('#000000');
  
  // Fila: Edad y Sexo
  dibujarFila(doc, 'Edad', `${datos.edad} años`, tableTop);
  dibujarFila(doc, 'Sexo', datos.sexo === 'masculino' ? 'Masculino' : 'Femenino', tableTop, colWidth);
  
  doc.y = tableTop + 20;
  
  // Fila: Presión Arterial
  dibujarFila(doc, 'Presión Arterial', `${obtenerValor(datos.sistolica)}/${obtenerValor(datos.diastolica)} mmHg`, doc.y);
  
  if (datos.frecuencia) {
    dibujarFila(doc, 'Frecuencia Cardíaca', `${obtenerValor(datos.frecuencia)} lpm`, doc.y, colWidth);
  }
  
  doc.y += 20;
  
  // Factores de riesgo
  const factores = [];
  if (datos.fumador) factores.push('✓ Fumador');
  if (datos.diabetes) factores.push('✓ Diabetes');
  if (datos.hipertension) factores.push('✓ Hipertensión');
  if (datos.cardiovascular) factores.push('✓ Antecedente Cardiovascular');
  if (datos.renal) factores.push('✓ Enfermedad Renal');
  
  if (factores.length > 0) {
    doc.fontSize(11).font('Helvetica-Bold').text('Factores de Riesgo:', margin, doc.y);
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    factores.forEach(factor => {
      doc.fillColor('#dc3545').text(factor, margin + 10, doc.y);
      doc.moveDown(0.3);
    });
  } else {
    doc.fontSize(10).fillColor('#28a745').text('✓ Sin factores de riesgo identificados', margin, doc.y);
    doc.moveDown(0.5);
  }
  
  doc.fillColor('#000000');
  doc.moveDown(1);
};

/**
 * Helper: Dibujar fila de parámetro
 */
const dibujarFila = (doc, label, value, y, offsetX = 0) => {
  const margin = doc.page.margins.left;
  doc.fillColor('#666666').text(label + ':', margin + offsetX, y);
  doc.fillColor('#000000').text(value, margin + offsetX + 90, y);
};

/**
 * Helper: Obtener valor de campo (puede ser objeto con fuente o valor directo)
 */
const obtenerValor = (campo) => {
  if (typeof campo === 'object' && campo.valor) {
    return campo.valor;
  }
  return campo;
};

/**
 * Agregar indicadores adicionales (IMC, clasificación PA, etc.)
 */
const agregarIndicadoresAdicionales = (doc, evaluacion) => {
  const margin = doc.page.margins.left;
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#667eea')
    .text('INDICADORES ADICIONALES', margin, doc.y);
  
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').fillColor('#000000');
  
  // Clasificación de Presión Arterial
  if (evaluacion.resultado.clasificacionPA) {
    doc.text(`• Clasificación PA: ${evaluacion.resultado.clasificacionPA}`, margin + 10, doc.y);
    doc.moveDown(0.3);
  }
  
  doc.moveDown(1);
};

/**
 * Agregar recomendaciones personalizadas
 */
const agregarRecomendaciones = (doc, resultado) => {
  const margin = doc.page.margins.left;
  
  if (!resultado.recomendaciones || resultado.recomendaciones.length === 0) {
    return;
  }
  
  // Verificar si hay espacio, sino nueva página
  if (doc.y > 600) {
    doc.addPage();
    agregarHeader(doc);
  }
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#667eea')
    .text('💡 RECOMENDACIONES PERSONALIZADAS', margin, doc.y);
  
  doc.moveDown(0.5);
  
  doc.fontSize(10).font('Helvetica').fillColor('#000000');
  
  resultado.recomendaciones.forEach((rec, index) => {
    const bullet = `${index + 1}.`;
    doc.text(bullet, margin, doc.y, { continued: true, width: 20 });
    doc.text(rec, margin + 25, doc.y, { width: doc.page.width - (margin * 2) - 25 });
    doc.moveDown(0.4);
  });
};

/**
 * Agregar footer con información del sistema
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

module.exports = {
  generarPDFRiesgoCardiovascular
};
