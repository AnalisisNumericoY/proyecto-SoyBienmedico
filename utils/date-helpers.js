/**
 * Utilidades para manejo de fechas
 */

/**
 * Obtiene timestamp actual en formato ISO
 * @returns {string} - Timestamp ISO
 */
const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Formatea fecha para mostrar
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada DD/MM/YYYY HH:mm
 */
const formatDateTime = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Formatea solo la fecha
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada DD/MM/YYYY
 */
const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Calcula edad a partir de fecha de nacimiento
 * @param {string|Date} birthDate - Fecha de nacimiento
 * @returns {number} - Edad en años
 */
const calculateAge = (birthDate) => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Verifica si una fecha es hoy
 * @param {string|Date} date - Fecha a verificar
 * @returns {boolean}
 */
const isToday = (date) => {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

/**
 * Obtiene el inicio del día actual
 * @returns {Date}
 */
const getStartOfDay = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Obtiene el fin del día actual
 * @returns {Date}
 */
const getEndOfDay = () => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
};

module.exports = {
  getCurrentTimestamp,
  formatDateTime,
  formatDate,
  calculateAge,
  isToday,
  getStartOfDay,
  getEndOfDay
};
