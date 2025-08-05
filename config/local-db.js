// config/local-db.js
const fs = require('fs');
const path = require('path');

// Helper function to read JSON files
const readJsonFile = (filename) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    
    // Handle different file structures
    if (filename === 'users.json' && jsonData.users) {
      return jsonData.users;
    }
    if (filename === 'medicos.json' && jsonData.medicos) {
      return jsonData.medicos;
    }
    if (filename === 'pacientes.json' && jsonData.pacientes) {
      return jsonData.pacientes;
    }
    if (filename === 'citas.json' && jsonData.citas) {
      return jsonData.citas;
    }
    if (filename === 'historias-clinicas.json' && jsonData.historias_clinicas) {
      return jsonData.historias_clinicas;
    }
    
    // Return array directly if it's already an array
    return Array.isArray(jsonData) ? jsonData : [];
  } catch (error) {
    console.log(`Archivo ${filename} no encontrado, creando uno vacío...`);
    return [];
  }
};

// Helper function to write JSON files
const writeJsonFile = (filename, data) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error escribiendo archivo ${filename}:`, error);
    return false;
  }
};

// Local database simulation
const localDB = {
  // Users operations
  users: {
    getAll: () => readJsonFile('users.json'),
    getByUsername: (username) => {
      const users = readJsonFile('users.json');
      return users.find(user => user.username === username);
    },
    create: (userData) => {
      const users = readJsonFile('users.json');
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        created_at: new Date().toISOString(),
        active: true
      };
      users.push(newUser);
      writeJsonFile('users.json', users);
      return newUser;
    },
    update: (id, userData) => {
      const users = readJsonFile('users.json');
      const index = users.findIndex(user => user.id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...userData };
        writeJsonFile('users.json', users);
        return users[index];
      }
      return null;
    }
  },

  // Medicos operations
  medicos: {
    getAll: () => readJsonFile('medicos.json'),
    getById: (id) => {
      const medicos = readJsonFile('medicos.json');
      return medicos.find(medico => medico.id === id);
    },
    create: (medicoData) => {
      const medicos = readJsonFile('medicos.json');
      const newMedico = {
        id: Date.now().toString(),
        ...medicoData,
        created_at: new Date().toISOString(),
        active: true
      };
      medicos.push(newMedico);
      writeJsonFile('medicos.json', medicos);
      return newMedico;
    },
    update: (id, medicoData) => {
      const medicos = readJsonFile('medicos.json');
      const index = medicos.findIndex(medico => medico.id === id);
      if (index !== -1) {
        medicos[index] = { ...medicos[index], ...medicoData };
        writeJsonFile('medicos.json', medicos);
        return medicos[index];
      }
      return null;
    }
  },

  // Pacientes operations
  pacientes: {
    getAll: () => readJsonFile('pacientes.json'),
    getById: (id) => {
      const pacientes = readJsonFile('pacientes.json');
      return pacientes.find(paciente => paciente.id === id);
    },
    create: (pacienteData) => {
      const pacientes = readJsonFile('pacientes.json');
      const newPaciente = {
        id: Date.now().toString(),
        fecha_registro: new Date().toISOString(),
        ...pacienteData
      };
      pacientes.push(newPaciente);
      writeJsonFile('pacientes.json', pacientes);
      return newPaciente;
    },
    update: (id, pacienteData) => {
      const pacientes = readJsonFile('pacientes.json');
      const index = pacientes.findIndex(paciente => paciente.id === id);
      if (index !== -1) {
        pacientes[index] = { ...pacientes[index], ...pacienteData };
        writeJsonFile('pacientes.json', pacientes);
        return pacientes[index];
      }
      return null;
    }
  },

  // Citas operations
  citas: {
    getAll: () => readJsonFile('citas.json'),
    getById: (id) => {
      const citas = readJsonFile('citas.json');
      return citas.find(cita => cita.id === id);
    },
    getByMedicoId: (medicoId) => {
      const citas = readJsonFile('citas.json');
      return citas.filter(cita => cita.medico_id === medicoId);
    },
    getByPacienteId: (pacienteId) => {
      const citas = readJsonFile('citas.json');
      return citas.filter(cita => cita.paciente_id === pacienteId);
    },
    create: (citaData) => {
      const citas = readJsonFile('citas.json');
      const newCita = {
        id: Date.now().toString(),
        ...citaData,
        estado: 'programada',
        room_id: `room_${Date.now()}`,
        created_at: new Date().toISOString()
      };
      citas.push(newCita);
      writeJsonFile('citas.json', citas);
      return newCita;
    },
    update: (id, citaData) => {
      const citas = readJsonFile('citas.json');
      const index = citas.findIndex(cita => cita.id === id);
      if (index !== -1) {
        citas[index] = { ...citas[index], ...citaData };
        writeJsonFile('citas.json', citas);
        return citas[index];
      }
      return null;
    }
  },

  // Historias clinicas operations
  historias: {
    getAll: () => readJsonFile('historias-clinicas.json'),
    getById: (id) => {
      const historias = readJsonFile('historias-clinicas.json');
      return historias.find(historia => historia.id === id);
    },
    getByPacienteId: (pacienteId) => {
      const historias = readJsonFile('historias-clinicas.json');
      return historias.filter(historia => historia.paciente_id === pacienteId);
    },
    create: (historiaData) => {
      const historias = readJsonFile('historias-clinicas.json');
      const newHistoria = {
        id: Date.now().toString(),
        ...historiaData,
        fecha_consulta: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      historias.push(newHistoria);
      writeJsonFile('historias-clinicas.json', historias);
      return newHistoria;
    }
  }
};

module.exports = localDB;
