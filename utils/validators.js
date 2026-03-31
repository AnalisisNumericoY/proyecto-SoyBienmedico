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

/**
 * Valida datos de evaluación de riesgo cardiovascular
 * @param {Object} datos - Datos de la evaluación
 * @returns {Object} - { valido: boolean, errores: Array<string> }
 */
const validarEvaluacionRiesgo = (datos) => {
  const errores = [];

  // Validar edad
  if (!datos.edad || datos.edad < 18 || datos.edad > 120) {
    errores.push('Edad debe estar entre 18 y 120 años');
  }

  // Validar sexo
  if (!datos.sexo || !['masculino', 'femenino'].includes(datos.sexo)) {
    errores.push('Sexo debe ser "masculino" o "femenino"');
  }

  // Validar fumador (booleano)
  if (typeof datos.fumador !== 'boolean') {
    errores.push('Campo fumador debe ser true o false');
  }

  // Validar presión arterial
  let sistolica = datos.sistolica;
  let diastolica = datos.diastolica;

  // Si vienen como objetos (con fuente de medición), extraer valor
  if (typeof sistolica === 'object' && sistolica.valor) {
    sistolica = sistolica.valor;
  }
  if (typeof diastolica === 'object' && diastolica.valor) {
    diastolica = diastolica.valor;
  }

  const presionValidation = validatePresionArterial(sistolica, diastolica);
  if (!presionValidation.valid) {
    errores.push(presionValidation.message);
  }

  // Validar colesterol si se conoce
  if (datos.conoceColesterol) {
    let colesterolTotal = datos.colesterolTotal;
    if (typeof colesterolTotal === 'object' && colesterolTotal.valor) {
      colesterolTotal = colesterolTotal.valor;
    }

    if (!colesterolTotal || colesterolTotal < 100 || colesterolTotal > 500) {
      errores.push('Colesterol total debe estar entre 100 y 500 mg/dL');
    }

    if (datos.hdl) {
      let hdl = typeof datos.hdl === 'object' ? datos.hdl.valor : datos.hdl;
      if (hdl < 20 || hdl > 100) {
        errores.push('HDL debe estar entre 20 y 100 mg/dL');
      }
    }
  }

  // Validar peso y talla si se proporcionan
  if (datos.peso) {
    let peso = typeof datos.peso === 'object' ? datos.peso.valor : datos.peso;
    if (peso < 30 || peso > 300) {
      errores.push('Peso debe estar entre 30 y 300 kg');
    }
  }

  if (datos.talla) {
    let talla = typeof datos.talla === 'object' ? datos.talla.valor : datos.talla;
    if (talla < 120 || talla > 220) {
      errores.push('Talla debe estar entre 120 y 220 cm');
    }
  }

  // Validar HbA1c si se proporciona
  if (datos.hba1c) {
    let hba1c = typeof datos.hba1c === 'object' ? datos.hba1c.valor : datos.hba1c;
    if (hba1c < 3 || hba1c > 15) {
      errores.push('HbA1c debe estar entre 3 y 15%');
    }
  }

  return {
    valido: errores.length === 0,
    errores
  };
};

module.exports = {
  validateRequiredFields,
  isValidDocumento,
  isValidEmail,
  isInRange,
  validatePresionArterial,
  validarEvaluacionRiesgo
};
