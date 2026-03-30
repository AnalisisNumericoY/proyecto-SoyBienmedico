const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');

// Importar servicios
const sesionService = require('../services/sesion-service');
const capsulaService = require('../services/capsula-service');
const medicionService = require('../services/medicion-service');
const pacienteService = require('../services/paciente-service');
const { isValidDocumento } = require('../utils/validators');

/**
 * Obtiene todas las cápsulas disponibles
 * GET /api/sesiones/capsulas
 */
router.get('/capsulas', verifyToken, async (req, res) => {
  try {
    const capsulas = await capsulaService.getActiveCapsulas();
    
    res.json({
      success: true,
      capsulas
    });

  } catch (error) {
    console.error('Error getting capsulas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

/**
 * Obtiene la sesión activa de una cápsula
 * GET /api/sesiones/activa/:capsulaId
 */
router.get('/activa/:capsulaId', verifyToken, async (req, res) => {
  try {
    const { capsulaId } = req.params;
    
    const sesionActiva = await sesionService.getSesionActivaByCapsula(capsulaId);
    
    if (!sesionActiva) {
      return res.json({
        success: true,
        sesion_activa: false,
        sesion: null
      });
    }

    // Obtener datos del paciente
    const paciente = await pacienteService.getPacienteById(sesionActiva.paciente_id);
    
    res.json({
      success: true,
      sesion_activa: true,
      sesion: {
        ...sesionActiva,
        paciente_nombre: paciente ? `${paciente.nombre} ${paciente.apellidos}` : 'Paciente no encontrado'
      }
    });

  } catch (error) {
    console.error('Error getting sesion activa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

/**
 * Inicia una nueva sesión de medición
 * POST /api/sesiones/iniciar
 */
router.post('/iniciar', verifyToken, async (req, res) => {
  try {
    const { capsula_id, numero_documento, tipo_sesion } = req.body;

    // Validar campos requeridos
    if (!capsula_id || !numero_documento) {
      return res.status(400).json({
        success: false,
        message: 'Cápsula y documento del paciente son requeridos'
      });
    }

    // Validar documento
    if (!isValidDocumento(numero_documento)) {
      return res.status(400).json({
        success: false,
        message: 'Número de documento inválido'
      });
    }

    // Verificar que la cápsula existe y está activa
    const capsula = await capsulaService.getCapsulaById(capsula_id);
    if (!capsula || !capsula.activa) {
      return res.status(404).json({
        success: false,
        message: 'Cápsula no encontrada o inactiva'
      });
    }

    // Verificar que el paciente existe
    const paciente = await pacienteService.getPacienteByDocumento(numero_documento);
    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado. Debe registrarse primero.'
      });
    }

    // Verificar que no hay sesión activa en esta cápsula
    const haySesionActiva = await sesionService.haySesionActiva(capsula_id);
    if (haySesionActiva) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una sesión activa en esta cápsula. Finalícela primero.'
      });
    }

    // Iniciar sesión
    const nuevaSesion = await sesionService.iniciarSesion({
      capsula_id,
      paciente_id: paciente.id,
      numero_documento: paciente.numero_documento,
      tipo_sesion: tipo_sesion || 'clasificacion_riesgos'
    });

    console.log('✅ Sesión de medición iniciada:', nuevaSesion.id);

    res.json({
      success: true,
      message: 'Sesión de medición iniciada correctamente',
      sesion: {
        ...nuevaSesion,
        paciente_nombre: `${paciente.nombre} ${paciente.apellidos}`
      }
    });

  } catch (error) {
    console.error('Error iniciando sesión:', error);
    
    if (error.message.includes('Ya existe una sesión activa')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

/**
 * Finaliza la sesión activa de una cápsula
 * POST /api/sesiones/finalizar
 */
router.post('/finalizar', verifyToken, async (req, res) => {
  try {
    const { capsula_id } = req.body;

    if (!capsula_id) {
      return res.status(400).json({
        success: false,
        message: 'ID de cápsula requerido'
      });
    }

    // Obtener sesión activa
    const sesionActiva = await sesionService.getSesionActivaByCapsula(capsula_id);
    
    if (!sesionActiva) {
      return res.status(404).json({
        success: false,
        message: 'No hay sesión activa en esta cápsula'
      });
    }

    // Finalizar sesión
    const sesionFinalizada = await sesionService.finalizarSesion(sesionActiva.id);

    console.log('✅ Sesión finalizada:', sesionFinalizada.id);

    res.json({
      success: true,
      message: 'Sesión finalizada correctamente',
      sesion: sesionFinalizada,
      mediciones_realizadas: sesionFinalizada.mediciones_count
    });

  } catch (error) {
    console.error('Error finalizando sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

/**
 * Obtiene las últimas mediciones de un paciente
 * GET /api/sesiones/mediciones/:pacienteId
 */
router.get('/mediciones/:pacienteId', verifyToken, async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const limite = parseInt(req.query.limite) || 10;

    const mediciones = await medicionService.getUltimasMedicionesByPaciente(pacienteId, limite);
    
    res.json({
      success: true,
      total: mediciones.length,
      mediciones
    });

  } catch (error) {
    console.error('Error getting mediciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

/**
 * Obtiene resumen de signos vitales recientes de un paciente
 * GET /api/sesiones/signos-vitales/:pacienteId
 */
router.get('/signos-vitales/:pacienteId', verifyToken, async (req, res) => {
  try {
    const { pacienteId } = req.params;

    const resumen = await medicionService.getResumenSignosVitales(pacienteId);
    
    res.json({
      success: true,
      signos_vitales: resumen
    });

  } catch (error) {
    console.error('Error getting signos vitales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

/**
 * Obtiene historial de sesiones de un paciente
 * GET /api/sesiones/historial/:pacienteId
 */
router.get('/historial/:pacienteId', verifyToken, async (req, res) => {
  try {
    const { pacienteId } = req.params;

    const sesiones = await sesionService.getSesionesByPaciente(pacienteId);
    
    res.json({
      success: true,
      total: sesiones.length,
      sesiones
    });

  } catch (error) {
    console.error('Error getting historial sesiones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
