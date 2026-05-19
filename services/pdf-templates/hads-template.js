const PDFDocument = require('pdfkit');
const helpers = require('./helpers');

/**
 * Template profesional para PDF de Evaluación HADS
 * (Hospital Anxiety and Depression Scale + Burnout)
 * Diseño con 3 cards visuales color-coded
 */

/**
 * Genera PDF de HADS con diseño profesional
 * @param {Object} evaluacion - Datos de la evaluación
 * @param {Object} pacienteData - Datos del paciente
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
const generarPDFHADS = async (evaluacion, pacienteData) => {
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

      // Extraer datos del resultado
      const resultado = evaluacion.resultado;

      // ==================== HEADER CON LOGO Y AZUL ====================
      helpers.agregarHeader(doc);

      // ==================== INFORMACIÓN DEL PACIENTE ====================
      helpers.agregarInfoPaciente(doc, pacienteData, evaluacion);

      // ==================== TÍTULO DE EVALUACIÓN ====================
      const margin = doc.page.margins.left;
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#667eea')
        .text('📋 EVALUACIÓN HADS + BURNOUT', margin, doc.y);
      
      doc.fontSize(11)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Hospital Anxiety and Depression Scale + Escala de Burnout', margin, doc.y + 5);
      
      doc.fillColor('#000000');
      doc.moveDown(2);

      // ==================== 3 CARDS PRINCIPALES ====================
      agregarCardsHADS(doc, resultado);

      // ==================== RECOMENDACIONES ====================
      if (resultado.recomendaciones && resultado.recomendaciones.length > 0) {
        helpers.agregarRecomendaciones(doc, resultado.recomendaciones);
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
 * Agregar las 3 cards principales (Ansiedad, Depresión, Burnout)
 */
const agregarCardsHADS = (doc, resultado) => {
  const margin = doc.page.margins.left;
  const pageWidth = doc.page.width;
  const cardAncho = pageWidth - (margin * 2);
  const cardAlto = 140;
  const espacioEntreCards = 20;
  
  let currentY = doc.y;

  // ==================== CARD 1: ANSIEDAD ====================
  const ansiedadData = resultado.ansiedad;
  const colorAnsiedad = obtenerColorPorNivel(ansiedadData.clase);
  const emojiAnsiedad = obtenerEmojiPorNivel(ansiedadData.clase);
  
  helpers.dibujarCard(doc, {
    x: margin,
    y: currentY,
    ancho: cardAncho,
    alto: cardAlto,
    color: colorAnsiedad,
    emoji: emojiAnsiedad,
    titulo: 'ANSIEDAD',
    puntuacion: ansiedadData.puntuacion,
    maxPuntuacion: ansiedadData.maxPuntuacion || 21,
    nivel: ansiedadData.categoria,
    descripcion: ansiedadData.descripcion
  });
  
  // Descripción debajo de la card
  currentY += cardAlto + 5;
  doc.y = currentY;
  doc.fontSize(9)
    .font('Helvetica-Oblique')
    .fillColor('#666666')
    .text(ansiedadData.descripcion, margin, currentY, { 
      width: cardAncho, 
      align: 'center' 
    });
  
  currentY += 25;
  doc.y = currentY;

  // ==================== CARD 2: DEPRESIÓN ====================
  const depresionData = resultado.depresion;
  const colorDepresion = obtenerColorPorNivel(depresionData.clase);
  const emojiDepresion = obtenerEmojiPorNivel(depresionData.clase);
  
  helpers.dibujarCard(doc, {
    x: margin,
    y: currentY,
    ancho: cardAncho,
    alto: cardAlto,
    color: colorDepresion,
    emoji: emojiDepresion,
    titulo: 'DEPRESIÓN',
    puntuacion: depresionData.puntuacion,
    maxPuntuacion: depresionData.maxPuntuacion || 21,
    nivel: depresionData.categoria,
    descripcion: depresionData.descripcion
  });
  
  // Descripción debajo de la card
  currentY += cardAlto + 5;
  doc.y = currentY;
  doc.fontSize(9)
    .font('Helvetica-Oblique')
    .fillColor('#666666')
    .text(depresionData.descripcion, margin, currentY, { 
      width: cardAncho, 
      align: 'center' 
    });
  
  currentY += 25;
  doc.y = currentY;

  // Verificar si necesitamos nueva página para Burnout
  if (currentY > 550) {
    doc.addPage();
    helpers.agregarHeader(doc);
    currentY = doc.y + 20;
  }

  // ==================== CARD 3: BURNOUT ====================
  const burnoutData = resultado.burnout;
  const colorBurnout = obtenerColorPorNivel(burnoutData.clase);
  const emojiBurnout = obtenerEmojiPorNivel(burnoutData.clase);
  
  helpers.dibujarCard(doc, {
    x: margin,
    y: currentY,
    ancho: cardAncho,
    alto: cardAlto,
    color: colorBurnout,
    emoji: emojiBurnout,
    titulo: 'BURNOUT',
    puntuacion: burnoutData.puntuacionFormateada || burnoutData.puntuacion,
    maxPuntuacion: burnoutData.maxPuntuacion || 4,
    nivel: burnoutData.categoria,
    descripcion: burnoutData.descripcion
  });
  
  // Descripción debajo de la card
  currentY += cardAlto + 5;
  doc.y = currentY;
  doc.fontSize(9)
    .font('Helvetica-Oblique')
    .fillColor('#666666')
    .text(burnoutData.descripcion, margin, currentY, { 
      width: cardAncho, 
      align: 'center' 
    });
  
  doc.fillColor('#000000');
  doc.y = currentY + 35;
};

/**
 * Obtener color según nivel/clase de resultado
 * @param {string} clase - normal, leve, moderado, grave
 * @returns {string} - Código de color hex
 */
const obtenerColorPorNivel = (clase) => {
  switch (clase) {
    case 'normal':
      return '#28a745'; // Verde
    case 'leve':
      return '#17a2b8'; // Cyan/Azul claro
    case 'moderado':
      return '#ffc107'; // Amarillo
    case 'grave':
      return '#dc3545'; // Rojo
    default:
      return '#6c757d'; // Gris
  }
};

/**
 * Obtener emoji según nivel/clase de resultado
 * @param {string} clase - normal, leve, moderado, grave
 * @returns {string} - Emoji Unicode
 */
const obtenerEmojiPorNivel = (clase) => {
  switch (clase) {
    case 'normal':
      return '😊'; // Feliz
    case 'leve':
      return '🙂'; // Sonrisa leve
    case 'moderado':
      return '😐'; // Neutral/preocupado
    case 'grave':
      return '😰'; // Preocupado/ansioso
    default:
      return '🔍'; // Lupa
  }
};

module.exports = {
  generarPDFHADS
};
