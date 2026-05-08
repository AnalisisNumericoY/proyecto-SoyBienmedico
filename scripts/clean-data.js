/**
 * ============================================
 * SCRIPT DE LIMPIEZA DE DATOS
 * Elimina datos de desarrollo y mantiene solo
 * datos de producción de Mayo 2026
 * ============================================
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

async function cleanData() {
  console.log('\n🧹 LIMPIEZA DE DATOS - Inicio\n');
  console.log('═'.repeat(50));

  try {
    // 1. USERS - Mantener admin001 + Mayo 2026 + eliminar duplicados
    console.log('\n📁 Limpiando users.json...');
    const usersPath = path.join(DATA_DIR, 'users.json');
    const usersData = JSON.parse(await fs.readFile(usersPath, 'utf-8'));
    
    let cleanUsers = usersData.users.filter(user => {
      // Mantener admin
      if (user.role === 'admin') return true;
      
      // Eliminar usuarios demo de 2024
      if (user.created_at && user.created_at.startsWith('2024')) return false;
      
      // Eliminar usuarios de desarrollo de 2025
      if (user.created_at && user.created_at.startsWith('2025')) return false;
      
      // Mantener usuarios de 2026 (Mayo - jornada)
      return true;
    });
    
    // Eliminar duplicados basado en username (mantener el primero)
    const seenUsernames = new Set();
    const usersBeforeDedupe = cleanUsers.length;
    cleanUsers = cleanUsers.filter(user => {
      if (seenUsernames.has(user.username)) {
        return false;  // Ya existe, eliminarlo
      }
      seenUsernames.add(user.username);
      return true;
    });
    
    const totalRemoved = usersData.users.length - cleanUsers.length;
    const duplicatesRemoved = usersBeforeDedupe - cleanUsers.length;
    
    await fs.writeFile(usersPath, JSON.stringify({ users: cleanUsers }, null, 2));
    console.log(`✅ Users: ${usersData.users.length} → ${cleanUsers.length} (eliminados: ${totalRemoved}, duplicados: ${duplicatesRemoved})`);

    // 2. MEDICOS - Eliminar DOC001 (demo)
    console.log('\n📁 Limpiando medicos.json...');
    const medicosPath = path.join(DATA_DIR, 'medicos.json');
    const medicosData = JSON.parse(await fs.readFile(medicosPath, 'utf-8'));
    
    const cleanMedicos = medicosData.medicos.filter(medico => {
      return medico.id !== 'DOC001'; // Eliminar demo
    });
    
    await fs.writeFile(medicosPath, JSON.stringify({ medicos: cleanMedicos }, null, 2));
    console.log(`✅ Médicos: ${medicosData.medicos.length} → ${cleanMedicos.length} (eliminados: ${medicosData.medicos.length - cleanMedicos.length})`);

    // 3. CITAS - Eliminar citas con pacientes/médicos que no existen
    console.log('\n📁 Limpiando citas.json...');
    const citasPath = path.join(DATA_DIR, 'citas.json');
    const citasData = JSON.parse(await fs.readFile(citasPath, 'utf-8'));
    
    // Obtener IDs válidos de pacientes y médicos
    const pacientesFilePath = path.join(DATA_DIR, 'pacientes.json');
    const pacientesValidData = JSON.parse(await fs.readFile(pacientesFilePath, 'utf-8'));
    const pacienteIdsValidos = new Set(pacientesValidData.pacientes.map(p => p.id));
    const medicoIdsValidos = new Set(cleanMedicos.map(m => m.id));
    
    const cleanCitas = citasData.citas.filter(cita => {
      // Eliminar citas con pacientes que no existen
      if (!pacienteIdsValidos.has(cita.paciente_id)) return false;
      
      // Eliminar citas con médicos que no existen
      if (!medicoIdsValidos.has(cita.medico_id)) return false;
      
      // Eliminar citas de 2024-2025
      if (cita.fecha && (cita.fecha.startsWith('2024') || cita.fecha.startsWith('2025'))) return false;
      
      return true;
    });
    
    await fs.writeFile(citasPath, JSON.stringify({ citas: cleanCitas }, null, 2));
    console.log(`✅ Citas: ${citasData.citas.length} → ${cleanCitas.length} (eliminadas: ${citasData.citas.length - cleanCitas.length})`);

    // 4. EVALUACIONES - Eliminar evaluaciones de PAC001
    console.log('\n📁 Limpiando evaluaciones.json...');
    const evaluacionesPath = path.join(DATA_DIR, 'evaluaciones.json');
    const evaluacionesData = JSON.parse(await fs.readFile(evaluacionesPath, 'utf-8'));
    
    const cleanEvaluaciones = evaluacionesData.evaluaciones.filter(eval => {
      // Eliminar evaluaciones de PAC001
      if (eval.paciente_id === 'PAC001') return false;
      
      // Eliminar evaluaciones anteriores a Mayo 2026
      if (eval.fecha && !eval.fecha.startsWith('2026-05')) return false;
      
      return true;
    });
    
    await fs.writeFile(evaluacionesPath, JSON.stringify({ evaluaciones: cleanEvaluaciones }, null, 2));
    console.log(`✅ Evaluaciones: ${evaluacionesData.evaluaciones.length} → ${cleanEvaluaciones.length} (eliminadas: ${evaluacionesData.evaluaciones.length - cleanEvaluaciones.length})`);

    // 5. HISTORIAS CLÍNICAS - Eliminar historias de PAC001/DOC001
    console.log('\n📁 Limpiando historias-clinicas.json...');
    const historiasPath = path.join(DATA_DIR, 'historias-clinicas.json');
    const historiasData = JSON.parse(await fs.readFile(historiasPath, 'utf-8'));
    
    const cleanHistorias = historiasData.historias.filter(historia => {
      // Eliminar historias de PAC001 o DOC001
      if (historia.paciente_id === 'PAC001' || historia.medico_id === 'DOC001') return false;
      
      // Eliminar historias de 2024-2025
      if (historia.created_at && (historia.created_at.startsWith('2024') || historia.created_at.startsWith('2025'))) return false;
      
      return true;
    });
    
    await fs.writeFile(historiasPath, JSON.stringify({ historias: cleanHistorias }, null, 2));
    console.log(`✅ Historias: ${historiasData.historias.length} → ${cleanHistorias.length} (eliminadas: ${historiasData.historias.length - cleanHistorias.length})`);

    // 6. SESIONES MEDICIÓN - Eliminar sesiones viejas con PAC001
    console.log('\n📁 Limpiando sesiones-medicion.json...');
    const sesionesPath = path.join(DATA_DIR, 'sesiones-medicion.json');
    const sesionesData = JSON.parse(await fs.readFile(sesionesPath, 'utf-8'));
    
    const cleanSesiones = sesionesData.sesiones.filter(sesion => {
      // Eliminar sesiones de PAC001
      if (sesion.paciente_id === 'PAC001') return false;
      
      // Eliminar sesiones anteriores a Mayo 2026
      if (sesion.inicio && !sesion.inicio.startsWith('2026-05')) return false;
      
      return true;
    });
    
    await fs.writeFile(sesionesPath, JSON.stringify({ sesiones: cleanSesiones }, null, 2));
    console.log(`✅ Sesiones: ${sesionesData.sesiones.length} → ${cleanSesiones.length} (eliminadas: ${sesionesData.sesiones.length - cleanSesiones.length})`);

    // 7. MEDICIONES TEMPORALES - Eliminar mediciones con recibido_en, PAC001, y sesiones inexistentes
    console.log('\n📁 Limpiando mediciones-temporales.json...');
    const medicionesPath = path.join(DATA_DIR, 'mediciones-temporales.json');
    const medicionesData = JSON.parse(await fs.readFile(medicionesPath, 'utf-8'));
    
    const cleanMediciones = medicionesData.mediciones.filter(medicion => {
      // Eliminar mediciones con campo recibido_en (viejas)
      if (medicion.recibido_en) return false;
      
      // Eliminar mediciones de PAC001
      if (medicion.paciente_id === 'PAC001') return false;
      
      // Eliminar mediciones que referencian sesiones (ya que no hay sesiones)
      if (medicion.sesion_id) return false;
      
      return true;
    });
    
    await fs.writeFile(medicionesPath, JSON.stringify({ mediciones: cleanMediciones }, null, 2));
    console.log(`✅ Mediciones: ${medicionesData.mediciones.length} → ${cleanMediciones.length} (eliminadas: ${medicionesData.mediciones.length - cleanMediciones.length})`);

    // 8. PACIENTES - Ya está limpio (solo Mayo 2026)
    console.log('\n📁 Verificando pacientes.json...');
    const pacientesPath = path.join(DATA_DIR, 'pacientes.json');
    const pacientesData = JSON.parse(await fs.readFile(pacientesPath, 'utf-8'));
    console.log(`✅ Pacientes: ${pacientesData.pacientes.length} (sin cambios - ya limpio)`);

    // 9. CAPSULAS - Mantener como está
    console.log('\n📁 Verificando capsulas.json...');
    const capsulasPath = path.join(DATA_DIR, 'capsulas.json');
    const capsulasData = JSON.parse(await fs.readFile(capsulasPath, 'utf-8'));
    console.log(`✅ Cápsulas: ${capsulasData.capsulas.length} (sin cambios)`);

    console.log('\n═'.repeat(50));
    console.log('✅ LIMPIEZA COMPLETADA\n');
    
    console.log('📊 RESUMEN DE DATOS LIMPIOS:\n');
    console.log(`  • Pacientes:   ${pacientesData.pacientes.length} (jornada Mayo 6)`);
    console.log(`  • Médicos:     ${cleanMedicos.length} (reales)`);
    console.log(`  • Users:       ${cleanUsers.length} (admin + Mayo 2026)`);
    console.log(`  • Citas:       ${cleanCitas.length} (Mayo 2026)`);
    console.log(`  • Evaluaciones: ${cleanEvaluaciones.length} (Mayo 2026)`);
    console.log(`  • Historias:   ${cleanHistorias.length} (Mayo 2026)`);
    console.log(`  • Sesiones:    ${cleanSesiones.length} (Mayo 2026)`);
    console.log(`  • Mediciones:  ${cleanMediciones.length} (recientes)`);
    console.log(`  • Cápsulas:    ${capsulasData.capsulas.length}\n`);

  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    process.exit(1);
  }
}

cleanData()
  .then(() => {
    console.log('✅ Limpieza finalizada. Ahora ejecuta: node scripts/migrate-to-supabase.js\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
