const PDFDocument = require('pdfkit');
const { generarPDFRiesgoCardiovascular } = require('../templates/riesgo-cv-template');

/**
 * Controlador para generar PDF de Riesgo Cardiovascular
 * Recibe datos de evaluación y retorna PDF
 */
const generateRiesgoCardiovascularPDF = async (req, res) => {
  try {
    console.log('📄 Generando PDF de Riesgo Cardiovascular...');
    
    // Validar datos requeridos
    const { paciente, evaluacion, resultado } = req.body;
    
    if (!paciente) {
      return res.status(400).json({
        success: false,
        error: 'Datos del paciente requeridos',
        code: 'MISSING_PACIENTE'
      });
    }
    
    if (!evaluacion) {
      return res.status(400).json({
        success: false,
        error: 'Datos de evaluación requeridos',
        code: 'MISSING_EVALUACION'
      });
    }
    
    if (!resultado) {
      return res.status(400).json({
        success: false,
        error: 'Resultado de evaluación requerido',
        code: 'MISSING_RESULTADO'
      });
    }

    // Construir objeto completo para el template
    const evaluacionCompleta = {
      id: evaluacion.id,
      fecha: evaluacion.fecha || new Date().toISOString(),
      paciente_id: paciente.id,
      datos_entrada: evaluacion.datos_entrada,
      resultado: resultado,
      version_algoritmo: evaluacion.version_algoritmo || '1.0'
    };

    // Generar PDF usando el template
    const pdfBuffer = await generarPDFRiesgoCardiovascular(evaluacionCompleta, paciente);
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="riesgo_cardiovascular_${evaluacion.id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    console.log(`✅ PDF generado exitosamente - Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    
    // Enviar PDF
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('❌ Error generando PDF Riesgo Cardiovascular:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error al generar PDF',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      code: 'PDF_GENERATION_ERROR'
    });
  }
};

module.exports = {
  generateRiesgoCardiovascularPDF
};
