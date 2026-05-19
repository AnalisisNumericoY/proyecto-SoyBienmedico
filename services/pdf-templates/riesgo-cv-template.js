const PDFDocument = require('pdfkit');
const helpers = require('./helpers');

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
      helpers.agregarHeader(doc, 'EVALUACIÓN DE RIESGO CARDIOVASCULAR');

      // ==================== INFORMACIÓN DEL PACIENTE ====================
      helpers.agregarInfoPaciente(doc, pacienteData, evaluacion);

      // Título de evaluación específico
      const margin = doc.page.margins.left;
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#667eea')
        .text('📊 EVALUACIÓN DE RIESGO CARDIOVASCULAR', margin, doc.y);
      
      doc.fontSize(11)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Método PAHO/OPS - Organización Panamericana de la Salud', margin, doc.y + 5);
      
      doc.moveDown(1.5);

      // ==================== RESULTADO PRINCIPAL ====================
      agregarResultadoPrincipal(doc, evaluacion.resultado);

      // ==================== PARÁMETROS EVALUADOS ====================
      agregarParametrosEvaluados(doc, evaluacion.datos_entrada);

      // ==================== INDICADORES ADICIONALES ====================
      agregarIndicadoresAdicionales(doc, evaluacion);

      // ==================== RECOMENDACIONES ====================
      if (evaluacion.resultado.recomendaciones && evaluacion.resultado.recomendaciones.length > 0) {
        agregarRecomendacionesRiesgoCV(doc, evaluacion.resultado.recomendaciones);
      }

      // ==================== FOOTER ====================
      helpers.agregarFooter(doc, evaluacion);

      // Finalizar documento
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
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
 * Agregar recomendaciones para Riesgo CV (formato simple)
 */
const agregarRecomendacionesRiesgoCV = (doc, recomendaciones) => {
  const margin = doc.page.margins.left;
  
  if (!recomendaciones || recomendaciones.length === 0) {
    return;
  }
  
  // Verificar si hay espacio, sino nueva página
  if (doc.y > 600) {
    doc.addPage();
    helpers.agregarHeader(doc, '');
  }
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#667eea')
    .text('💡 RECOMENDACIONES PERSONALIZADAS', margin, doc.y);
  
  doc.moveDown(0.5);
  
  doc.fontSize(10).font('Helvetica').fillColor('#000000');
  
  recomendaciones.forEach((rec, index) => {
    const bullet = `${index + 1}.`;
    doc.text(bullet, margin, doc.y, { continued: true, width: 20 });
    doc.text(rec, margin + 25, doc.y, { width: doc.page.width - (margin * 2) - 25 });
    doc.moveDown(0.4);
  });
  
  doc.fillColor('#000000');
};

module.exports = {
  generarPDFRiesgoCardiovascular
};
