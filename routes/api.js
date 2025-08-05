const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { verifyToken } = require('./auth');
const router = express.Router();

// File paths
const CITAS_FILE = path.join(__dirname, '../data/citas.json');
const MEDICOS_FILE = path.join(__dirname, '../data/medicos.json');
const PACIENTES_FILE = path.join(__dirname, '../data/pacientes.json');

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

// Helper function to save JSON file
const saveJsonFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error);
    return false;
  }
};

// GET CITA BY ROOM ID (for video calls)
router.get('/cita/room/:roomId', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const citasData = await loadJsonFile(CITAS_FILE);
    const medicosData = await loadJsonFile(MEDICOS_FILE);
    const pacientesData = await loadJsonFile(PACIENTES_FILE);

    const cita = citasData.citas?.find(c => c.room_id === roomId);
    
    if (!cita) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Verify user has access to this cita
    let hasAccess = false;
    if (userRole === 'medico' && cita.medico_id === req.user.medicoId) {
      hasAccess = true;
    } else if (userRole === 'paciente' && cita.paciente_id === req.user.pacienteId) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para acceder a esta cita'
      });
    }

    // Get additional info
    const medico = medicosData.medicos?.find(m => m.id === cita.medico_id);
    const paciente = pacientesData.pacientes?.find(p => p.id === cita.paciente_id);

    res.json({
      success: true,
      cita: {
        ...cita,
        medico_nombre: medico ? medico.nombre : 'Médico no encontrado',
        medico_registro: medico ? medico.registro_medico : '',
        paciente_nombre: paciente ? `${paciente.nombre} ${paciente.apellidos}` : 'Paciente no encontrado',
        paciente_documento: paciente ? paciente.numero_documento : ''
      }
    });

  } catch (error) {
    console.error('Error getting cita by room:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// UPDATE CITA STATUS
router.put('/cita/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['programada', 'en_curso', 'completada', 'cancelada'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const citasData = await loadJsonFile(CITAS_FILE);
    const citaIndex = citasData.citas?.findIndex(c => c.id === id);

    if (citaIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const cita = citasData.citas[citaIndex];
    
    // Verify user has access to this cita
    let hasAccess = false;
    if (req.user.role === 'medico' && cita.medico_id === req.user.medicoId) {
      hasAccess = true;
    } else if (req.user.role === 'paciente' && cita.paciente_id === req.user.pacienteId) {
      hasAccess = true;
    } else if (req.user.role === 'admin') {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para modificar esta cita'
      });
    }

    citasData.citas[citaIndex].estado = status;
    citasData.citas[citaIndex].updated_at = new Date().toISOString();

    const saved = await saveJsonFile(CITAS_FILE, citasData);
    if (saved) {
      res.json({
        success: true,
        message: 'Estado de cita actualizado',
        cita: citasData.citas[citaIndex]
      });
    } else {
      throw new Error('Error al actualizar la cita');
    }

  } catch (error) {
    console.error('Error updating cita status:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// HEALTH CHECK
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
