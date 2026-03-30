const path = require('path');
const { loadJsonFile, saveJsonFile } = require('../utils/file-handler');

const CAPSULAS_FILE = path.join(__dirname, '../data/capsulas.json');

/**
 * Servicio para gestión de cápsulas
 * Maneja múltiples ubicaciones de cápsulas en diferentes países
 */

/**
 * Obtiene todas las cápsulas
 * @returns {Promise<Array>}
 */
const getAllCapsulas = async () => {
  const data = await loadJsonFile(CAPSULAS_FILE);
  return data.capsulas || [];
};

/**
 * Obtiene una cápsula por ID
 * @param {string} capsulaId - ID de la cápsula
 * @returns {Promise<Object|null>}
 */
const getCapsulaById = async (capsulaId) => {
  const capsulas = await getAllCapsulas();
  return capsulas.find(c => c.id === capsulaId) || null;
};

/**
 * Obtiene cápsulas activas
 * @returns {Promise<Array>}
 */
const getActiveCapsulas = async () => {
  const capsulas = await getAllCapsulas();
  return capsulas.filter(c => c.activa === true);
};

/**
 * Crea una nueva cápsula
 * @param {Object} capsulaData - Datos de la cápsula
 * @returns {Promise<Object>}
 */
const createCapsula = async (capsulaData) => {
  const data = await loadJsonFile(CAPSULAS_FILE);
  if (!data.capsulas) data.capsulas = [];

  const newCapsula = {
    id: `CAPSULA_${Date.now()}`,
    nombre: capsulaData.nombre,
    ubicacion: capsulaData.ubicacion,
    dispositivos: capsulaData.dispositivos || [],
    activa: true,
    created_at: new Date().toISOString()
  };

  data.capsulas.push(newCapsula);
  await saveJsonFile(CAPSULAS_FILE, data);

  return newCapsula;
};

/**
 * Actualiza una cápsula
 * @param {string} capsulaId - ID de la cápsula
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<Object|null>}
 */
const updateCapsula = async (capsulaId, updates) => {
  const data = await loadJsonFile(CAPSULAS_FILE);
  const index = data.capsulas?.findIndex(c => c.id === capsulaId);

  if (index === -1) return null;

  data.capsulas[index] = {
    ...data.capsulas[index],
    ...updates,
    updated_at: new Date().toISOString()
  };

  await saveJsonFile(CAPSULAS_FILE, data);
  return data.capsulas[index];
};

module.exports = {
  getAllCapsulas,
  getCapsulaById,
  getActiveCapsulas,
  createCapsula,
  updateCapsula
};
