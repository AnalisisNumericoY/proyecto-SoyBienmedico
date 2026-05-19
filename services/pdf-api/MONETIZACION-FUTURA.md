# 💰 MONETIZACIÓN FUTURA - PDF API Microservice

**Fecha creación:** 19 Mayo 2026  
**Estado actual:** Código completo, NO activo en producción  
**Propósito:** Recordatorio para activar microservicio cuando se monetice

---

## 📋 Resumen Ejecutivo

Durante **FASE 1A** creamos un **microservicio PDF API completo y funcional** en `services/pdf-api/`, pero decidimos **NO activarlo** en FASE 2A para simplificar el deployment.

**En su lugar:**
- Integramos los **templates profesionales** directamente en el servidor principal
- Usamos `services/pdf-templates/` con los diseños mejorados
- Deployment simple en Railway (un solo servicio)

**PERO el microservicio está LISTO para activarse cuando queramos monetizar.**

---

## 🎯 ¿Cuándo Activar el Microservicio?

### Señales de que es el momento:

✅ Quieres **vender acceso a la API** de generación de PDFs  
✅ Otros proyectos/clientes quieren usar el servicio  
✅ Necesitas **escalabilidad independiente** del servidor principal  
✅ Quieres **rate limiting** y **API keys** para control de acceso  
✅ Plataformas como **RapidAPI** o **Stripe** para monetización  

---

## 📁 ¿Qué Está Listo en `services/pdf-api/`?

### ✅ Código Completo (FASE 1A):

```
services/pdf-api/
├── server.js                    ✅ Express en puerto 3001
├── package.json                 ✅ Dependencias separadas
├── .env                         ✅ Configuración independiente
├── middleware/
│   └── auth.js                  ✅ Validación JWT + stub validateApiKey
├── controllers/
│   └── riesgo-cv-pdf.js         ✅ Lógica de negocio
├── templates/
│   └── riesgo-cv-template.js    ✅ Diseño profesional (referencia)
├── routes/
│   └── internal-api.js          ✅ POST /pdf/riesgo-cardiovascular
│                                   POST /pdf/hads (501 planned)
│                                   POST /pdf/historia-clinica (501 planned)
├── examples/
│   └── riesgo-cardiovascular-request.json  ✅ Request ejemplo
├── API_DOCS.md                  ✅ Documentación completa (370 líneas)
├── TESTING.md                   ✅ Guía de testing (190 líneas)
└── README.md                    ✅ Quick start
```

### ⏳ Lo que Falta Implementar:

```
1. POST /pdf/hads endpoint
   - Copiar template de services/pdf-templates/hads-template.js
   - Crear controller hads-pdf.js
   - Activar ruta en internal-api.js

2. Implementar validateApiKey() middleware
   - Actualmente retorna 501
   - Necesita sistema de API keys en DB
   - Rate limiting por key

3. Base de datos de API Keys
   - Tabla: api_keys (key, cliente_id, activo, rate_limit, created_at)
   - CRUD en servidor principal
   - Dashboard para clientes

4. Analytics y Monitoring
   - Logs de requests por API key
   - Estadísticas de uso
   - Billing mensual
```

---

## 🚀 Plan de Activación (Cuando sea el Momento)

### PASO 1: Configurar Railway Monorepo (2-3 horas)

**Opción A: Proyecto Railway Separado** (RECOMENDADO)

```bash
# 1. Crear nuevo proyecto Railway para PDF API
railway init

# 2. Conectar repo GitHub
railway link

# 3. Configurar root directory: services/pdf-api
railway settings → Root Directory → services/pdf-api

# 4. Variables de entorno en Railway
JWT_SECRET=<mismo del servidor principal>
PORT=3001

# 5. Deploy
railway up
```

**Resultado:**
- URL: `https://pdf-api-soybienmedico.railway.app`
- Independiente del servidor principal
- Escalabilidad separada

---

**Opción B: Railway Monorepo** (MÁS COMPLEJO)

```json
// railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "services": [
    {
      "name": "servidor-principal",
      "startCommand": "npm start",
      "rootDirectory": ".",
      "envVars": {
        "PORT": "3000",
        "PDF_API_URL": "${{services.pdf-api.url}}"
      }
    },
    {
      "name": "pdf-api",
      "startCommand": "npm start",
      "rootDirectory": "services/pdf-api",
      "envVars": {
        "PORT": "3001"
      }
    }
  ]
}
```

---

