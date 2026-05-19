# 🏥 SoyBienmedico PDF API

Servicio independiente de generación de PDFs médicos profesionales.

## 📋 Características

- ✅ Generación de PDFs de evaluaciones médicas
- ✅ API REST independiente
- ✅ Autenticación con JWT (compartida con servidor principal)
- ✅ Diseños profesionales personalizables
- ✅ Preparado para monetización futura
- ✅ **Endpoint Riesgo Cardiovascular - ACTIVO**

## 🚀 Inicio Rápido

### Instalación

```bash
cd services/pdf-api
npm install
```

### Ejecutar en Desarrollo

```bash
npm run dev
```

### Ejecutar en Producción

```bash
npm start
```

## 🔗 Endpoints Disponibles

### Health Check
```
GET /health
```

Respuesta:
```json
{
  "status": "ok",
  "service": "SoyBienmedico PDF API",
  "version": "1.0.0",
  "timestamp": "2026-05-19T00:00:00.000Z",
  "port": 3001
}
```

### API Info
```
GET /api/info
```

Muestra información del servicio y endpoints disponibles.

### Riesgo Cardiovascular ✅
```
POST /api/internal/pdf/riesgo-cardiovascular
Headers: Authorization: Bearer <JWT>
```

Ver documentación completa en [API_DOCS.md](./API_DOCS.md)

### HADS (próximamente)
```
POST /api/internal/pdf/hads
```

## 📚 Documentación Completa

Ver [API_DOCS.md](./API_DOCS.md) para:
- Autenticación JWT
- Estructura de requests
- Ejemplos de código (cURL, JavaScript, Python, Node.js)
- Manejo de errores
- Características del diseño PDF

## 📦 Estructura (Futura)

```
pdf-api/
├── server.js              # Servidor Express
├── package.json
├── .env
├── middleware/
│   ├── auth.js           # Validación JWT y API Keys
│   └── rate-limiter.js   # Rate limiting por plan
├── routes/
│   ├── internal-api.js   # Endpoints internos (JWT)
│   └── public-api.js     # Endpoints públicos (API Key)
├── controllers/
│   ├── riesgo-cv-pdf.js  # PDF Riesgo Cardiovascular
│   ├── hads-pdf.js       # PDF HADS
│   └── jornada-pdf.js    # PDF Reporte de Jornada
└── templates/
    ├── riesgo-cv-template.js
    └── hads-template.js
```

## 🔧 Configuración

Editar `.env`:

```env
PORT=3001
SUPABASE_URL=tu_url
SUPABASE_ANON_KEY=tu_key
JWT_SECRET=tu_secret
NODE_ENV=development
```

## 📊 Estado Actual

- ✅ FASE 0: Estructura base (COMPLETADA)
- ✅ FASE 1A: API con JWT interno (COMPLETADA)
  - ✅ Middleware de autenticación JWT
  - ✅ Endpoint Riesgo Cardiovascular funcional
  - ✅ Template PDF con diseño profesional
  - ✅ Documentación completa
- ⏳ FASE 1B: Corregir flujo HADS
- ⏳ FASE 2: Diseños mejorados
- ⏳ FASE 3: API Keys y monetización

## 🧪 Testing

```bash
# Probar health check
curl http://localhost:3001/health

# Probar info
curl http://localhost:3001/api/info
```

## 📝 Notas

- Puerto 3001 (diferente del servidor principal en 3000)
- Comparte credenciales JWT con servidor principal
- Preparado para escalar como microservicio independiente
