const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { verifyToken } = require('./auth');
const router = express.Router();

// File paths
const CITAS_FILE = path.join(__dirname, '../data/citas.json');
const PACIENTES_FILE = path.join(__dirname, '../data/pacientes.json');
const HISTORIAS_FILE = path.join(__dirname, '../data/historias-clinicas.json');

// Middleware to check medico role
const checkMedicoRole = (req, res, next) => {
  if (req.user.role !== 'medico') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de médico.'
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

// GET MIS CITAS
router.get('/mis-citas', verifyToken, checkMedicoRole, async (req, res) => {
  try {
    const medicoId = req.user.medicoId;
    
    const citasData = await loadJsonFile(CITAS_FILE);
    const pacientesData = await loadJsonFile(PACIENTES_FILE);

    const misCitas = citasData.citas?.filter(c => c.medico_id === medicoId) || [];
    
    const citasConDatos = misCitas.map(cita => {
      const paciente = pacientesData.pacientes?.find(p => p.id === cita.paciente_id);
      return {
        ...cita,
        paciente_nombre: paciente ? `${paciente.nombre} ${paciente.apellidos}` : 'Paciente no encontrado',
        paciente_documento: paciente ? paciente.numero_documento : 'N/A'
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

// GET PACIENTE INFO BY DOCUMENT
router.get('/paciente/:documento', verifyToken, checkMedicoRole, async (req, res) => {
  try {
    const { documento } = req.params;
    
    const pacientesData = await loadJsonFile(PACIENTES_FILE);
    const paciente = pacientesData.pacientes?.find(p => p.numero_documento === documento);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    res.json({
      success: true,
      paciente: paciente
    });

  } catch (error) {
    console.error('Error getting paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// SAVE HISTORIA CLINICA
router.post('/historia-clinica', verifyToken, checkMedicoRole, async (req, res) => {
  try {
    const medicoId = req.user.medicoId;
    const historiaData = req.body;

    // Validate required fields
    if (!historiaData.paciente_id || !historiaData.cita_id) {
      return res.status(400).json({
        success: false,
        message: 'ID del paciente y ID de cita son requeridos'
      });
    }

    const historiasData = await loadJsonFile(HISTORIAS_FILE);

    // Create historia clinica
    const historiaId = `HC${Date.now()}`;
    const nuevaHistoria = {
      id: historiaId,
      cita_id: historiaData.cita_id,
      paciente_id: historiaData.paciente_id,
      medico_id: medicoId,
      fecha_consulta: historiaData.fecha_consulta || new Date().toISOString(),
      
      // Información clínica
      motivo_consulta: historiaData.motivo_consulta || '',
      sintomas_actuales: historiaData.sintomas_actuales || '',
      tiempo_evolucion: historiaData.tiempo_evolucion || '',
      intensidad_dolor: historiaData.intensidad_dolor || '',
      
      // Signos vitales
      presion_arterial: historiaData.presion_arterial || '',
      frecuencia_cardiaca: parseInt(historiaData.frecuencia_cardiaca) || null,
      temperatura: parseFloat(historiaData.temperatura) || null,
      saturacion_oxigeno: parseInt(historiaData.saturacion_oxigeno) || null,
      
      // Examen y diagnóstico
      examen_fisico: historiaData.examen_fisico || '',
      diagnostico_principal: historiaData.diagnostico_principal || '',
      diagnostico_secundario: historiaData.diagnostico_secundario || '',
      
      // Tratamiento
      medicamentos: historiaData.medicamentos || '',
      recomendaciones: historiaData.recomendaciones || '',
      
      // Seguimiento
      proxima_consulta: historiaData.proxima_consulta || '',
      examenes: historiaData.examenes || '',
      
      created_at: new Date().toISOString()
    };

    if (!historiasData.historias) historiasData.historias = [];
    historiasData.historias.push(nuevaHistoria);

    const saved = await saveJsonFile(HISTORIAS_FILE, historiasData);
    if (saved) {
      res.json({
        success: true,
        message: 'Historia clínica guardada exitosamente',
        historia: nuevaHistoria
      });
    } else {
      throw new Error('Error al guardar la historia clínica');
    }

  } catch (error) {
    console.error('Error saving historia clinica:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// UPDATE CITA STATUS
router.put('/cita/:citaId/estado', verifyToken, checkMedicoRole, async (req, res) => {
  try {
    const { citaId } = req.params;
    const { estado } = req.body;
    const medicoId = req.user.medicoId;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'Estado es requerido'
      });
    }

    const citasData = await loadJsonFile(CITAS_FILE);
    
    if (!citasData.citas) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron citas'
      });
    }

    const citaIndex = citasData.citas.findIndex(c => c.id === citaId && c.medico_id === medicoId);
    
    if (citaIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada o no autorizada'
      });
    }

    citasData.citas[citaIndex].estado = estado;
    citasData.citas[citaIndex].updated_at = new Date().toISOString();

    const saved = await saveJsonFile(CITAS_FILE, citasData);
    if (saved) {
      res.json({
        success: true,
        message: 'Estado de cita actualizado exitosamente',
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

module.exports = router;