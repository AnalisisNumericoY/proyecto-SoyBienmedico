const fs = require('fs').promises;
const path = require('path');

/**
 * Utilidad para manejo de archivos JSON
 * Proporciona funciones reutilizables para leer y escribir archivos
 */

/**
 * Carga un archivo JSON
 * @param {string} filePath - Ruta del archivo
 * @returns {Promise<Object>} - Contenido del archivo parseado
 */
const loadJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return {};
  }
};

/**
 * Guarda datos en un archivo JSON
 * @param {string} filePath - Ruta del archivo
 * @param {Object} data - Datos a guardar
 * @returns {Promise<boolean>} - true si se guardó correctamente
 */
const saveJsonFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error);
    return false;
  }
};

/**
 * Verifica si un archivo existe
 * @param {string} filePath - Ruta del archivo
 * @returns {Promise<boolean>} - true si existe
 */
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Crea un directorio si no existe
 * @param {string} dirPath - Ruta del directorio
 * @returns {Promise<boolean>} - true si se creó o ya existe
 */
const ensureDirectory = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    return false;
  }
};

module.exports = {
  loadJsonFile,
  saveJsonFile,
  fileExists,
  ensureDirectory
};
