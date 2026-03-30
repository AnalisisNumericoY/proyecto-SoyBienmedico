const path = require('path');
const { loadJsonFile, saveJsonFile } = require('../utils/file-handler');
const { getCurrentTimestamp } = require('../utils/date-helpers');

const EVALUACIONES_FILE = path.join(__dirname, '../data/evaluaciones.json');

/**
 * Servicio para gestión de evaluaciones (Riesgo Cardiovascular, HADS, etc.)
 * Almacena resultados de evaluaciones y su relación con PDFs
 */

/**
 * Guarda una evaluación de riesgo cardiovascular
 * @param {Object} evaluacionData - Datos de la evaluación
 * @returns {Promise<Object>}
 */
const guardarRiesgoCardiovascular = async (evaluacionData) => {
  const data = await loadJsonFile(EVALUACIONES_FILE);
  if (!data.riesgo_cardiovascular) data.riesgo_cardiovascular = [];

  const nuevaEvaluacion = {
    id: `RCARDIO_${Date.now()}`,
    paciente_id: evaluacionData.paciente_id,
    numero_documento: evaluacionData.numero_documento,
    fecha_evaluacion: getCurrentTimestamp(),
    resultado: evaluacionData.resultado,
    score: evaluacionData.score,
    datos_medicion: evaluacionData.datos_medicion,
    pdf_path: evaluacionData.pdf_path || null,
    requiere_consulta: evaluacionData.requiere_consulta || false
  };

  data.riesgo_cardiovascular.push(nuevaEvaluacion);
  await saveJsonFile(EVALUACIONES_FILE, data);

  return nuevaEvaluacion;
};

/**
 * Guarda una evaluación HADS
 * @param {Object} evaluacionData - Datos de la evaluación
 * @returns {Promise<Object>}
 */
const guardarHADS = async (evaluacionData) => {
  const data = await loadJsonFile(EVALUACIONES_FILE);
  if (!data.hads) data.hads = [];

  const nuevaEvaluacion = {
    id: `HADS_${Date.now()}`,
    paciente_id: evaluacionData.paciente_id,
    numero_documento: evaluacionData.numero_documento,
    fecha_evaluacion: getCurrentTimestamp(),
    ansiedad: evaluacionData.ansiedad,
    depresion: evaluacionData.depresion,
    burnout: evaluacionData.burnout || null,
    pdf_path: evaluacionData.pdf_path || null
  };

  data.hads.push(nuevaEvaluacion);
  await saveJsonFile(EVALUACIONES_FILE, data);

  return nuevaEvaluacion;
};

/**
 * Obtiene evaluaciones de riesgo cardiovascular de un paciente
 * @param {string} pacienteId - ID del paciente
 * @returns {Promise<Array>}
 */
const getRiesgoCardiovascularByPaciente = async (pacienteId) => {
  const data = await loadJsonFile(EVALUACIONES_FILE);
  const evaluaciones = data.riesgo_cardiovascular || [];

  return evaluaciones
    .filter(e => e.paciente_id === pacienteId)
    .sort((a, b) => new Date(b.fecha_evaluacion) - new Date(a.fecha_evaluacion));
};

/**
 * Obtiene evaluaciones HADS de un paciente
 * @param {string} pacienteId - ID del paciente
 * @returns {Promise<Array>}
 */
const getHADSByPaciente = async (pacienteId) => {
  const data = await loadJsonFile(EVALUACIONES_FILE);
  const evaluaciones = data.hads || [];

  return evaluaciones
    .filter(e => e.paciente_id === pacienteId)
    .sort((a, b) => new Date(b.fecha_evaluacion) - new Date(a.fecha_evaluacion));
};

/**
 * Obtiene la última evaluación de riesgo cardiovascular de un paciente
 * @param {string} pacienteId - ID del paciente
 * @returns {Promise<Object|null>}
 */
const getUltimoRiesgoCardiovascular = async (pacienteId) => {
  const evaluaciones = await getRiesgoCardiovascularByPaciente(pacienteId);
  return evaluaciones.length > 0 ? evaluaciones[0] : null;
};

/**
 * Obtiene la última evaluación HADS de un paciente
 * @param {string} pacienteId - ID del paciente
 * @returns {Promise<Object|null>}
 */
const getUltimoHADS = async (pacienteId) => {
  const evaluaciones = await getHADSByPaciente(pacienteId);
  return evaluaciones.length > 0 ? evaluaciones[0] : null;
};

/**
 * Obtiene resumen de evaluaciones de un paciente
 * @param {string} pacienteId - ID del paciente
 * @returns {Promise<Object>}
 */
const getResumenEvaluaciones = async (pacienteId) => {
  const ultimoRiesgo = await getUltimoRiesgoCardiovascular(pacienteId);
  const ultimoHADS = await getUltimoHADS(pacienteId);

  return {
    riesgo_cardiovascular: ultimoRiesgo,
    hads: ultimoHADS,
    tiene_evaluaciones: !!(ultimoRiesgo || ultimoHADS)
  };
};

module.exports = {
  guardarRiesgoCardiovascular,
  guardarHADS,
  getRiesgoCardiovascularByPaciente,
  getHADSByPaciente,
  getUltimoRiesgoCardiovascular,
  getUltimoHADS,
  getResumenEvaluaciones
};
