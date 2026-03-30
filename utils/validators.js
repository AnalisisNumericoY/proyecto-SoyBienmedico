/**
 * Utilidades de validación reutilizables
 */

/**
 * Valida que un objeto tenga todos los campos requeridos
 * @param {Object} obj - Objeto a validar
 * @param {Array<string>} requiredFields - Lista de campos requeridos
 * @returns {Object} - { valid: boolean, missing: Array<string> }
 */
const validateRequiredFields = (obj, requiredFields) => {
  const missing = requiredFields.filter(field => !obj[field]);
  return {
    valid: missing.length === 0,
    missing
  };
};

/**
 * Valida número de documento
 * @param {string} documento - Número de documento
 * @returns {boolean}
 */
const isValidDocumento = (documento) => {
  return documento && documento.trim().length > 0;
};

/**
 * Valida email
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida rango numérico
 * @param {number} value - Valor a validar
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {boolean}
 */
const isInRange = (value, min, max) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Valida presión arterial
 * @param {number} sistolica - Presión sistólica
 * @param {number} diastolica - Presión diastólica
 * @returns {Object} - { valid: boolean, message: string }
 */
const validatePresionArterial = (sistolica, diastolica) => {
  const sistolicaNum = parseFloat(sistolica);
  const diastolicaNum = parseFloat(diastolica);

  if (isNaN(sistolicaNum) || isNaN(diastolicaNum)) {
    return { valid: false, message: 'Valores de presión arterial inválidos' };
  }

  if (sistolicaNum < 70 || sistolicaNum > 250) {
    return { valid: false, message: 'Presión sistólica fuera de rango (70-250)' };
  }

  if (diastolicaNum < 40 || diastolicaNum > 150) {
    return { valid: false, message: 'Presión diastólica fuera de rango (40-150)' };
  }

  if (sistolicaNum <= diastolicaNum) {
    return { valid: false, message: 'La presión sistólica debe ser mayor que la diastólica' };
  }

  return { valid: true, message: 'Presión arterial válida' };
};

module.exports = {
  validateRequiredFields,
  isValidDocumento,
  isValidEmail,
  isInRange,
  validatePresionArterial
};
