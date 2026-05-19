const express = require('express');
const router = express.Router();
const { validateJWT } = require('../middleware/auth');
const { generateRiesgoCardiovascularPDF } = require('../controllers/riesgo-cv-pdf');

/**
 * Rutas internas de la API PDF
 * Requieren autenticación JWT del servidor principal
 */

// ==================== RIESGO CARDIOVASCULAR ====================
/**
 * @route   POST /api/internal/pdf/riesgo-cardiovascular
 * @desc    Generar PDF de evaluación de Riesgo Cardiovascular
 * @access  Private (JWT required)
 */
router.post('/pdf/riesgo-cardiovascular', validateJWT, generateRiesgoCardiovascularPDF);

// ==================== HADS (próximamente) ====================
/**
 * @route   POST /api/internal/pdf/hads
 * @desc    Generar PDF de evaluación HADS
 * @access  Private (JWT required)
 */
router.post('/pdf/hads', validateJWT, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Endpoint HADS en desarrollo',
    code: 'NOT_IMPLEMENTED'
  });
});

// ==================== HISTORIA CLÍNICA (próximamente) ====================
/**
 * @route   POST /api/internal/pdf/historia-clinica
 * @desc    Generar PDF de Historia Clínica
 * @access  Private (JWT required)
 */
router.post('/pdf/historia-clinica', validateJWT, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Endpoint Historia Clínica en desarrollo',
    code: 'NOT_IMPLEMENTED'
  });
});

module.exports = router;