### PASO 2: Migrar Templates al PDF API (1-2 horas)

```bash
# Copiar templates mejorados de pdf-templates a pdf-api
cp services/pdf-templates/hads-template.js services/pdf-api/templates/
cp services/pdf-templates/helpers.js services/pdf-api/templates/
```

**Crear controller HADS:**

```javascript
// services/pdf-api/controllers/hads-pdf.js
const { generarPDFHADS } = require('../templates/hads-template');

const generateHADSPDF = async (req, res) => {
  try {
    const { evaluacion, paciente } = req.body;
    
    // Validaciones
    if (!evaluacion || !paciente) {
      return res.status(400).json({ 
        error: 'Datos incompletos: se requiere evaluacion y paciente' 
      });
    }
    
    // Generar PDF
    const pdfBuffer = await generarPDFHADS(evaluacion, paciente);
    
    // Responder con PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=hads_${evaluacion.id}.pdf`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generando PDF HADS:', error);
    res.status(500).json({ error: 'Error interno al generar PDF' });
  }
};

module.exports = { generateHADSPDF };
```

**Activar ruta:**

```javascript
// services/pdf-api/routes/internal-api.js
const { generateHADSPDF } = require('../controllers/hads-pdf');

router.post('/pdf/hads', validateJWT, generateHADSPDF);
```

---

### PASO 3: Actualizar Servidor Principal (30 min)

```javascript
// routes/evaluaciones.js

// Agregar variable de entorno
const PDF_API_URL = process.env.PDF_API_URL || 'http://localhost:3001';

