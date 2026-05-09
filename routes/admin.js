const express = require('express');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('./auth');
const supabase = require('../config/supabase');
const router = express.Router();

// Middleware to check admin role
const checkAdminRole = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
};

// Helper functions removed - using Supabase directly

// CREATE MEDICO
router.post('/crear-medico', verifyToken, checkAdminRole, async (req, res) => {
  try {
    const { nombre, identificacion, registro_medico, correo_electronico, telefono, especialidad } = req.body;

    // Validate required fields
    if (!nombre || !identificacion || !registro_medico || !correo_electronico) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser completados'
      });
    }

    // Check for duplicates
    const { data: existingMedicos } = await supabase
      .from('medicos')
      .select('*')
      .or(`identificacion.eq.${identificacion},registro_medico.eq.${registro_medico},correo_electronico.eq.${correo_electronico}`);

    if (existingMedicos && existingMedicos.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un médico con esa identificación, registro médico o correo'
      });
    }

    // Generate IDs
    const medicoId = `MED${Date.now()}`;
    const userId = `user_${medicoId}`;

    // Create medico
    const nuevoMedico = {
      id: medicoId,
      nombre,
      identificacion,
      registro_medico,
      correo_electronico,
      telefono: telefono || '',
      especialidad: especialidad || 'Medicina General',
      created_at: new Date().toISOString(),
      active: true
    };

    // Create user account
    const hashedPassword = await bcrypt.hash('medico123', 10);
    const nuevoUsuario = {
      id: userId,
      username: `medico_${identificacion}`,
      password: hashedPassword,
      role: 'medico',
      email: correo_electronico,
      medico_id: medicoId,
      paciente_id: null,
      created_at: new Date().toISOString(),
      active: true
    };

    // Insert into Supabase
    const { data: medicoInserted, error: medicoError } = await supabase
      .from('medicos')
      .insert([nuevoMedico])
      .select();

    if (medicoError) throw medicoError;

    const { data: userInserted, error: userError } = await supabase
      .from('users')
      .insert([nuevoUsuario])
      .select();

    if (userError) throw userError;

    res.json({
      success: true,
      message: 'Médico creado exitosamente',
      medico: medicoInserted[0],
      credentials: {
        username: nuevoUsuario.username,
        password: 'medico123'
      }
    });

  } catch (error) {
    console.error('Error creating medico:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// CREATE PACIENTE
router.post('/crear-paciente', verifyToken, checkAdminRole, async (req, res) => {
  try {
    const pacienteData = req.body;

    // Validate required fields
    const requiredFields = ['tipo_documento', 'numero_documento', 'nombre', 'apellidos', 
                           'sexo', 'fecha_nacimiento', 'ocupacion', 'telefono', 
                           'estado_civil', 'email', 'rh', 'programa'];
    
    for (const field of requiredFields) {
      if (!pacienteData[field]) {
        return res.status(400).json({
          success: false,
          message: `El campo ${field} es requerido`
        });
      }
    }

    // Check for duplicates
    const { data: existingPacientes } = await supabase
      .from('pacientes')
      .select('*')
      .or(`numero_documento.eq.${pacienteData.numero_documento},email.eq.${pacienteData.email}`);

    if (existingPacientes && existingPacientes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un paciente con ese número de documento o correo'
      });
    }

    // Generate IDs
    const pacienteId = `PAC${Date.now()}`;
    const userId = `user_${pacienteId}`;

    // Create paciente
    const nuevoPaciente = {
      id: pacienteId,
      fecha_registro: new Date().toISOString(),
      ...pacienteData
    };

    // Create user account
    const hashedPassword = await bcrypt.hash('paciente123', 10);
    const nuevoUsuario = {
      id: userId,
      username: `paciente_${pacienteData.numero_documento}`,
      password: hashedPassword,
      role: 'paciente',
      email: pacienteData.email,
      medico_id: null,
      paciente_id: pacienteId,
      created_at: new Date().toISOString(),
      active: true
    };

    // Insert into Supabase
    const { data: pacienteInserted, error: pacienteError } = await supabase
      .from('pacientes')
      .insert([nuevoPaciente])
      .select();

    if (pacienteError) throw pacienteError;

    const { data: userInserted, error: userError } = await supabase
      .from('users')
      .insert([nuevoUsuario])
      .select();

    if (userError) throw userError;

    res.json({
      success: true,
      message: 'Paciente creado exitosamente',
      paciente: pacienteInserted[0],
      credentials: {
        username: nuevoUsuario.username,
        password: 'paciente123'
      }
    });

  } catch (error) {
    console.error('Error creating paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PROGRAMAR CITA
router.post('/programar-cita', verifyToken, checkAdminRole, async (req, res) => {
  try {
    const { paciente_id, medico_id, fecha, hora, motivo } = req.body;

    if (!paciente_id || !medico_id || !fecha || !hora) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser completados'
      });
    }

    // Verify medico and paciente exist
    const { data: medicos } = await supabase
      .from('medicos')
      .select('*')
      .eq('id', medico_id);

    const { data: pacientes } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', paciente_id);

    const medico = medicos && medicos.length > 0 ? medicos[0] : null;
    const paciente = pacientes && pacientes.length > 0 ? pacientes[0] : null;

    if (!medico || !paciente) {
      return res.status(404).json({
        success: false,
        message: 'Médico o paciente no encontrado'
      });
    }

    // Check for conflicts
    const { data: existingCitas } = await supabase
      .from('citas')
      .select('*')
      .eq('medico_id', medico_id)
      .eq('fecha', fecha)
      .eq('hora', hora)
      .neq('estado', 'cancelada');

    if (existingCitas && existingCitas.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una cita programada para esa fecha y hora'
      });
    }

    // Create cita
    const citaId = `CITA${Date.now()}`;
    const nuevaCita = {
      id: citaId,
      paciente_id,
      medico_id,
      fecha,
      hora,
      estado: 'programada',
      motivo: motivo || '',
      room_id: `room_${citaId}_${Date.now()}`,
      created_at: new Date().toISOString()
    };

    const { data: citaInserted, error } = await supabase
      .from('citas')
      .insert([nuevaCita])
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cita programada exitosamente',
      cita: {
        ...citaInserted[0],
        medico_nombre: medico.nombre,
        paciente_nombre: `${paciente.nombre} ${paciente.apellidos}`
      }
    });

  } catch (error) {
    console.error('Error programming cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET CITAS BY MEDICO
router.get('/citas-medico/:identificacion', verifyToken, checkAdminRole, async (req, res) => {
  try {
    const { identificacion } = req.params;

    const { data: medicos } = await supabase
      .from('medicos')
      .select('*')
      .eq('identificacion', identificacion);

    const medico = medicos && medicos.length > 0 ? medicos[0] : null;

    if (!medico) {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    const { data: citas } = await supabase
      .from('citas')
      .select('*')
      .eq('medico_id', medico.id)
      .order('fecha', { ascending: true });

    const { data: pacientes } = await supabase.from('pacientes').select('*');

    const citasConDatos = (citas || []).map(cita => {
      const paciente = pacientes?.find(p => p.id === cita.paciente_id);
      return {
        ...cita,
        medico_nombre: medico.nombre,
        paciente_nombre: paciente ? `${paciente.nombre} ${paciente.apellidos}` : 'Paciente no encontrado'
      };
    });

    res.json({
      success: true,
      citas: citasConDatos,
      medico: medico
    });

  } catch (error) {
    console.error('Error getting citas by medico:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET CITAS BY PACIENTE
router.get('/citas-paciente/:identificacion', verifyToken, checkAdminRole, async (req, res) => {
  try {
    const { identificacion } = req.params;

    const { data: pacientes } = await supabase
      .from('pacientes')
      .select('*')
      .eq('numero_documento', identificacion);

    const paciente = pacientes && pacientes.length > 0 ? pacientes[0] : null;

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const { data: citas } = await supabase
      .from('citas')
      .select('*')
      .eq('paciente_id', paciente.id)
      .order('fecha', { ascending: true });

    const { data: medicos } = await supabase.from('medicos').select('*');

    const citasConDatos = (citas || []).map(cita => {
      const medico = medicos?.find(m => m.id === cita.medico_id);
      return {
        ...cita,
        medico_nombre: medico ? medico.nombre : 'Médico no encontrado',
        paciente_nombre: `${paciente.nombre} ${paciente.apellidos}`
      };
    });

    res.json({
      success: true,
      citas: citasConDatos,
      paciente: paciente
    });

  } catch (error) {
    console.error('Error getting citas by paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET HISTORIAS CLINICAS BY PACIENTE
router.get('/historias-paciente/:identificacion', verifyToken, checkAdminRole, async (req, res) => {
  try {
    const { identificacion } = req.params;

    const { data: pacientes } = await supabase
      .from('pacientes')
      .select('*')
      .eq('numero_documento', identificacion);

    const paciente = pacientes && pacientes.length > 0 ? pacientes[0] : null;

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const { data: historias } = await supabase
      .from('historias_clinicas')
      .select('*')
      .eq('paciente_id', paciente.id)
      .order('fecha_consulta', { ascending: false });

    const { data: medicos } = await supabase.from('medicos').select('*');

    const historiasConDatos = (historias || []).map(historia => {
      const medico = medicos?.find(m => m.id === historia.medico_id);
      return {
        ...historia,
        medico_nombre: medico ? medico.nombre : 'Médico no encontrado',
        paciente_nombre: `${paciente.nombre} ${paciente.apellidos}`
      };
    });

    res.json({
      success: true,
      historias: historiasConDatos,
      paciente: paciente
    });

  } catch (error) {
    console.error('Error getting historias by paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET ALL MEDICOS
router.get('/medicos', verifyToken, checkAdminRole, async (req, res) => {
  try {
    const { data: medicos, error } = await supabase
      .from('medicos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      medicos: medicos || []
    });
  } catch (error) {
    console.error('Error getting medicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET ALL PACIENTES
router.get('/pacientes', verifyToken, checkAdminRole, async (req, res) => {
  try {
    const { data: pacientes, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('fecha_registro', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      pacientes: pacientes || []
    });
  } catch (error) {
    console.error('Error getting pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET ALL CITAS
router.get('/citas', verifyToken, checkAdminRole, async (req, res) => {
  try {
    // Obtener todas las citas
    const { data: citas, error: citasError } = await supabase
      .from('citas')
      .select('*');

    if (citasError) throw citasError;

    // Ordenar por created_at descendente (más recientes primero)
    const citasOrdenadas = (citas || []).sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    // Tomar las últimas 10
    const citasRecientes = citasOrdenadas.slice(0, 10);

    const { data: medicos } = await supabase.from('medicos').select('*');
    const { data: pacientes } = await supabase.from('pacientes').select('*');

    const citasConDatos = citasRecientes.map(cita => {
      const medico = medicos?.find(m => m.id === cita.medico_id);
      const paciente = pacientes?.find(p => p.id === cita.paciente_id);
      return {
        ...cita,
        medico_nombre: medico ? medico.nombre : 'Médico no encontrado',
        paciente_nombre: paciente ? `${paciente.nombre} ${paciente.apellidos}` : 'Paciente no encontrado'
      };
    });

    res.json({
      success: true,
      citas: citasConDatos
    });
  } catch (error) {
    console.error('Error getting citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// UPDATE CITA STATUS
router.put('/cita/:id/estado', verifyToken, checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const validStates = ['programada', 'en_curso', 'completada', 'cancelada'];
    if (!validStates.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const { data: citaUpdated, error } = await supabase
      .from('citas')
      .update({ 
        estado: estado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!citaUpdated || citaUpdated.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Estado de cita actualizado',
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

// DELETE MEDICO
router.delete('/medico/:id', verifyToken, checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete associated user first
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('medico_id', id);

    if (userError) console.error('Error deleting user:', userError);

    // Delete medico
    const { data: deletedMedico, error: medicoError } = await supabase
      .from('medicos')
      .delete()
      .eq('id', id)
      .select();

    if (medicoError) throw medicoError;

    if (!deletedMedico || deletedMedico.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Médico eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting medico:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE PACIENTE
router.delete('/paciente/:id', verifyToken, checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;

    const pacientesData = await loadJsonFile(PACIENTES_FILE);
    const usersData = await loadJsonFile(USERS_FILE);

    const pacienteIndex = pacientesData.pacientes?.findIndex(p => p.id === id);
    if (pacienteIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Remove paciente
    pacientesData.pacientes.splice(pacienteIndex, 1);

    // Remove associated user
    const userIndex = usersData.users?.findIndex(u => u.paciente_id === id);
    if (userIndex !== -1) {
      usersData.users.splice(userIndex, 1);
    }

    const pacienteSaved = await saveJsonFile(PACIENTES_FILE, pacientesData);
    const userSaved = await saveJsonFile(USERS_FILE, usersData);

    if (pacienteSaved && userSaved) {
      res.json({
        success: true,
        message: 'Paciente eliminado exitosamente'
      });
    } else {
      throw new Error('Error al eliminar el paciente');
    }

  } catch (error) {
    console.error('Error deleting paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;