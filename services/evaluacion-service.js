const supabase = require('../config/supabase');
const { getCurrentTimestamp } = require('../utils/date-helpers');

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
  const nuevaEvaluacion = {
    id: `RCARDIO_${Date.now()}`,
    tipo: 'riesgo_cardiovascular',
    paciente_id: evaluacionData.paciente_id,
    numero_documento: evaluacionData.numero_documento,
    fecha: getCurrentTimestamp(),
    resultado: evaluacionData.resultado,
    score: evaluacionData.score,
    datos_entrada: evaluacionData.datos_medicion || {},
    pdf_path: evaluacionData.pdf_path || null,
    requiere_consulta: evaluacionData.requiere_consulta || false,
    creado_por: evaluacionData.creado_por || null,
    version_algoritmo: '1.0'
  };

  const { data, error } = await supabase
    .from('evaluaciones')
    .insert([nuevaEvaluacion])
    .select();

  if (error) throw error;

  return data[0];
};

/**
 * Guarda una evaluación HADS
 * @param {Object} evaluacionData - Datos de la evaluación
 * @returns {Promise<Object>}
 */
const guardarHADS = async (evaluacionData) => {
  const nuevaEvaluacion = {
    id: `HADS_${Date.now()}`,
    tipo: 'hads',
    paciente_id: evaluacionData.paciente_id,
    numero_documento: evaluacionData.numero_documento,
    fecha: getCurrentTimestamp(),
    resultado: {
      ansiedad: evaluacionData.ansiedad,
      depresion: evaluacionData.depresion,
      burnout: evaluacionData.burnout || null
    },
    datos_entrada: evaluacionData.datos_entrada || {},
    pdf_path: evaluacionData.pdf_path || null,
    creado_por: evaluacionData.creado_por || null,
    version_algoritmo: '1.0'
  };

  const { data, error } = await supabase
    .from('evaluaciones')
    .insert([nuevaEvaluacion])
    .select();

  if (error) throw error;

  return data[0];
};

/**
 * Obtiene evaluaciones de riesgo cardiovascular de un paciente
 * @param {string} pacienteId - ID del paciente
 * @returns {Promise<Array>}
 */
const getRiesgoCardiovascularByPaciente = async (pacienteId) => {
  const { data, error } = await supabase
    .from('evaluaciones')
    .select('*')
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'riesgo_cardiovascular')
    .order('fecha', { ascending: false });

  if (error) throw error;

  return data || [];
};

/**
 * Obtiene evaluaciones HADS de un paciente
 * @param {string} pacienteId - ID del paciente
 * @returns {Promise<Array>}
 */
const getHADSByPaciente = async (pacienteId) => {
  const { data, error } = await supabase
    .from('evaluaciones')
    .select('*')
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'hads')
    .order('fecha', { ascending: false });

  if (error) throw error;

  return data || [];
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
  // Generar ID único
  const id = `EVAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const nuevaEvaluacion = {
    id,
    tipo: evaluacionData.tipo,
    paciente_id: evaluacionData.paciente_id,
    sesion_id: evaluacionData.sesion_id || null,
    jornada_id: evaluacionData.jornada_id || null,
    fecha: getCurrentTimestamp(),
    datos_entrada: evaluacionData.datos_entrada,
    resultado: evaluacionData.resultado,
    pdf_path: null, // Se actualiza después de generar PDF
    creado_por: evaluacionData.creado_por,
    version_algoritmo: evaluacionData.version_algoritmo || '1.0'
  };

  const { data, error } = await supabase
    .from('evaluaciones')
    .insert([nuevaEvaluacion])
    .select();

  if (error) throw error;

  console.log(`✅ Evaluación creada: ${id} - Tipo: ${evaluacionData.tipo}${evaluacionData.jornada_id ? ` - Jornada: ${evaluacionData.jornada_id}` : ''}`);
  return data[0];
};

/**
 * Obtener evaluación por ID
 * @param {string} evaluacionId - ID de la evaluación
 * @returns {Promise<Object|null>}
 */
const obtenerEvaluacionPorId = async (evaluacionId) => {
  const { data, error } = await supabase
    .from('evaluaciones')
    .select('*')
    .eq('id', evaluacionId)
    .limit(1);

  if (error) throw error;

  return data && data.length > 0 ? data[0] : null;
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
  let query = supabase
    .from('evaluaciones')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('fecha', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filtrar por tipo si se especifica
  if (tipo) {
    query = query.eq('tipo', tipo);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
};

/**
 * Actualizar ruta del PDF de una evaluación
 * @param {string} evaluacionId - ID de la evaluación
 * @param {string} pdfPath - Ruta relativa del PDF
 * @returns {Promise<void>}
 */
const actualizarPDFPath = async (evaluacionId, pdfPath) => {
  const { error } = await supabase
    .from('evaluaciones')
    .update({ pdf_path: pdfPath })
    .eq('id', evaluacionId);

  if (error) throw error;

  console.log(`✅ PDF actualizado para evaluación ${evaluacionId}: ${pdfPath}`);
};

/**
 * Obtener estadísticas de evaluaciones de un paciente
 * @param {string} pacienteId - ID del paciente
 * @returns {Promise<Object>}
 */
const obtenerEstadisticasPaciente = async (pacienteId) => {
  const { data: evaluaciones } = await supabase
    .from('evaluaciones')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('fecha', { ascending: false });

  const stats = {
    total: evaluaciones?.length || 0,
    por_tipo: {},
    ultima_evaluacion: null
  };

  if (evaluaciones && evaluaciones.length > 0) {
    evaluaciones.forEach(e => {
      stats.por_tipo[e.tipo] = (stats.por_tipo[e.tipo] || 0) + 1;
    });

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
