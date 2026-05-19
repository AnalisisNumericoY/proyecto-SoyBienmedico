const express = require('express');
const cors = require('cors');
const path = require('path');

// Cargar .env desde la carpeta actual del servicio
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Importar rutas
const internalApiRoutes = require('./routes/internal-api');

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'SoyBienmedico PDF API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    service: 'SoyBienmedico PDF Generation API',
    version: '1.0.0',
    description: 'Professional medical PDF generation service',
    endpoints: {
      health: 'GET /health',
      info: 'GET /api/info',
      docs: 'GET /api/docs (documentation)',
      internal: {
        riesgoCV: 'POST /api/internal/pdf/riesgo-cardiovascular ✅',
        hads: 'POST /api/internal/pdf/hads ⏳',
        historiaClinica: 'POST /api/internal/pdf/historia-clinica ⏳'
      }
    },
    status: 'ready',
    environment: process.env.NODE_ENV,
    authentication: 'JWT Bearer Token required for /api/internal/* endpoints'
  });
});

// Documentación de la API
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'SoyBienmedico PDF API - Documentation',
    version: '1.0.0',
    baseURL: `http://localhost:${PORT}`,
    authentication: {
      type: 'JWT Bearer Token',
      header: 'Authorization: Bearer <token>',
      description: 'Use the same JWT token from the main SoyBienmedico server'
    },
    endpoints: [
      {
        method: 'POST',
        path: '/api/internal/pdf/riesgo-cardiovascular',
        description: 'Generate PDF for Cardiovascular Risk evaluation',
        authentication: 'Required',
        requestBody: {
          paciente: {
            id: 'UUID',
            nombre: 'string',
            apellidos: 'string',
            tipo_documento: 'string',
            numero_documento: 'string',
            fecha_nacimiento: 'ISO date string',
            sexo: 'string (hombre|mujer)'
          },
          evaluacion: {
            id: 'UUID',
            fecha: 'ISO date string',
            datos_entrada: 'object',
            version_algoritmo: 'string (optional)'
          },
          resultado: {
            categoria: 'string (BAJO|MODERADO|ALTO)',
            riesgo: 'string',
            puntuacion: 'number',
            clasificacionPA: 'string (optional)',
            recomendaciones: 'array of strings (optional)'
          }
        },
        response: {
          contentType: 'application/pdf',
          description: 'PDF file binary'
        },
        example: 'See /api/docs/examples/riesgo-cardiovascular'
      },
      {
        method: 'POST',
        path: '/api/internal/pdf/hads',
        description: 'Generate PDF for HADS evaluation (coming soon)',
        status: 'Not implemented'
      }
    ]
  });
});

// Usar rutas internas
app.use('/api/internal', internalApiRoutes);

// ============================================
// ERROR HANDLERS
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    path: req.path,
    method: req.method
  });
});

// Error handler general
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error procesando solicitud'
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log('✅ PDF API Server STARTED');
  console.log('══════════════════════════════════════════════════════');
  console.log(`🚀 Service:      SoyBienmedico PDF API`);
  console.log(`🌐 Port:         ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Info:     http://localhost:${PORT}/api/info`);
  console.log(`🔧 Environment:  ${process.env.NODE_ENV}`);
  console.log('══════════════════════════════════════════════════════');
  console.log('');
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});
