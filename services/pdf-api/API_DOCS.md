# 📚 API Documentation - SoyBienmedico PDF Service

Servicio de generación de PDFs médicos profesionales para evaluaciones clínicas.

**Base URL:** `http://localhost:3001` (desarrollo) | `https://pdf-api.soybienmédico.com` (producción)

**Version:** 1.0.0

---

## 🔐 Autenticación

Todos los endpoints bajo `/api/internal/*` requieren autenticación JWT.

### Headers Requeridos

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

El token JWT debe ser el mismo que se usa en el servidor principal de SoyBienmedico. Payload esperado:

```json
{
  "userId": "uuid",
  "username": "string",
  "role": "admin|medico|paciente|cliente",
  "medicoId": "uuid (optional)",
  "pacienteId": "uuid (optional)"
}
```

---

## 📋 Endpoints Disponibles

### 1. Health Check

Verificar estado del servicio.

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "SoyBienmedico PDF API",
  "version": "1.0.0",
  "timestamp": "2026-05-19T00:00:00.000Z",
  "port": "3001"
}
```

---

### 2. API Info

Información general y lista de endpoints.

```http
GET /api/info
```

**Response:**
```json
{
  "service": "SoyBienmedico PDF Generation API",
  "version": "1.0.0",
  "endpoints": {
    "health": "GET /health",
    "internal": {
      "riesgoCV": "POST /api/internal/pdf/riesgo-cardiovascular ✅",
      "hads": "POST /api/internal/pdf/hads ⏳"
    }
  }
}
```

---

### 3. API Documentation

Documentación completa en formato JSON.

```http
GET /api/docs
```

---

## 📄 Endpoints de Generación de PDFs

### Riesgo Cardiovascular

Genera PDF profesional de evaluación de riesgo cardiovascular.

```http
POST /api/internal/pdf/riesgo-cardiovascular
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**

```json
{
  "paciente": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "nombre": "Juan",
    "apellidos": "Pérez García",
    "tipo_documento": "CC",
    "numero_documento": "123456789",
    "fecha_nacimiento": "1978-05-15T00:00:00.000Z",
    "sexo": "hombre",
    "rh": "O+"
  },
  "evaluacion": {
    "id": "987fcdeb-51a2-43d7-8f9e-123456789abc",
    "fecha": "2026-05-19T10:30:00.000Z",
    "datos_entrada": {
      "edad": 48,
      "sexo": "masculino",
      "fumador": true,
      "diabetes": false,
      "hipertension": true,
      "cardiovascular": false,
      "renal": false,
      "sistolica": 145,
      "diastolica": 92,
      "frecuencia": 78,
      "conoceColesterol": true,
      "colesterolTotal": 210,
      "hdl": 45,
      "peso": 85,
      "talla": 172
    },
    "version_algoritmo": "1.0"
  },
  "resultado": {
    "categoria": "MODERADO",
    "riesgo": "Riesgo moderado de evento cardiovascular a 10 años: 5%",
    "puntuacion": 12,
    "clasificacionPA": "Hipertensión Grado 1",
    "recomendaciones": [
      "Consulte con su médico cardiovascular en las próximas semanas",
      "Monitoree regularmente su presión arterial",
      "Reduzca el consumo de sal y alimentos procesados",
      "Inicie un programa de ejercicio regular (150 min/semana)",
      "Deje de fumar - es el factor de riesgo más importante"
    ]
  }
}
```

**Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="riesgo_cardiovascular_987fcdeb-51a2-43d7-8f9e-123456789abc.pdf"
Content-Length: 45678

<PDF Binary Data>
```

**Errores Posibles:**

| Código | Descripción |
|--------|-------------|
| 400 | Datos faltantes (paciente, evaluacion, resultado) |
| 401 | Token JWT inválido o expirado |
| 500 | Error interno al generar PDF |

**Ejemplo de Error:**

```json
{
  "success": false,
  "error": "Datos del paciente requeridos",
  "code": "MISSING_PACIENTE"
}
```

---

### HADS (Próximamente)

Genera PDF de evaluación psicológica HADS.

```http
POST /api/internal/pdf/hads
```

**Status:** ⏳ En desarrollo (FASE 1B)

---

### Historia Clínica (Próximamente)

Genera PDF de historia clínica con firma digital.

```http
POST /api/internal/pdf/historia-clinica
```

**Status:** ⏳ Planificado (FASE 2+)

---

## 🧪 Ejemplos de Uso

### cURL

```bash
curl -X POST http://localhost:3001/api/internal/pdf/riesgo-cardiovascular \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d @ejemplo-riesgo-cv.json \
  --output resultado.pdf