router.get('/api/evaluaciones/:id/pdf', verificarToken, async (req, res) => {
  try {
    const evaluacionId = req.params.id;
    
    // Obtener evaluación de BD
    const evaluacion = await obtenerEvaluacion(evaluacionId);
    const paciente = await obtenerPaciente(evaluacion.paciente_id);
    
    // Determinar endpoint según tipo
    let endpoint;
    switch (evaluacion.tipo) {
      case 'hads':
        endpoint = '/api/internal/pdf/hads';
        break;
      case 'riesgo-cardiovascular':
        endpoint = '/api/internal/pdf/riesgo-cardiovascular';
        break;
      default:
        throw new Error('Tipo de evaluación no soportado');
    }
    
    // Llamar al PDF API
    const response = await fetch(`${PDF_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${req.token}` // Pasar JWT del usuario
      },
      body: JSON.stringify({
        evaluacion,
        paciente
      })
    });
    
    if (!response.ok) {
      throw new Error(`PDF API error: ${response.status}`);
    }
    
    // Retornar PDF al cliente
    const pdfBuffer = await response.buffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${evaluacion.id}.pdf`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error obteniendo PDF:', error);
    res.status(500).json({ error: 'Error al generar PDF' });
  }
});
```

---

### PASO 4: Implementar Sistema de API Keys (4-6 horas)

**Schema Supabase:**

```sql
-- Tabla de API Keys para clientes externos
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(64) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  activo BOOLEAN DEFAULT TRUE,
  rate_limit INTEGER DEFAULT 1000, -- requests por día
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ
);

-- Tabla de logs de uso
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id),
  endpoint VARCHAR(255),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  response_time INTEGER,
  status_code INTEGER
);

-- Índices
CREATE INDEX idx_api_keys_key ON api_keys(key);
CREATE INDEX idx_api_usage_key_timestamp ON api_usage(api_key_id, timestamp);
```

**Middleware validateApiKey:**

```javascript
// services/pdf-api/middleware/auth.js

const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API Key requerida' });
    }
    
    // Verificar en base de datos
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key', apiKey)
      .eq('activo', true)
      .single();
    
    if (error || !data) {
      return res.status(403).json({ error: 'API Key inválida' });
    }
    
    // Verificar expiración
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return res.status(403).json({ error: 'API Key expirada' });
    }
    
    // Verificar rate limit (requests hoy)
    const hoy = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', data.id)
      .gte('timestamp', `${hoy}T00:00:00`);
    
    if (count >= data.rate_limit) {
      return res.status(429).json({ error: 'Rate limit excedido' });
    }
    
    // Actualizar last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);
    
    // Adjuntar info de API key al request
    req.apiKey = data;
    
    next();
    
  } catch (error) {
    console.error('Error validando API key:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};
```

---

### PASO 5: Integración con RapidAPI o Stripe (2-3 horas)

**Opción A: RapidAPI** (más fácil)

1. Crear cuenta en https://rapidapi.com/provider
2. Registrar API con endpoints documentados
3. RapidAPI maneja:
   - API keys
   - Rate limiting
   - Billing
   - Marketplace
4. Comisión: 20%

**Opción B: Stripe** (más control)

1. Crear productos en Stripe
2. Planes:
   - Free: 100 PDFs/mes
   - Basic: $10/mes - 1,000 PDFs
   - Pro: $50/mes - 10,000 PDFs
3. Webhooks para activar/desactivar keys
4. Fee: 2.9% + $0.30 por transacción

---

## 📊 Estimación de Monetización

### Costos:

| Concepto | Costo Mensual |
|----------|---------------|
| Railway (PDF API) | $5 - $10 |
| Supabase (incluido) | $0 |
| RapidAPI comisión | 20% de ventas |
| **Total** | ~$5 + comisiones |

### Ingresos Proyectados:

| Plan | Precio | PDFs/mes | Clientes | Ingreso Mensual |
|------|--------|----------|----------|-----------------|
| Free | $0 | 100 | - | $0 |
| Basic | $10 | 1,000 | 10 | $100 |
| Pro | $50 | 10,000 | 5 | $250 |
| Enterprise | Personalizado | Ilimitado | 2 | $500 |
| **TOTAL** | | | **17** | **$850/mes** |

**Neto después de comisiones (RapidAPI 20%):** ~$680/mes

---

## 🎯 Checklist de Activación

Cuando decidas monetizar:

### Configuración Técnica:
- [ ] Crear proyecto Railway para PDF API
- [ ] Configurar variables de entorno
- [ ] Deploy PDF API independiente
- [ ] Migrar templates HADS, Riesgo CV
- [ ] Actualizar servidor principal para llamar PDF API
- [ ] Testing end-to-end

### Sistema de API Keys:
- [ ] Crear tablas en Supabase (api_keys, api_usage)
- [ ] Implementar validateApiKey middleware
- [ ] Dashboard de generación de keys
- [ ] Rate limiting funcional
- [ ] Logs y analytics

### Monetización:
- [ ] Decidir: RapidAPI vs Stripe
- [ ] Crear planes de precios
- [ ] Configurar billing automático
- [ ] Documentación para clientes externos
- [ ] Términos de servicio
- [ ] Soporte técnico

### Testing:
- [ ] Generar API key de prueba
- [ ] Probar endpoints con API key
- [ ] Verificar rate limiting
- [ ] Probar billing (modo test)
- [ ] Load testing (concurrencia)

---

## 📚 Recursos para Consultar

### Documentación Ya Creada:
- `services/pdf-api/API_DOCS.md` - Documentación completa de la API
- `services/pdf-api/TESTING.md` - Guía de testing
- `services/pdf-api/README.md` - Quick start
- `services/pdf-api/FASE-1A-COMPLETADA.md` - Resumen técnico

### Enlaces Útiles:
- Railway Monorepo: https://docs.railway.app/deploy/monorepo
- RapidAPI Provider: https://rapidapi.com/provider/
- Stripe API: https://stripe.com/docs/api
- PDFKit Docs: https://pdfkit.org/docs/getting_started.html

---

## ⚡ Quick Start (Cuando Actives)

```bash
# 1. Crear proyecto Railway para PDF API
cd services/pdf-api
railway init
railway up

# 2. Configurar variables en Railway
railway variables set JWT_SECRET=<tu_secret>

# 3. Obtener URL del PDF API
railway open

# 4. Configurar servidor principal
# Agregar a .env:
PDF_API_URL=https://pdf-api-soybienmedico.railway.app

# 5. Testing
curl -X POST https://pdf-api-soybienmedico.railway.app/api/internal/pdf/hads \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d @services/pdf-api/examples/hads-request.json \
  --output test-hads.pdf
```

---

## 🎉 Resumen

**AHORA (FASE 2A):**
- Templates profesionales en `services/pdf-templates/`
- Integrados en servidor principal
- Deployment simple Railway
- PDFs bonitos ✅

**FUTURO (cuando monetices):**
- Activar `services/pdf-api/` como microservicio
- Sistema de API Keys
- RapidAPI o Stripe
- Escalabilidad independiente
- Ingresos pasivos 💰

**El código ya está listo, solo espera ser activado.**

---

**Fecha recordatorio:** 19 Mayo 2026  
**Creado por:** GitHub Copilot + José Antonio Solano  
**Estado:** 📦 Empaquetado y listo para activarse
