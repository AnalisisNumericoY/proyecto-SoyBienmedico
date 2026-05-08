/**
 * ============================================
 * SCRIPT DE MIGRACIÓN DE DATOS A SUPABASE
 * Proyecto: SoyBienmedico
 * Fecha: Mayo 8, 2026
 * ============================================
 * 
 * Este script migra todos los datos de los archivos JSON
 * locales a las tablas de Supabase PostgreSQL
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================

const SUPABASE_URL = 'https://vljyrhrnwlzstqthydam.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsanlyaHJud2x6c3RxdGh5ZGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIwNjc0MCwiZXhwIjoyMDkzNzgyNzQwfQ.zbNaWZ6CYVLjvd7J5oQrptJjhMaeiMFzcb1aoD30nHM';

// Crear cliente de Supabase con service_role para bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ============================================
// RUTAS DE ARCHIVOS JSON
// ============================================

const DATA_DIR = path.join(__dirname, '../data');

const JSON_FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  pacientes: path.join(DATA_DIR, 'pacientes.json'),
  medicos: path.join(DATA_DIR, 'medicos.json'),
  citas: path.join(DATA_DIR, 'citas.json'),
  evaluaciones: path.join(DATA_DIR, 'evaluaciones.json'),
  historias: path.join(DATA_DIR, 'historias-clinicas.json'),
  capsulas: path.join(DATA_DIR, 'capsulas.json'),
  sesiones: path.join(DATA_DIR, 'sesiones-medicion.json'),
  mediciones: path.join(DATA_DIR, 'mediciones-temporales.json')
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Lee un archivo JSON y devuelve su contenido parseado
 */
async function loadJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error leyendo ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Inserta datos en una tabla de Supabase
 */
async function insertToTable(tableName, data, arrayKey, conflictKey = 'id') {
  if (!data || !data[arrayKey] || data[arrayKey].length === 0) {
    console.log(`⚠️  ${tableName}: No hay datos para migrar`);
    return { success: true, count: 0 };
  }

  const records = data[arrayKey];
  console.log(`\n📤 Migrando ${records.length} registros a tabla: ${tableName}`);

  try {
    const { data: insertedData, error } = await supabase
      .from(tableName)
      .upsert(records, { 
        onConflict: conflictKey,
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error(`❌ Error insertando en ${tableName}:`, error.message);
      console.error('Detalle:', error.details);
      console.error('Hint:', error.hint);
      return { success: false, count: 0, error };
    }

    console.log(`✅ ${tableName}: ${insertedData.length} registros migrados exitosamente`);
    return { success: true, count: insertedData.length };

  } catch (error) {
    console.error(`❌ Error en migración de ${tableName}:`, error.message);
    return { success: false, count: 0, error };
  }
}

/**
 * Limpia todas las tablas (opcional - para testing)
 */
async function clearAllTables() {
  console.log('\n🗑️  Limpiando tablas existentes...\n');
  
  const tables = [
    'mediciones_temporales',
    'sesiones_medicion',
    'historias_clinicas',
    'evaluaciones',
    'citas',
    'users',
    'pacientes',
    'medicos',
    'capsulas'
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '');
    if (error) {
      console.log(`⚠️  ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: limpiada`);
    }
  }
}

/**
 * Valida la migración contando registros
 */
