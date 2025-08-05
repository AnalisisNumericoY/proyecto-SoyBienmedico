const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { verifyToken } = require('./auth');
const router = express.Router();

// File paths
const CITAS_FILE = path.join(__dirname, '../data/citas.json');
const MEDICOS_FILE = path.join(__dirname, '../data/medicos.json');
const HISTORIAS_FILE = path.join(__dirname, '../data/historias-clinicas.json');

// Middleware to check paciente role
const checkPacienteRole = (req, res, next) => {
  if (req.user.role !== 'paciente') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de paciente.'
    });
  }
  next();
};

// Helper function to load JSON file
const loadJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return {};
  }
};

// GET MIS CITAS
router.get('/mis-citas', verifyToken, checkPacienteRole, async (req, res) => {
  try {
    const pacienteId = req.user.pacienteId;
    
    const citasData = await loadJsonFile(CITAS_FILE);
    const medicosData = await loadJsonFile(MEDICOS_FILE);

    const misCitas = citasData.citas?.filter(c => c.paciente_id === pacienteId) || [];
    
    const citasConDatos = misCitas.map(cita => {
      const medico = medicosData.medicos?.find(m => m.id === cita.medico_id);
      return {
        ...cita,
        medico_nombre: medico ? medico.nombre : 'Médico no encontrado',
        medico_especialidad: medico ? medico.especialidad : 'N/A'
      };
    });

    res.json({
      success: true,
      citas: citasConDatos
    });

  } catch (error) {
    console.error('Error getting mis citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET MIS HISTORIAS CLINICAS
router.get('/mis-historias', verifyToken, checkPacienteRole, async (req, res) => {
  try {
    const pacienteId = req.user.pacienteId;
    
    const historiasData = await loadJsonFile(HISTORIAS_FILE);
    const medicosData = await loadJsonFile(MEDICOS_FILE);

    const misHistorias = historiasData.historias?.filter(h => h.paciente_id === pacienteId) || [];
    
    const historiasConDatos = misHistorias.map(historia => {
      const medico = medicosData.medicos?.find(m => m.id === historia.medico_id);
      return {
        ...historia,
        medico_nombre: medico ? medico.nombre : 'Médico no encontrado',
        medico_especialidad: medico ? medico.especialidad : 'N/A'
      };
    });

    res.json({
      success: true,
      historias: historiasConDatos
    });

  } catch (error) {
    console.error('Error getting mis historias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET HISTORIA CLINICA PDF
router.get('/historia/:id/pdf', verifyToken, checkPacienteRole, async (req, res) => {
  try {
    const { id } = req.params;
    const pacienteId = req.user.pacienteId;
    
    const historiasData = await loadJsonFile(HISTORIAS_FILE);
    const historia = historiasData.historias?.find(h => 
      h.id === id && h.paciente_id === pacienteId
    );

    if (!historia) {
      return res.status(404).json({
        success: false,
        message: 'Historia clínica no encontrada'
      });
    }

    const pdfPath = path.join(__dirname, '..', historia.pdf_path);
    
    try {
      await fs.access(pdfPath);
      res.sendFile(pdfPath);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Archivo PDF no encontrado'
      });
    }

  } catch (error) {
    console.error('Error getting PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;