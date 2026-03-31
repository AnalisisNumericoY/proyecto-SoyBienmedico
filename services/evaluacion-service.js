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

// ============================================================================
// SPRINT 2: Métodos genéricos y reutilizables para evaluaciones
// ============================================================================

/**
 * Crear evaluación (método genérico para cualquier tipo)
 * @param {Object} evaluacionData - Datos completos de la evaluación
 * @returns {Promise<Object>}
 */
const crearEvaluacion = async (evaluacionData) => {
  const data = await loadJsonFile(EVALUACIONES_FILE);
  if (!data.evaluaciones) data.evaluaciones = [];

  // Generar ID único
  const tipoPrefix = evaluacionData.tipo.toUpperCase().replace(/_/g, '');
  const id = `EVAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const nuevaEvaluacion = {
    id,
    tipo: evaluacionData.tipo,
    paciente_id: evaluacionData.paciente_id,
    sesion_id: evaluacionData.sesion_id || null,
    fecha: getCurrentTimestamp(),
    datos_entrada: evaluacionData.datos_entrada,
    resultado: evaluacionData.resultado,
    pdf_path: null, // Se actualiza después de generar PDF
    creado_por: evaluacionData.creado_por,
    version_algoritmo: evaluacionData.version_algoritmo || '1.0'
  };

  data.evaluaciones.push(nuevaEvaluacion);
  await saveJsonFile(EVALUACIONES_FILE, data);

  console.log(`✅ Evaluación creada: ${id} - Tipo: ${evaluacionData.tipo}`);
  return nuevaEvaluacion;
};

/**
 * Obtener evaluación por ID
 * @param {string} evaluacionId - ID de la evaluación
 * @returns {Promise<Object|null>}
 */
const obtenerEvaluacionPorId = async (evaluacionId) => {
  const data = await loadJsonFile(EVALUACIONES_FILE);
  const evaluaciones = data.evaluaciones || [];

  return evaluaciones.find(e => e.id === evaluacionId) || null;
};

/**
 * Obtener evaluaciones por paciente (con filtros)
 * @param {string} pacienteId - ID del paciente
 * @param {string} tipo - Tipo de evaluación (opcional)
 * @param {number} limit - Límite de resultados
 * @param {number} offset - Offset para paginación
 * @returns {Promise<Array>}
 */
const obtenerEvaluacionesPorPaciente = async (pacienteId, tipo = null, limit = 50, offset = 0) => {
  const data = await loadJsonFile(EVALUACIONES_FILE);
  const evaluaciones = data.evaluaciones || [];

  let filtradas = evaluaciones.filter(e => e.paciente_id === pacienteId);

  // Filtrar por tipo si se especifica
  if (tipo) {
    filtradas = filtradas.filter(e => e.tipo === tipo);
  }

  // Ordenar por fecha (más reciente primero)
  filtradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  // Aplicar paginación
  return filtradas.slice(offset, offset + limit);
};

/**
 * Actualizar ruta del PDF de una evaluación
 * @param {string} evaluacionId - ID de la evaluación
 * @param {string} pdfPath - Ruta relativa del PDF
 * @returns {Promise<void>}
 */
const actualizarPDFPath = async (evaluacionId, pdfPath) => {
  const data = await loadJsonFile(EVALUACIONES_FILE);
  if (!data.evaluaciones) return;

  const evaluacion = data.evaluaciones.find(e => e.id === evaluacionId);
  if (evaluacion) {
    evaluacion.pdf_path = pdfPath;
    await saveJsonFile(EVALUACIONES_FILE, data);
    console.log(`✅ PDF actualizado para evaluación ${evaluacionId}: ${pdfPath}`);
  }
};

/**
 * Obtener estadísticas de evaluaciones de un paciente
 * @param {string} pacienteId - ID del paciente
 * @returns {Promise<Object>}
 */
const obtenerEstadisticasPaciente = async (pacienteId) => {
  const data = await loadJsonFile(EVALUACIONES_FILE);
  const evaluaciones = (data.evaluaciones || []).filter(e => e.paciente_id === pacienteId);

  const stats = {
    total: evaluaciones.length,
    por_tipo: {},
    ultima_evaluacion: null
  };

  evaluaciones.forEach(e => {
    stats.por_tipo[e.tipo] = (stats.por_tipo[e.tipo] || 0) + 1;
  });

  if (evaluaciones.length > 0) {
    evaluaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    stats.ultima_evaluacion = {
      id: evaluaciones[0].id,
      tipo: evaluaciones[0].tipo,
      fecha: evaluaciones[0].fecha,
      resultado_resumen: evaluaciones[0].resultado.categoria || evaluaciones[0].resultado
    };
  }

  return stats;
};

module.exports = {
  // Métodos legacy (mantener compatibilidad)
  guardarRiesgoCardiovascular,
  guardarHADS,
  getRiesgoCardiovascularByPaciente,
  getHADSByPaciente,
  getUltimoRiesgoCardiovascular,
  getUltimoHADS,
  getResumenEvaluaciones,
  
  // Métodos nuevos genéricos (Sprint 2)
  crearEvaluacion,
  obtenerEvaluacionPorId,
  obtenerEvaluacionesPorPaciente,
  actualizarPDFPath,
  obtenerEstadisticasPaciente
};
