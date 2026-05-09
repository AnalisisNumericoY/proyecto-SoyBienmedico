const express = require('express');
const { verifyToken } = require('./auth');
const supabase = require('../config/supabase');
const router = express.Router();

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

// GET MIS CITAS
router.get('/mis-citas', verifyToken, checkMedicoRole, async (req, res) => {
  try {
    const medicoId = req.user.medicoId;
    
    const { data: citas } = await supabase
      .from('citas')
      .select('*')
      .eq('medico_id', medicoId)
      .order('fecha', { ascending: true });

    const { data: pacientes } = await supabase.from('pacientes').select('*');

    const citasConDatos = (citas || []).map(cita => {
      const paciente = pacientes?.find(p => p.id === cita.paciente_id);
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
    
    const { data: pacientes } = await supabase
      .from('pacientes')
      .select('*')
      .eq('numero_documento', documento);

    const paciente = pacientes && pacientes.length > 0 ? pacientes[0] : null;

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

    const { data: historiaInserted, error } = await supabase
      .from('historias_clinicas')
      .insert([nuevaHistoria])
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Historia clínica guardada exitosamente',
      historia: historiaInserted[0]
    });

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

    // First, verify the cita belongs to this medico
    const { data: citasCheck } = await supabase
      .from('citas')
      .select('*')
      .eq('id', citaId)
      .eq('medico_id', medicoId);
    
    if (!citasCheck || citasCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada o no autorizada'
      });
    }

    // Update the cita
    const { data: citaUpdated, error } = await supabase
      .from('citas')
      .update({ 
        estado: estado,
        updated_at: new Date().toISOString()
      })
      .eq('id', citaId)
      .eq('medico_id', medicoId)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Estado de cita actualizado exitosamente',
      cita: citaUpdated[0]
    });

  } catch (error) {
    console.error('Error updating cita status:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET CITA BY ID (para videoconsulta)
router.get('/cita/:citaId', verifyToken, checkMedicoRole, async (req, res) => {
  try {
    const { citaId } = req.params;
    const medicoId = req.user.medicoId;

    // Get cita
    const { data: citas, error: citaError } = await supabase
      .from('citas')
      .select('*')
      .eq('id', citaId)
      .eq('medico_id', medicoId);

    if (citaError) throw citaError;

    const cita = citas && citas.length > 0 ? citas[0] : null;

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Get paciente data
    const { data: pacientes, error: pacienteError } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', cita.paciente_id);

    if (pacienteError) throw pacienteError;

    const paciente = pacientes && pacientes.length > 0 ? pacientes[0] : null;

    res.json({
      success: true,
      cita: cita,
      paciente: paciente
    });

  } catch (error) {
    console.error('Error getting cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;