const express = require('express');
const { verifyToken } = require('./auth');
const supabase = require('../config/supabase');
const multer = require('multer');
const { sendHistoriaClinica } = require('../services/email-service');
const router = express.Router();

// Configurar multer para almacenar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  }
});

// Middleware to check medico role
const checkMedicoRole = (req, res, next) => {
  if (req.user.role !== 'medico') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de médico.'
    });
  }
  next();
};

// GET MIS CITAS
router.get('/mis-citas', verifyToken, checkMedicoRole, async (req, res) => {
  try {
    const medicoId = req.user.medicoId;
    
    const { data: citas } = await supabase
      .from('citas')
      .select('*')
      .eq('medico_id', medicoId)
      .order('fecha', { ascending: true });

    const { data: pacientes } = await supabase.from('pacientes').select('*');

    const citasConDatos = (citas || []).map(cita => {
      const paciente = pacientes?.find(p => p.id === cita.paciente_id);
      return {
        ...cita,
        paciente_nombre: paciente ? `${paciente.nombre} ${paciente.apellidos}` : 'Paciente no encontrado',
        paciente_documento: paciente ? paciente.numero_documento : 'N/A'
      };
    });

    res.json({
      success: true,
      citas: citasConDatos
    });

  } catch (error) {
    console.error('Error getting mis citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET PACIENTE INFO BY DOCUMENT
router.get('/paciente/:documento', verifyToken, checkMedicoRole, async (req, res) => {
  try {
    const { documento } = req.params;
    
    const { data: pacientes } = await supabase
      .from('pacientes')
      .select('*')
      .eq('numero_documento', documento);

    const paciente = pacientes && pacientes.length > 0 ? pacientes[0] : null;

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    res.json({
      success: true,
      paciente: paciente
    });

  } catch (error) {
    console.error('Error getting paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// SAVE HISTORIA CLINICA CON PDF
router.post('/historia-clinica', verifyToken, checkMedicoRole, upload.single('pdf'), async (req, res) => {
  try {
    console.log('📥 Recibiendo historia clínica...');
    const medicoId = req.user.medicoId;
    
    // 🔍 LOGS DE DEBUGGING
    console.log('🔍 TOKEN COMPLETO (req.user):', JSON.stringify(req.user, null, 2));
    console.log('🔍 medicoId extraído:', medicoId);
    console.log('🔍 Tipo de medicoId:', typeof medicoId);
    console.log('🔍 medicoId es undefined?:', medicoId === undefined);
    console.log('🔍 medicoId es null?:', medicoId === null);
    
    // Parse historiaData from form data
    const historiaData = JSON.parse(req.body.historiaData);
    console.log('📋 Datos de historia:', Object.keys(historiaData));

    // Validate required fields
    if (!historiaData.paciente_id || !historiaData.cita_id) {
      console.error('❌ Faltan campos requeridos');
      return res.status(400).json({
        success: false,
        message: 'ID del paciente y ID de cita son requeridos'
      });
    }

    // Obtener datos del paciente y médico para el email
    const { data: paciente } = await supabase
      .from('pacientes')
      .select('nombre, email, numero_documento')
      .eq('id', historiaData.paciente_id)
      .single();

    console.log('🔍 BUSCANDO MÉDICO EN SUPABASE...');
    console.log('🔍 Query: SELECT * FROM medicos WHERE id =', medicoId);
    
    const { data: medico, error: medicoError } = await supabase
      .from('medicos')
      .select('nombre, correo_electronico, especialidad, registro_medico')
      .eq('id', medicoId)
      .single();
    
    console.log('📊 RESULTADO BÚSQUEDA MÉDICO:');
    console.log('  - data:', medico);
    console.log('  - error:', medicoError);
    console.log('  - medico es null?:', medico === null);
    console.log('  - medico es undefined?:', medico === undefined);

    // Create historia clinica ID
    const historiaId = `HC${Date.now()}`;
    
    // Construir objeto con los campos REALES del formulario
    const nuevaHistoria = {
      id: historiaId,
      cita_id: historiaData.cita_id,
      paciente_id: historiaData.paciente_id,
      medico_id: medicoId,
      fecha_consulta: historiaData.fecha_consulta || new Date().toISOString(),
      
      // Campos del formulario de videoconsulta
      motivo_consulta: historiaData.motivo_consulta || '',
      objeto_teleorientacion: historiaData.objeto_teleorientacion || '',
      antecedentes: historiaData.antecedentes || '',
      
      // Signos vitales y antropométricos
      tabaquismo: historiaData.tabaquismo || '',
      presion_sistolica: historiaData.presion_sistolica ? parseInt(historiaData.presion_sistolica) : null,
      presion_diastolica: historiaData.presion_diastolica ? parseInt(historiaData.presion_diastolica) : null,
      peso: historiaData.peso ? parseFloat(historiaData.peso) : null,
      talla: historiaData.talla ? parseInt(historiaData.talla) : null,
      actividad_fisica: historiaData.actividad_fisica || '',
      frecuencia_cardiaca: historiaData.frecuencia_cardiaca ? parseInt(historiaData.frecuencia_cardiaca) : null,
      oximetria: historiaData.oximetria ? parseFloat(historiaData.oximetria) : null,
      glucometria: historiaData.glucometria ? parseFloat(historiaData.glucometria) : null,
      
      // Descripción general y conducta
      descripcion_general: historiaData.descripcion_general || '',
      conducta: historiaData.conducta || '',
      especialidad_requerida: historiaData.especialidad_requerida || '',
      
      created_at: new Date().toISOString()
    };

    console.log('💾 Guardando en Supabase tabla historias_clinicas...');

    // Si hay archivo PDF, subirlo a Supabase Storage
    let pdfUrl = null;
    if (req.file) {
      console.log('📄 PDF recibido, tamaño:', req.file.size, 'bytes');
      const fileName = `${historiaId}_${Date.now()}.pdf`;
      const filePath = `${historiaData.paciente_id}/${fileName}`;
      
      console.log('⬆️  Subiendo PDF a Supabase Storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('historias-clinicas-pdf')
        .upload(filePath, req.file.buffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Error uploading PDF to Supabase Storage:', uploadError);
        throw uploadError;
      }

      console.log('✅ PDF subido correctamente');

      // Obtener URL pública del archivo
      const { data: publicUrlData } = supabase.storage
        .from('historias-clinicas-pdf')
        .getPublicUrl(filePath);
      
      pdfUrl = publicUrlData.publicUrl;
      nuevaHistoria.pdf_path = pdfUrl;
      
      console.log('🔗 URL pública del PDF:', pdfUrl);

      // Enviar email con PDF adjunto a paciente (con copia a admin)
      try {
        console.log('📧 Enviando email con PDF adjunto...');
        const adminEmail = process.env.ADMIN_EMAIL || 'administracion@soybienmedico.com';
        
        const emailResult = await sendHistoriaClinica({
          pacienteEmail: paciente.email,
          pacienteNombre: paciente.nombre,
          medicoNombre: medico.nombre,
          pdfBuffer: req.file.buffer,
          pdfFileName: fileName,
          adminEmail: adminEmail
        });

        if (emailResult.success) {
          console.log('✅ Email enviado correctamente a:', paciente.email);
        } else {
          console.warn('⚠️  Error al enviar email (continuando):', emailResult.error);
        }
      } catch (emailError) {
        console.warn('⚠️  Error al enviar email (continuando):', emailError.message);
      }
    } else {
      console.warn('⚠️  No se recibió archivo PDF');
    }

    const { data: historiaInserted, error } = await supabase
      .from('historias_clinicas')
      .insert([nuevaHistoria])
      .select();

    if (error) {
      console.error('❌ Error insertando en Supabase:', error);
      throw error;
    }

    console.log('✅ Historia clínica guardada exitosamente, ID:', historiaId);

    res.json({
      success: true,
      message: 'Historia clínica guardada exitosamente',
      historia: historiaInserted[0],
      pdfUrl: pdfUrl
    });

  } catch (error) {
    console.error('❌ Error saving historia clinica:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor: ' + error.message
    });
  }
});

// UPDATE CITA STATUS
router.put('/cita/:citaId/estado', verifyToken, checkMedicoRole, async (req, res) => {
  try {
    const { citaId } = req.params;
    const { estado } = req.body;
    const medicoId = req.user.medicoId;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'Estado es requerido'
      });
    }

    // First, verify the cita belongs to this medico
    const { data: citasCheck } = await supabase
      .from('citas')
      .select('*')
      .eq('id', citaId)
      .eq('medico_id', medicoId);
    
    if (!citasCheck || citasCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada o no autorizada'
      });
    }

    // Update the cita
    const { data: citaUpdated, error } = await supabase
      .from('citas')
      .update({ 
        estado: estado,
        updated_at: new Date().toISOString()
      })
      .eq('id', citaId)
      .eq('medico_id', medicoId)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Estado de cita actualizado exitosamente',
      cita: citaUpdated[0]
    });

  } catch (error) {
    console.error('Error updating cita status:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET CITA BY ID (para videoconsulta)
router.get('/cita/:citaId', verifyToken, checkMedicoRole, async (req, res) => {
  try {
    const { citaId } = req.params;
    const medicoId = req.user.medicoId;

    // Get cita
    const { data: citas, error: citaError } = await supabase
      .from('citas')
      .select('*')
      .eq('id', citaId)
      .eq('medico_id', medicoId);

    if (citaError) throw citaError;

    const cita = citas && citas.length > 0 ? citas[0] : null;

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Get paciente data
    const { data: pacientes, error: pacienteError } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', cita.paciente_id);

    if (pacienteError) throw pacienteError;

    const paciente = pacientes && pacientes.length > 0 ? pacientes[0] : null;

    res.json({
      success: true,
      cita: cita,
      paciente: paciente
    });

  } catch (error) {
    console.error('Error getting cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;