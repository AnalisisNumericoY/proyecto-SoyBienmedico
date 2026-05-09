const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { verifyToken } = require('./auth');
const supabase = require('../config/supabase');
const router = express.Router();

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

// GET MIS CITAS
router.get('/mis-citas', verifyToken, checkPacienteRole, async (req, res) => {
  try {
    const pacienteId = req.user.pacienteId;
    
    const { data: citas, error: citasError } = await supabase
      .from('citas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: true });

    if (citasError) throw citasError;

    const { data: medicos } = await supabase.from('medicos').select('*');

    const citasConDatos = (citas || []).map(cita => {
      const medico = medicos?.find(m => m.id === cita.medico_id);
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
    
    const { data: historias, error: historiasError } = await supabase
      .from('historias_clinicas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha_consulta', { ascending: false });

    if (historiasError) throw historiasError;

    const { data: medicos } = await supabase.from('medicos').select('*');

    const historiasConDatos = (historias || []).map(historia => {
      const medico = medicos?.find(m => m.id === historia.medico_id);
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
    
    const { data: historias, error } = await supabase
      .from('historias_clinicas')
      .select('*')
      .eq('id', id)
      .eq('paciente_id', pacienteId);

    if (error) throw error;

    const historia = historias && historias.length > 0 ? historias[0] : null;

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