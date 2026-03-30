const path = require('path');
const { loadJsonFile, saveJsonFile } = require('../utils/file-handler');

const PACIENTES_FILE = path.join(__dirname, '../data/pacientes.json');

/**
 * Servicio para operaciones sobre pacientes
 * Proporciona funciones reutilizables para gestión de pacientes
 */

/**
 * Obtiene todos los pacientes
 * @returns {Promise<Array>}
 */
const getAllPacientes = async () => {
  const data = await loadJsonFile(PACIENTES_FILE);
  return data.pacientes || [];
};

/**
 * Obtiene un paciente por ID
 * @param {string} pacienteId - ID del paciente
 * @returns {Promise<Object|null>}
 */
const getPacienteById = async (pacienteId) => {
  const pacientes = await getAllPacientes();
  return pacientes.find(p => p.id === pacienteId) || null;
};

/**
 * Obtiene un paciente por número de documento
 * @param {string} numeroDocumento - Número de documento
 * @returns {Promise<Object|null>}
 */
const getPacienteByDocumento = async (numeroDocumento) => {
  const pacientes = await getAllPacientes();
  return pacientes.find(p => p.numero_documento === numeroDocumento) || null;
};

/**
 * Crea un nuevo paciente
 * @param {Object} pacienteData - Datos del paciente
 * @returns {Promise<Object>}
 */
const createPaciente = async (pacienteData) => {
  const data = await loadJsonFile(PACIENTES_FILE);
  if (!data.pacientes) data.pacientes = [];

  const nuevoPaciente = {
    id: `PAC${Date.now()}`,
    fecha_registro: new Date().toISOString(),
    ...pacienteData
  };

  data.pacientes.push(nuevoPaciente);
  await saveJsonFile(PACIENTES_FILE, data);

  return nuevoPaciente;
};

/**
 * Actualiza un paciente
 * @param {string} pacienteId - ID del paciente
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<Object|null>}
 */
const updatePaciente = async (pacienteId, updates) => {
  const data = await loadJsonFile(PACIENTES_FILE);
  const index = data.pacientes?.findIndex(p => p.id === pacienteId);

  if (index === -1) return null;

  data.pacientes[index] = {
    ...data.pacientes[index],
    ...updates
  };

  await saveJsonFile(PACIENTES_FILE, data);
  return data.pacientes[index];
};

/**
 * Obtiene datos básicos del paciente
 * @param {string} pacienteId - ID del paciente
 * @returns {Promise<Object|null>}
 */
const getDatosBasicos = async (pacienteId) => {
  const paciente = await getPacienteById(pacienteId);
  if (!paciente) return null;

  return {
    id: paciente.id,
    nombre_completo: `${paciente.nombre} ${paciente.apellidos}`,
    numero_documento: paciente.numero_documento,
    tipo_documento: paciente.tipo_documento,
    rh: paciente.rh,
    sexo: paciente.sexo,
    fecha_nacimiento: paciente.fecha_nacimiento,
    telefono: paciente.telefono,
    email: paciente.email
  };
};

module.exports = {
  getAllPacientes,
  getPacienteById,
  getPacienteByDocumento,
  createPaciente,
  updatePaciente,
  getDatosBasicos
};