async function validateMigration() {
  console.log('\n\n📊 VALIDACIÓN DE MIGRACIÓN\n');
  console.log('═'.repeat(50));

  const tables = [
    'users',
    'pacientes', 
    'medicos',
    'citas',
    'evaluaciones',
    'historias_clinicas',
    'capsulas',
    'sesiones_medicion',
    'mediciones_temporales'
  ];

  const results = [];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${table}: Error al contar`);
    } else {
      const countStr = String(count).padStart(3, ' ');
      console.log(`✅ ${table.padEnd(25, ' ')}: ${countStr} registros`);
      results.push({ table, count });
    }
  }

  console.log('═'.repeat(50));
  
  const total = results.reduce((sum, r) => sum + r.count, 0);
  console.log(`\n📈 TOTAL: ${total} registros migrados\n`);

  return results;
}

// ============================================
// FUNCIÓN PRINCIPAL DE MIGRACIÓN
// ============================================

async function migrateAllData() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('🚀 MIGRACIÓN DE DATOS A SUPABASE - SoyBienmedico');
  console.log('═'.repeat(60));
  console.log(`\n📅 Fecha: ${new Date().toLocaleString()}`);
  console.log(`🔗 URL: ${SUPABASE_URL}\n`);

  const startTime = Date.now();

  try {
    // Verificar conexión
    console.log('🔌 Verificando conexión a Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testError && testError.code !== 'PGRST116') {
      throw new Error(`No se pudo conectar a Supabase: ${testError.message}`);
    }
    console.log('✅ Conexión exitosa\n');

    // Preguntar si limpiar tablas (comentado por seguridad)
    // await clearAllTables();

    // ORDEN DE MIGRACIÓN (respetando Foreign Keys)
    console.log('\n📋 INICIANDO MIGRACIÓN DE DATOS\n');

    // 1. Capsulas (independiente)
    const capsulasData = await loadJsonFile(JSON_FILES.capsulas);
    await insertToTable('capsulas', capsulasData, 'capsulas');

    // 2. Pacientes (independiente)
    const pacientesData = await loadJsonFile(JSON_FILES.pacientes);
    await insertToTable('pacientes', pacientesData, 'pacientes');

    // 3. Médicos (independiente)
    const medicosData = await loadJsonFile(JSON_FILES.medicos);
    await insertToTable('medicos', medicosData, 'medicos');

    // 4. Users (depende de pacientes y médicos)
    const usersData = await loadJsonFile(JSON_FILES.users);
    await insertToTable('users', usersData, 'users', 'username');

    // 5. Citas (depende de pacientes y médicos)
    const citasData = await loadJsonFile(JSON_FILES.citas);
    await insertToTable('citas', citasData, 'citas');

    // 6. Evaluaciones (depende de pacientes)
    const evaluacionesData = await loadJsonFile(JSON_FILES.evaluaciones);
    await insertToTable('evaluaciones', evaluacionesData, 'evaluaciones');

    // 7. Historias clínicas (depende de pacientes, médicos, citas)
    const historiasData = await loadJsonFile(JSON_FILES.historias);
    await insertToTable('historias_clinicas', historiasData, 'historias');

    // 8. Sesiones de medición (depende de capsulas y pacientes)
    const sesionesData = await loadJsonFile(JSON_FILES.sesiones);
    await insertToTable('sesiones_medicion', sesionesData, 'sesiones');

    // 9. Mediciones temporales (depende de sesiones, pacientes, capsulas)
    const medicionesData = await loadJsonFile(JSON_FILES.mediciones);
    await insertToTable('mediciones_temporales', medicionesData, 'mediciones');

    // Validación final
    await validateMigration();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n');
    console.log('═'.repeat(60));
    console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('═'.repeat(60));
    console.log(`⏱️  Tiempo total: ${duration} segundos\n`);

    // Instrucciones siguientes
    console.log('📌 PRÓXIMOS PASOS:\n');
    console.log('1. ✅ Verifica los datos en Supabase Table Editor');
    console.log('2. 🔧 Actualiza el código backend para usar Supabase');
    console.log('3. 🧪 Prueba los endpoints (crear paciente, cita, etc.)');
    console.log('4. 🚀 Deploy a Railway con variables de entorno\n');

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN LA MIGRACIÓN:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================
// EJECUTAR MIGRACIÓN
// ============================================

// Verificar que estamos en el directorio correcto
if (!__dirname.includes('SoyBienmedico')) {
  console.error('❌ Error: Ejecuta este script desde el directorio raíz del proyecto');
  process.exit(1);
}

// Ejecutar
migrateAllData()
  .then(() => {
    console.log('✅ Script finalizado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
