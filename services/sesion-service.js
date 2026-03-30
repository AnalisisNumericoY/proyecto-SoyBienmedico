const path = require('path');
const { loadJsonFile, saveJsonFile } = require('../utils/file-handler');
const { getCurrentTimestamp } = require('../utils/date-helpers');

const SESIONES_FILE = path.join(__dirname, '../data/sesiones-medicion.json');

/**
 * Servicio para gestión de sesiones de medición
 * Una sesión asocia mediciones de dispositivos con un paciente específico
 * Solo puede haber UNA sesión activa por cápsula
 */

/**
 * Obtiene todas las sesiones
 * @returns {Promise<Array>}
 */
const getAllSesiones = async () => {
  const data = await loadJsonFile(SESIONES_FILE);
  return data.sesiones || [];
};

/**
 * Obtiene la sesión activa de una cápsula
 * @param {string} capsulaId - ID de la cápsula
 * @returns {Promise<Object|null>}
 */
const getSesionActivaByCapsula = async (capsulaId) => {
  const sesiones = await getAllSesiones();
  return sesiones.find(s => s.capsula_id === capsulaId && s.estado === 'activa') || null;
};

/**
 * Verifica si hay una sesión activa en una cápsula
 * @param {string} capsulaId - ID de la cápsula
 * @returns {Promise<boolean>}
 */
const haySesionActiva = async (capsulaId) => {
  const sesionActiva = await getSesionActivaByCapsula(capsulaId);
  return sesionActiva !== null;
};

/**
 * Inicia una nueva sesión de medición
 * @param {Object} sesionData - Datos de la sesión
 * @returns {Promise<Object>}
 */
const iniciarSesion = async (sesionData) => {
  const { capsula_id, paciente_id, numero_documento, tipo_sesion } = sesionData;

  // Verificar que no haya sesión activa en esta cápsula
  const hayActiva = await haySesionActiva(capsula_id);
  if (hayActiva) {
    throw new Error('Ya existe una sesión activa en esta cápsula');
  }

  const data = await loadJsonFile(SESIONES_FILE);
  if (!data.sesiones) data.sesiones = [];

  const nuevaSesion = {
    id: `SESSION_${Date.now()}`,
    capsula_id,
    paciente_id,
    numero_documento,
    tipo_sesion: tipo_sesion || 'clasificacion_riesgos',
    estado: 'activa',
    inicio: getCurrentTimestamp(),
    fin: null,
    mediciones_count: 0
  };

  data.sesiones.push(nuevaSesion);
  await saveJsonFile(SESIONES_FILE, data);

  return nuevaSesion;
};

/**
 * Finaliza una sesión de medición
 * @param {string} sesionId - ID de la sesión
 * @returns {Promise<Object|null>}
 */
const finalizarSesion = async (sesionId) => {
  const data = await loadJsonFile(SESIONES_FILE);
  const index = data.sesiones?.findIndex(s => s.id === sesionId);

  if (index === -1) return null;

  data.sesiones[index] = {
    ...data.sesiones[index],
    estado: 'finalizada',
    fin: getCurrentTimestamp()
  };

  await saveJsonFile(SESIONES_FILE, data);
  return data.sesiones[index];
};

/**
 * Finaliza sesión activa de una cápsula
 * @param {string} capsulaId - ID de la cápsula
 * @returns {Promise<Object|null>}
 */
const finalizarSesionByCapsula = async (capsulaId) => {
  const sesionActiva = await getSesionActivaByCapsula(capsulaId);
  if (!sesionActiva) return null;

  return await finalizarSesion(sesionActiva.id);
};

/**
 * Incrementa el contador de mediciones de una sesión
 * @param {string} sesionId - ID de la sesión
 * @returns {Promise<boolean>}
 */
const incrementarMediciones = async (sesionId) => {
  const data = await loadJsonFile(SESIONES_FILE);
  const index = data.sesiones?.findIndex(s => s.id === sesionId);

  if (index === -1) return false;

  data.sesiones[index].mediciones_count = (data.sesiones[index].mediciones_count || 0) + 1;
  await saveJsonFile(SESIONES_FILE, data);

  return true;
};

/**
 * Obtiene sesiones de un paciente
 * @param {string} pacienteId - ID del paciente
 * @returns {Promise<Array>}
 */
const getSesionesByPaciente = async (pacienteId) => {
  const sesiones = await getAllSesiones();
  return sesiones.filter(s => s.paciente_id === pacienteId);
};

module.exports = {
  getAllSesiones,
  getSesionActivaByCapsula,
  haySesionActiva,
  iniciarSesion,
  finalizarSesion,
  finalizarSesionByCapsula,
  incrementarMediciones,
  getSesionesByPaciente
};
