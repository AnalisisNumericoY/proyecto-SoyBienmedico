const path = require('path');
const { loadJsonFile, saveJsonFile } = require('../utils/file-handler');
const { getCurrentTimestamp } = require('../utils/date-helpers');

const MEDICIONES_FILE = path.join(__dirname, '../data/mediciones-temporales.json');

/**
 * Servicio para gestión de mediciones de dispositivos
 * Almacena todas las mediciones con su relación a paciente, sesión y cápsula
 */

/**
 * Guarda una nueva medición
 * @param {Object} medicionData - Datos de la medición
 * @returns {Promise<Object>}
 */
const guardarMedicion = async (medicionData) => {
  const {
    paciente_id,
    numero_documento,
    sesion_id,
    capsula_id,
    dispositivo,
    mediciones
  } = medicionData;

  const data = await loadJsonFile(MEDICIONES_FILE);
  if (!data.mediciones) data.mediciones = [];

  const nuevaMedicion = {
    id: `MED_${Date.now()}`,
    paciente_id,
    numero_documento,
    sesion_id,
    capsula_id,
    dispositivo,
    mediciones,
    timestamp: getCurrentTimestamp()
  };

  data.mediciones.push(nuevaMedicion);
  await saveJsonFile(MEDICIONES_FILE, data);

  return nuevaMedicion;
};

/**
 * Obtiene las últimas mediciones de un paciente
 * @param {string} pacienteId - ID del paciente
 * @param {number} limit - Número de mediciones a retornar
 * @returns {Promise<Array>}
 */
const getUltimasMedicionesByPaciente = async (pacienteId, limit = 10) => {
  const data = await loadJsonFile(MEDICIONES_FILE);
  const mediciones = data.mediciones || [];

  return mediciones
    .filter(m => m.paciente_id === pacienteId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
};

/**
 * Obtiene la última medición de un tipo específico para un paciente
 * @param {string} pacienteId - ID del paciente
 * @param {string} dispositivo - Tipo de dispositivo (tensiometro, balanza, pulsoximetro)
 * @returns {Promise<Object|null>}
 */
const getUltimaMedicionByDispositivo = async (pacienteId, dispositivo) => {
  const data = await loadJsonFile(MEDICIONES_FILE);
  const mediciones = data.mediciones || [];

  const medicionesDispositivo = mediciones
    .filter(m => m.paciente_id === pacienteId && m.dispositivo === dispositivo)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return medicionesDispositivo.length > 0 ? medicionesDispositivo[0] : null;
};

/**
 * Obtiene todas las mediciones de una sesión
 * @param {string} sesionId - ID de la sesión
 * @returns {Promise<Array>}
 */
const getMedicionesBySesion = async (sesionId) => {
  const data = await loadJsonFile(MEDICIONES_FILE);
  const mediciones = data.mediciones || [];

  return mediciones.filter(m => m.sesion_id === sesionId);
};

/**
 * Obtiene mediciones recientes de un paciente (últimas 24 horas)
 * @param {string} pacienteId - ID del paciente
 * @returns {Promise<Object>} - Objeto con las mediciones más recientes por dispositivo
 */
const getMedicionesRecientes = async (pacienteId) => {
  const data = await loadJsonFile(MEDICIONES_FILE);
  const mediciones = data.mediciones || [];

  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const medicionesRecientes = mediciones
    .filter(m => m.paciente_id === pacienteId && new Date(m.timestamp) > hace24h)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Agrupar por dispositivo y tomar la más reciente de cada uno
  const resultado = {
    tensiometro: null,
    balanza: null,
    pulsoximetro: null
  };

  for (const medicion of medicionesRecientes) {
    if (!resultado[medicion.dispositivo]) {
      resultado[medicion.dispositivo] = medicion;
    }
  }

  return resultado;
};

/**
 * Obtiene resumen de signos vitales de un paciente
 * @param {string} pacienteId - ID del paciente
 * @returns {Promise<Object>}
 */
const getResumenSignosVitales = async (pacienteId) => {
  const medicionesRecientes = await getMedicionesRecientes(pacienteId);

  return {
    presion_arterial: medicionesRecientes.tensiometro ? {
      sistolica: medicionesRecientes.tensiometro.mediciones.sistolica,
      diastolica: medicionesRecientes.tensiometro.mediciones.diastolica,
      timestamp: medicionesRecientes.tensiometro.timestamp
    } : null,
    peso: medicionesRecientes.balanza ? {
      valor: medicionesRecientes.balanza.mediciones.peso,
      timestamp: medicionesRecientes.balanza.timestamp
    } : null,
    frecuencia_cardiaca: medicionesRecientes.pulsoximetro ? {
      valor: medicionesRecientes.pulsoximetro.mediciones.frecuencia_cardiaca,
      saturacion: medicionesRecientes.pulsoximetro.mediciones.saturacion,
      timestamp: medicionesRecientes.pulsoximetro.timestamp
    } : null
  };
};

module.exports = {
  guardarMedicion,
  getUltimasMedicionesByPaciente,
  getUltimaMedicionByDispositivo,
  getMedicionesBySesion,
  getMedicionesRecientes,
  getResumenSignosVitales
};
