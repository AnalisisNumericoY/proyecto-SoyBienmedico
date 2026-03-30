const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { verifyToken } = require('./auth');
const sesionService = require('../services/sesion-service');
const medicionService = require('../services/medicion-service');
const router = express.Router();

// File paths
const CITAS_FILE = path.join(__dirname, '../data/citas.json');
const MEDICOS_FILE = path.join(__dirname, '../data/medicos.json');
const PACIENTES_FILE = path.join(__dirname, '../data/pacientes.json');
const HISTORIAS_FILE = path.join(__dirname, '../data/historias-clinicas.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');

// Helper function to load JSON file
const loadJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return {};
  }
};

// Helper function to save JSON file
const saveJsonFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error);
    return false;
  }
};

// GET ALL MEDICOS
router.get('/medicos', async (req, res) => {
  try {
    const medicosData = await loadJsonFile(MEDICOS_FILE);
    res.json({
      success: true,
      medicos: medicosData.medicos || []
    });
  } catch (error) {
    console.error('Error loading medicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET ALL PACIENTES
router.get('/pacientes', async (req, res) => {
  try {
    const pacientesData = await loadJsonFile(PACIENTES_FILE);
    res.json({
      success: true,
      pacientes: pacientesData.pacientes || []
    });
  } catch (error) {
    console.error('Error loading pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET CITA BY ROOM ID (for video calls)
router.get('/cita/room/:roomId', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    const citasData = await loadJsonFile(CITAS_FILE);
    const medicosData = await loadJsonFile(MEDICOS_FILE);
    const pacientesData = await loadJsonFile(PACIENTES_FILE);

    const cita = citasData.citas?.find(c => c.room_id === roomId);
    
    if (!cita) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Verify user has access to this cita
    let hasAccess = false;
    if (userRole === 'medico' && cita.medico_id === req.user.medicoId) {
      hasAccess = true;
    } else if (userRole === 'paciente' && cita.paciente_id === req.user.pacienteId) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para acceder a esta cita'
      });
    }

    // Get additional info
    const medico = medicosData.medicos?.find(m => m.id === cita.medico_id);
    const paciente = pacientesData.pacientes?.find(p => p.id === cita.paciente_id);

    res.json({
      success: true,
      cita: {
        ...cita,
        medico_nombre: medico ? medico.nombre : 'Médico no encontrado',
        medico_registro: medico ? medico.registro_medico : '',
        paciente_nombre: paciente ? `${paciente.nombre} ${paciente.apellidos}` : 'Paciente no encontrado',
        paciente_documento: paciente ? paciente.numero_documento : ''
      }
    });

  } catch (error) {
    console.error('Error getting cita by room:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// UPDATE CITA STATUS
router.put('/cita/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['programada', 'en_curso', 'completada', 'cancelada'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const citasData = await loadJsonFile(CITAS_FILE);
    const citaIndex = citasData.citas?.findIndex(c => c.id === id);

    if (citaIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const cita = citasData.citas[citaIndex];
    
    // Verify user has access to this cita
    let hasAccess = false;
    if (req.user.role === 'medico' && cita.medico_id === req.user.medicoId) {
      hasAccess = true;
    } else if (req.user.role === 'paciente' && cita.paciente_id === req.user.pacienteId) {
      hasAccess = true;
    } else if (req.user.role === 'admin') {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para modificar esta cita'
      });
    }

    citasData.citas[citaIndex].estado = status;
    citasData.citas[citaIndex].updated_at = new Date().toISOString();

    const saved = await saveJsonFile(CITAS_FILE, citasData);
    if (saved) {
      res.json({
        success: true,
        message: 'Estado de cita actualizado',
        cita: citasData.citas[citaIndex]
      });
    } else {
      throw new Error('Error al actualizar la cita');
    }

  } catch (error) {
    console.error('Error updating cita status:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ENDPOINT ESPECÍFICO PARA DISPOSITIVOS IoT DEL PROVEEDOR (measure_sim.json)
router.post('/mediciones/recibir/measure_sim.json', async (req, res) => {
  try {
    console.log('📊 Nueva medición recibida desde dispositivo IoT (measure_sim):', JSON.stringify(req.body, null, 2));
    
    // El proveedor envía los datos en un formato específico
    const datosDispositivo = req.body;
    
    // Extraer capsula_id del request (puede venir en body, query o headers)
    // Por ahora usamos la cápsula por defecto, pero esto debe parametrizarse según el dispositivo
    const capsulaId = req.body.capsula_id || req.query.capsula_id || req.headers['x-capsula-id'] || 'CAPSULA_DEFAULT_01';
    
    // VERIFICAR SI HAY UNA SESIÓN ACTIVA EN LA CÁPSULA
    const sesionActiva = await sesionService.getSesionActivaByCapsula(capsulaId);
    
    if (sesionActiva) {
      // ✅ HAY SESIÓN ACTIVA - Guardar medición asociada al paciente
      console.log(`✅ Sesión activa encontrada: ${sesionActiva.id} - Paciente: ${sesionActiva.numero_documento}`);
      
      // Extraer tipo de dispositivo de los datos recibidos
      // Adaptamos el formato del proveedor al formato interno
      let dispositivoTipo = 'desconocido';
      let valoresAdaptados = {};
      
      // Detectar tipo de dispositivo según estructura de datos (esto depende del formato del proveedor)
      if (datosDispositivo.measure && Array.isArray(datosDispositivo.measure)) {
        // Analizar los datos para determinar el tipo
        const primeraMedida = datosDispositivo.measure[0];
        if (primeraMedida) {
          if (primeraMedida.hasOwnProperty('systolic') || primeraMedida.hasOwnProperty('diastolic')) {
            dispositivoTipo = 'tensiometro';
            valoresAdaptados = {
              sistolica: primeraMedida.systolic,
              diastolica: primeraMedida.diastolic,
              pulso: primeraMedida.pulse
            };
          } else if (primeraMedida.hasOwnProperty('spo2')) {
            dispositivoTipo = 'pulsoximetro';
            valoresAdaptados = {
              spo2: primeraMedida.spo2,
              pulso: primeraMedida.pulse
            };
          } else if (primeraMedida.hasOwnProperty('weight')) {
            dispositivoTipo = 'balanza';
            valoresAdaptados = {
              peso: primeraMedida.weight
            };
          }
        }
      }
      
      // Guardar medición usando el servicio de mediciones (con asociación al paciente)
      const medicionGuardada = await medicionService.guardarMedicion({
        paciente_id: sesionActiva.paciente_id,
        sesion_id: sesionActiva.id,
        capsula_id: capsulaId,
        dispositivo_tipo: dispositivoTipo,
        dispositivo_id: datosDispositivo.device_id || 'DEVICE_UNKNOWN',
        valores: valoresAdaptados,
        datos_originales: datosDispositivo
      });
      
      // Incrementar contador de mediciones en la sesión
      await sesionService.incrementarMediciones(sesionActiva.id);
      
      console.log(`✅ Medición asociada al paciente ${sesionActiva.numero_documento} guardada con ID: ${medicionGuardada.id}`);
      
      res.status(200).json({
        success: true,
        message: 'Medición recibida y asociada al paciente',
        id: medicionGuardada.id,
        timestamp: medicionGuardada.timestamp,
        paciente_documento: sesionActiva.numero_documento,
        sesion_id: sesionActiva.id
      });
      
    } else {
      // ⚠️ NO HAY SESIÓN ACTIVA - Guardar como temporal (comportamiento legacy)
      console.warn(`⚠️ NO HAY SESIÓN ACTIVA en cápsula ${capsulaId}. Guardando medición como temporal (sin asociar a paciente).`);
      
      // Crear registro de medición temporal (comportamiento original)
      const medicion = {
        id: generarUUID(),
        datos_originales: datosDispositivo,
        recibido_en: new Date().toISOString(),
        procesado: false, // marcamos como no procesado porque no está asociado
        origen: 'proveedor_iot',
        capsula_id: capsulaId,
        sin_sesion: true // flag para identificar mediciones huérfanas
      };

      // Cargar mediciones temporales
      const MEDICIONES_FILE = path.join(__dirname, '../data/mediciones-temporales.json');
      let medicionesData;
      try {
        medicionesData = await loadJsonFile(MEDICIONES_FILE);
        if (!medicionesData.mediciones) {
          medicionesData = { mediciones: [] };
        }
      } catch (error) {
        medicionesData = { mediciones: [] };
      }

      // Agregar medición temporal
      medicionesData.mediciones.push(medicion);

      // Mantener solo las últimas 1000 mediciones
      if (medicionesData.mediciones.length > 1000) {
        medicionesData.mediciones = medicionesData.mediciones.slice(-1000);
      }

      // Guardar mediciones temporales
      const guardado = await saveJsonFile(MEDICIONES_FILE, medicionesData);
      
      if (guardado) {
        console.log('⚠️ Medición temporal guardada (sin paciente asociado):', medicion.id);
        
        res.status(200).json({
          success: true,
          message: 'Medición recibida pero NO asociada (no hay sesión activa)',
          id: medicion.id,
          timestamp: medicion.recibido_en,
          warning: 'No hay sesión activa. Esta medición no está asociada a ningún paciente.'
        });
      } else {
        throw new Error('Error al guardar la medición temporal');
      }
    }

  } catch (error) {
    console.error('❌ Error procesando medición del dispositivo IoT:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ENDPOINT PARA RECIBIR MEDICIONES DE DISPOSITIVOS IoT
router.post('/mediciones/recibir', async (req, res) => {
  try {
    console.log('📊 Nueva medición recibida:', req.body);
    
    const { dispositivo_tipo, dispositivo_id, valores, timestamp } = req.body;
    
    // Validación básica de campos requeridos
    if (!dispositivo_tipo || !dispositivo_id || !valores) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: dispositivo_tipo, dispositivo_id, valores'
      });
    }

    // Validar tipos de dispositivo permitidos
    const tiposPermitidos = ['pulsoximetro', 'tension', 'balanza'];
    if (!tiposPermitidos.includes(dispositivo_tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de dispositivo no válido. Permitidos: ${tiposPermitidos.join(', ')}`
      });
    }

    // Validar rangos médicos básicos según tipo de dispositivo
    const esValorValido = validarRangosMedicos(dispositivo_tipo, valores);
    if (!esValorValido.valido) {
      return res.status(400).json({
        success: false,
        message: `Valores fuera de rango médico: ${esValorValido.error}`
      });
    }

    // Crear registro de medición
    const medicion = {
      id: generarUUID(),
      dispositivo_tipo,
      dispositivo_id,
      valores,
      timestamp: timestamp || new Date().toISOString(),
      recibido_en: new Date().toISOString(),
      procesado: true
    };

    // Cargar mediciones existentes
    const MEDICIONES_FILE = path.join(__dirname, '../data/mediciones-temporales.json');
    let medicionesData;
    try {
      medicionesData = await loadJsonFile(MEDICIONES_FILE);
      if (!medicionesData.mediciones) {
        medicionesData = { mediciones: [] };
      }
    } catch (error) {
      medicionesData = { mediciones: [] };
    }

    // Agregar nueva medición
    medicionesData.mediciones.push(medicion);

    // Mantener solo las últimas 1000 mediciones para evitar archivos muy grandes
    if (medicionesData.mediciones.length > 1000) {
      medicionesData.mediciones = medicionesData.mediciones.slice(-1000);
    }

    // Guardar mediciones actualizadas
    const guardado = await saveJsonFile(MEDICIONES_FILE, medicionesData);
    
    if (guardado) {
      console.log('✅ Medición guardada correctamente:', medicion.id);
      
      // Respuesta exitosa (lo que esperan los dispositivos)
      res.status(200).json({
        success: true,
        message: 'Medición recibida correctamente',
        id: medicion.id,
        timestamp: medicion.recibido_en
      });
    } else {
      throw new Error('Error al guardar la medición');
    }

  } catch (error) {
    console.error('❌ Error procesando medición:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ENDPOINT PARA OBTENER MEDICIONES RECIENTES
router.get('/mediciones/recientes', async (req, res) => {
  try {
    console.log('📊 Solicitando mediciones recientes');
    
    // Obtener el límite de la query string (por defecto 100)
    const limite = parseInt(req.query.limite) || 100;
    
    // Validar que el límite sea razonable
    if (limite < 1 || limite > 1000) {
      return res.status(400).json({
        success: false,
        message: 'El límite debe estar entre 1 y 1000'
      });
    }

    // Cargar mediciones desde el archivo
    const MEDICIONES_FILE = path.join(__dirname, '../data/mediciones-temporales.json');
    let medicionesData;
    
    try {
      medicionesData = await loadJsonFile(MEDICIONES_FILE);
      if (!medicionesData.mediciones) {
        medicionesData = { mediciones: [] };
      }
    } catch (error) {
      console.log('⚠️ Archivo de mediciones no encontrado o vacío');
      medicionesData = { mediciones: [] };
    }

    // Ordenar por timestamp/recibido_en más reciente primero
    const medicionesOrdenadas = medicionesData.mediciones.sort((a, b) => {
      const fechaA = new Date(a.recibido_en || a.timestamp);
      const fechaB = new Date(b.recibido_en || b.timestamp);
      return fechaB - fechaA; // Más reciente primero
    });

    // Tomar solo las últimas N mediciones según el límite
    const medicionesLimitadas = medicionesOrdenadas.slice(0, limite);

    console.log(`✅ Devolviendo ${medicionesLimitadas.length} mediciones de ${medicionesData.mediciones.length} totales`);

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      total: medicionesLimitadas.length,
      total_disponible: medicionesData.mediciones.length,
      limite_aplicado: limite,
      mediciones: medicionesLimitadas
    });

  } catch (error) {
    console.error('❌ Error obteniendo mediciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Función para validar rangos médicos
function validarRangosMedicos(tipo, valores) {
  switch (tipo) {
    case 'pulsoximetro':
      // SpO2: 70-100%, BPM: 30-200, Temperatura: 30-45°C
      if (valores.spo2 && (valores.spo2 < 70 || valores.spo2 > 100)) {
        return { valido: false, error: 'SpO2 debe estar entre 70-100%' };
      }
      if (valores.bpm && (valores.bpm < 30 || valores.bpm > 200)) {
        return { valido: false, error: 'BPM debe estar entre 30-200' };
      }
      if (valores.temperatura && (valores.temperatura < 30 || valores.temperatura > 45)) {
        return { valido: false, error: 'Temperatura debe estar entre 30-45°C' };
      }
      break;

    case 'tension':
      // Sistólica: 70-250 mmHg, Diastólica: 40-150 mmHg, BPM: 30-200
      if (valores.sistolica && (valores.sistolica < 70 || valores.sistolica > 250)) {
        return { valido: false, error: 'Presión sistólica debe estar entre 70-250 mmHg' };
      }
      if (valores.diastolica && (valores.diastolica < 40 || valores.diastolica > 150)) {
        return { valido: false, error: 'Presión diastólica debe estar entre 40-150 mmHg' };
      }
      if (valores.bpm && (valores.bpm < 30 || valores.bpm > 200)) {
        return { valido: false, error: 'BPM debe estar entre 30-200' };
      }
      break;

    case 'balanza':
      // Peso: 10-300 kg, IMC: 10-60 (si viene calculado)
      if (valores.peso && (valores.peso < 10 || valores.peso > 300)) {
        return { valido: false, error: 'Peso debe estar entre 10-300 kg' };
      }
      if (valores.imc && (valores.imc < 10 || valores.imc > 60)) {
        return { valido: false, error: 'IMC debe estar entre 10-60' };
      }
      break;

    default:
      return { valido: false, error: 'Tipo de dispositivo no reconocido' };
  }
  
  return { valido: true };
}

// Función para generar UUID simple
function generarUUID() {
  return 'med_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// HEALTH CHECK
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