```

### JavaScript (Fetch)

```javascript
const generarPDF = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3001/api/internal/pdf/riesgo-cardiovascular', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      paciente: { /* ... */ },
      evaluacion: { /* ... */ },
      resultado: { /* ... */ }
    })
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'evaluacion.pdf';
    a.click();
  }
};
```

### Node.js (Axios)

```javascript
const axios = require('axios');
const fs = require('fs');

const generarPDF = async (token, datos) => {
  const response = await axios.post(
    'http://localhost:3001/api/internal/pdf/riesgo-cardiovascular',
    datos,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    }
  );
  
  fs.writeFileSync('resultado.pdf', response.data);
  console.log('✅ PDF guardado exitosamente');
};
```

### Python (Requests)

```python
import requests

def generar_pdf(token, datos):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.post(
        'http://localhost:3001/api/internal/pdf/riesgo-cardiovascular',
        json=datos,
        headers=headers
    )
    
    if response.status_code == 200:
        with open('resultado.pdf', 'wb') as f:
            f.write(response.content)
        print('✅ PDF generado')
    else:
        print(f'❌ Error: {response.json()}')
```

---

## 🎨 Características del PDF

### Diseño Profesional

- ✅ Header con branding SoyBienmedico (gradiente #667eea → #764ba2)
- ✅ Información estructurada en tablas y boxes
- ✅ Código de colores según riesgo (Verde/Amarillo/Rojo)
- ✅ Tipografía jerárquica (Helvetica)
- ✅ Footer con ID de verificación
- ✅ Emojis Unicode para mejor visualización

### Contenido

1. **Header:** Logo y branding
2. **Datos del Paciente:** Nombre, documento, edad, sexo
3. **Resultado Principal:** Box grande con color según riesgo
4. **Parámetros Evaluados:** Tabla de signos vitales y factores de riesgo
5. **Indicadores Adicionales:** IMC, clasificación PA, etc.
6. **Recomendaciones:** Lista personalizada según resultado
7. **Footer:** Fecha generación, ID de verificación, versión

---

## 🔧 Configuración

### Variables de Entorno

```env
# Puerto del servicio (diferente al servidor principal)
PORT=3001

# Supabase (compartido con servidor principal)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key

# JWT Secret (DEBE ser el mismo que el servidor principal)
JWT_SECRET=tu_jwt_secret

# Entorno
NODE_ENV=development
```

### Instalación

```bash
cd services/pdf-api
npm install
npm run dev  # Modo desarrollo con nodemon
npm start    # Modo producción
```

---

## ⚡ Performance

- **Tiempo promedio de generación:** 200-500ms
- **Tamaño promedio de PDF:** 40-80 KB
- **Throughput:** ~100 PDFs/min (single instance)

---

## 🐛 Troubleshooting

### Error: "Token inválido"

- Verifica que el `JWT_SECRET` sea el mismo en ambos servidores
- Confirma que el token no haya expirado (duración: 24 horas)
- Revisa el formato del header: `Authorization: Bearer <token>`

### Error: "Datos del paciente requeridos"

- Verifica que el request body incluya los objetos `paciente`, `evaluacion` y `resultado`
- Confirma que los campos requeridos estén presentes

### PDF vacío o corrupto

- Verifica que la versión de `pdfkit` sea 0.18.0 o superior
- Confirma que no haya errores en la consola del servidor

---

## 📞 Soporte

Para reportar bugs o solicitar features, contactar al equipo de desarrollo SoyBienmedico.

---

## 📝 Changelog

### v1.0.0 (2026-05-19)
- ✅ Endpoint de Riesgo Cardiovascular
- ✅ Autenticación JWT
- ✅ Documentación completa
- ✅ Diseño profesional de PDFs

### Próximas versiones
- ⏳ v1.1.0: Endpoint HADS
- ⏳ v1.2.0: Endpoint Historia Clínica
- ⏳ v2.0.0: API Keys para clientes externos
