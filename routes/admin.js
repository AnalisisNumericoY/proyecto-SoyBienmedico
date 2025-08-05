const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('./auth');
const router = express.Router();

// File paths
const MEDICOS_FILE = path.join(__dirname, '../data/medicos.json');
const PACIENTES_FILE = path.join(__dirname, '../data/pacientes.json');
const CITAS_FILE = path.join(__dirname, '../data/citas.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');
const HISTORIAS_FILE = path.join(__dirname, '../data/historias-clinicas.json');

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

// Helper functions
const loadJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return {};
  }
};

const saveJsonFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error);
    return false;
  }
};

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

    // Load existing data
    const medicosData = await loadJsonFile(MEDICOS_FILE);
    const usersData = await loadJsonFile(USERS_FILE);

    // Check for duplicates
    const existingMedico = medicosData.medicos?.find(m => 
      m.identificacion === identificacion || 
      m.registro_medico === registro_medico ||
      m.correo_electronico === correo_electronico
    );

    if (existingMedico) {
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

    // Save to files
    if (!medicosData.medicos) medicosData.medicos = [];
    if (!usersData.users) usersData.users = [];

    medicosData.medicos.push(nuevoMedico);
    usersData.users.push(nuevoUsuario);

    const medicoSaved = await saveJsonFile(MEDICOS_FILE, medicosData);
    const userSaved = await saveJsonFile(USERS_FILE, usersData);

    if (medicoSaved && userSaved) {
      res.json({
        success: true,
        message: 'Médico creado exitosamente',
        medico: nuevoMedico,
        credentials: {
          username: nuevoUsuario.username,
          password: 'medico123'
        }
      });
    } else {
      throw new Error('Error al guardar los datos');
    }

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
                           'estado_civil', 'email', 'rh'];
    
    for (const field of requiredFields) {
      if (!pacienteData[field]) {
        return res.status(400).json({
          success: false,
          message: `El campo ${field} es requerido`
        });
      }
    }

    // Load existing data
    const pacientesData = await loadJsonFile(PACIENTES_FILE);
    const usersData = await loadJsonFile(USERS_FILE);

    // Check for duplicates
    const existingPaciente = pacientesData.pacientes?.find(p => 
      p.numero_documento === pacienteData.numero_documento ||
      p.email === pacienteData.email
    );

    if (existingPaciente) {
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

    // Save to files
    if (!pacientesData.pacientes) pacientesData.pacientes = [];
    if (!usersData.users) usersData.users = [];

    pacientesData.pacientes.push(nuevoPaciente);
    usersData.users.push(nuevoUsuario);

    const pacienteSaved = await saveJsonFile(PACIENTES_FILE, pacientesData);
    const userSaved = await saveJsonFile(USERS_FILE, usersData);

    if (pacienteSaved && userSaved) {
      res.json({
        success: true,
        message: 'Paciente creado exitosamente',
        paciente: nuevoPaciente,
        credentials: {
          username: nuevoUsuario.username,
          password: 'paciente123'
        }
      });
    } else {
      throw new Error('Error al guardar los datos');
    }

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

    const citasData = await loadJsonFile(CITAS_FILE);
    const medicosData = await loadJsonFile(MEDICOS_FILE);
    const pacientesData = await loadJsonFile(PACIENTES_FILE);

    // Verify medico and paciente exist
    const medico = medicosData.medicos?.find(m => m.id === medico_id);
    const paciente = pacientesData.pacientes?.find(p => p.id === paciente_id);

    if (!medico || !paciente) {
      return res.status(404).json({
        success: false,
        message: 'Médico o paciente no encontrado'
      });
    }

    // Check for conflicts
    const existingCita = citasData.citas?.find(c => 
      c.medico_id === medico_id && 
      c.fecha === fecha && 
      c.hora === hora &&
      c.estado !== 'cancelada'
    );

    if (existingCita) {
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

    if (!citasData.citas) citasData.citas = [];
    citasData.citas.push(nuevaCita);

    const saved = await saveJsonFile(CITAS_FILE, citasData);
    if (saved) {
      res.json({
        success: true,
        message: 'Cita programada exitosamente',
        cita: {
          ...nuevaCita,
          medico_nombre: medico.nombre,
          paciente_nombre: `${paciente.nombre} ${paciente.apellidos}`
        }
      });
    } else {
      throw new Error('Error al guardar la cita');
    }

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

    const citasData = await loadJsonFile(CITAS_FILE);
    const medicosData = await loadJsonFile(MEDICOS_FILE);
    const pacientesData = await loadJsonFile(PACIENTES_FILE);

    const medico = medicosData.medicos?.find(m => m.identificacion === identificacion);
    if (!medico) {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    const citas = citasData.citas?.filter(c => c.medico_id === medico.id) || [];
    const citasConDatos = citas.map(cita => {
      const paciente = pacientesData.pacientes?.find(p => p.id === cita.paciente_id);
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

    const citasData = await loadJsonFile(CITAS_FILE);
    const medicosData = await loadJsonFile(MEDICOS_FILE);
    const pacientesData = await loadJsonFile(PACIENTES_FILE);

    const paciente = pacientesData.pacientes?.find(p => p.numero_documento === identificacion);
    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const citas = citasData.citas?.filter(c => c.paciente_id === paciente.id) || [];
    const citasConDatos = citas.map(cita => {
      const medico = medicosData.medicos?.find(m => m.id === cita.medico_id);
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

    const historiasData = await loadJsonFile(HISTORIAS_FILE);
    const pacientesData = await loadJsonFile(PACIENTES_FILE);
    const medicosData = await loadJsonFile(MEDICOS_FILE);

    const paciente = pacientesData.pacientes?.find(p => p.numero_documento === identificacion);
    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const historias = historiasData.historias?.filter(h => h.paciente_id === paciente.id) || [];
    const historiasConDatos = historias.map(historia => {
      const medico = medicosData.medicos?.find(m => m.id === historia.medico_id);
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
    const medicosData = await loadJsonFile(MEDICOS_FILE);
    res.json({
      success: true,
      medicos: medicosData.medicos || []
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
    const pacientesData = await loadJsonFile(PACIENTES_FILE);
    res.json({
      success: true,
      pacientes: pacientesData.pacientes || []
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
    const citasData = await loadJsonFile(CITAS_FILE);
    const medicosData = await loadJsonFile(MEDICOS_FILE);
    const pacientesData = await loadJsonFile(PACIENTES_FILE);

    const citas = citasData.citas || [];
    const citasConDatos = citas.map(cita => {
      const medico = medicosData.medicos?.find(m => m.id === cita.medico_id);
      const paciente = pacientesData.pacientes?.find(p => p.id === cita.paciente_id);
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

    const citasData = await loadJsonFile(CITAS_FILE);
    const citaIndex = citasData.citas?.findIndex(c => c.id === id);

    if (citaIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    citasData.citas[citaIndex].estado = estado;
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

// DELETE MEDICO
router.delete('/medico/:id', verifyToken, checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;

    const medicosData = await loadJsonFile(MEDICOS_FILE);
    const usersData = await loadJsonFile(USERS_FILE);

    const medicoIndex = medicosData.medicos?.findIndex(m => m.id === id);
    if (medicoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    // Remove medico
    medicosData.medicos.splice(medicoIndex, 1);

    // Remove associated user
    const userIndex = usersData.users?.findIndex(u => u.medico_id === id);
    if (userIndex !== -1) {
      usersData.users.splice(userIndex, 1);
    }

    const medicoSaved = await saveJsonFile(MEDICOS_FILE, medicosData);
    const userSaved = await saveJsonFile(USERS_FILE, usersData);

    if (medicoSaved && userSaved) {
      res.json({
        success: true,
        message: 'Médico eliminado exitosamente'
      });
    } else {
      throw new Error('Error al eliminar el médico');
    }

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