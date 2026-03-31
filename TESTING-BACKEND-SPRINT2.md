# 🧪 Plan de Testing Backend - Sprint 2: Evaluación Riesgo Cardiovascular

**Fecha**: 31 Marzo 2026  
**Commits**: e81fdbc (Día 1), 1997c94 (Día 2)  
**Objetivo**: Validar endpoints, generación PDF, permisos y trazabilidad IoT

---

## 📋 PRE-REQUISITOS

### 1. Levantar Servidor Local
```bash
npm start
```
**Verificar**: `Servidor ejecutándose en puerto 3000`

### 2. Credenciales de Prueba
```json
{
  "admin": {
    "username": "admin",
    "password": "pass123",
    "role": "admin"
  },
  "medico": {
    "username": "doctor123",
    "password": "pass123",
    "role": "medico",
    "medico_id": "DOC001"
  },
  "paciente": {
    "username": "paciente123",
    "password": "pass123",
    "role": "paciente",
    "paciente_id": "PAC001"
  }
}
```

### 3. Herramientas
- **Postman** (recomendado) o **cURL**
- **Base URL**: `http://localhost:3000`

---

## 🔐 PASO 1: Autenticación (Obtener JWT)

### Test 1.1: Login como Paciente
**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "username": "paciente123",
  "password": "pass123",
  "role": "paciente"
}
```

**Respuesta Esperada** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "pac001",
    "username": "paciente123",
    "role": "paciente",
    "paciente_id": "PAC001"
  }
}
```

**Guardar**: `TOKEN_PACIENTE` para siguientes pruebas

### Test 1.2: Login como Médico
**Request Body**:
```json
{
  "username": "doctor123",
  "password": "pass123",
  "role": "medico"
}
```

**Guardar**: `TOKEN_MEDICO`

### Test 1.3: Login como Admin
**Request Body**:
```json
{
  "username": "admin",
  "password": "pass123",
  "role": "admin"
}
```

**Guardar**: `TOKEN_ADMIN`

---

## ✅ PASO 2: Crear Evaluación de Riesgo Cardiovascular

### Test 2.1: Evaluación Manual (Sin Dispositivos IoT)
**Endpoint**: `POST /api/evaluaciones/riesgo-cardiovascular`  
**Headers**: `Authorization: Bearer {TOKEN_PACIENTE}`

**Request Body**:
```json
{
  "paciente_id": "PAC001",
  "datos_entrada": {
    "edad": 55,
    "sexo": "masculino",
    "fumador": true,
    "diabetes": true,
    "hipertension": true,
    "cardiovascular": false,
    "renal": false,
    "sistolica": 145,
    "diastolica": 95,
    "frecuencia": 78,
    "conoceColesterol": true,
    "colesterolTotal": 240,
    "hdl": 35,
    "hba1c": 7.2
  }
}
```

**Respuesta Esperada** (201 Created):
```json
{
  "success": true,
  "message": "Evaluación de riesgo cardiovascular creada exitosamente",
  "data": {
    "evaluacion_id": "EVAL_1711843200000_abc123xyz",
    "resultado": {
      "categoria": "ALTO",
      "riesgo": ">20%",
      "puntuacion": 16,
      "clasificacionPA": "Hipertensión Etapa 1",
      "recomendaciones": [
        "Su nivel de riesgo cardiovascular es ALTO (>20%). Requiere atención médica inmediata.",
        "Dejar de fumar es la medida más importante para reducir su riesgo cardiovascular.",
        "Control de diabetes: Mantener HbA1c < 7% mediante dieta, ejercicio y medicación.",
        // ... más recomendaciones
      ]
    },
    "pdf_url": "/pdfs/evaluaciones/EVAL_1711843200000_abc123xyz.pdf",
    "fecha_creacion": "2026-03-31T05:20:00.000Z"
  }
}
```

**Verificaciones**:
- ✅ Status 201
- ✅ `evaluacion_id` generado (formato: `EVAL_{timestamp}_{random}`)
- ✅ `resultado.categoria` es "ALTO" (fumador + diabetes + hipertensión + PA alta + colesterol alto = alta puntuación)
- ✅ `resultado.puntuacion` >= 13 (masculino con múltiples factores)
- ✅ `pdf_url` existe
- ✅ Array de `recomendaciones` no vacío

### Test 2.2: Evaluación con Datos IoT (Con Trazabilidad)
**Endpoint**: `POST /api/evaluaciones/riesgo-cardiovascular`  
**Headers**: `Authorization: Bearer {TOKEN_PACIENTE}`

**Request Body**:
```json
{
  "paciente_id": "PAC001",
  "sesion_id": "SES_1711840000000_xyz789",
  "datos_entrada": {
    "edad": 45,
    "sexo": "femenino",
    "fumador": false,
    "diabetes": false,
    "hipertension": false,
    "cardiovascular": false,
    "renal": false,
    "sistolica": {
      "valor": 128,
      "fuente": "tensiometro",
      "medicion_id": "MED_1711840500000_ten001"
    },
    "diastolica": {
      "valor": 82,
      "fuente": "tensiometro",
      "medicion_id": "MED_1711840500000_ten001"
    },
    "frecuencia": {
      "valor": 72,
      "fuente": "pulsoximetro",
      "medicion_id": "MED_1711840600000_pul001"
    },
    "conoceColesterol": false,
    "peso": {
      "valor": 68,
      "fuente": "balanza",
      "medicion_id": "MED_1711840700000_bal001"
    },
    "talla": 165,
    "hba1c": 5.4
  }
}
```

**Respuesta Esperada** (201 Created):
```json
{
  "success": true,
  "data": {
    "evaluacion_id": "EVAL_1711843500000_def456uvw",
    "resultado": {
      "categoria": "BAJO",
      "riesgo": "<1%",
      "puntuacion": 5,
      "clasificacionPA": "Presión Normal",
      "recomendaciones": [
        "Su nivel de riesgo cardiovascular es BAJO (<1%). Mantenga sus hábitos saludables.",
        "Mantenga actividad física regular: 150 minutos de ejercicio moderado por semana.",
        // ...
      ]
    },
    "pdf_url": "/pdfs/evaluaciones/EVAL_1711843500000_def456uvw.pdf",
    "fecha_creacion": "2026-03-31T05:25:00.000Z"
  }
}
```

**Verificaciones**:
- ✅ Status 201
- ✅ `resultado.categoria` es "BAJO" (sin factores de riesgo, PA normal)
- ✅ `sesion_id` incluido en evaluación
- ✅ Trazabilidad: `medicion_id` preservado en datos_entrada

### Test 2.3: Evaluación con Riesgo Automático ALTO (Enfermedad Cardiovascular)
**Request Body**:
```json
{
  "paciente_id": "PAC001",
  "datos_entrada": {
    "edad": 40,
    "sexo": "masculino",
    "fumador": false,
    "diabetes": false,
    "hipertension": false,
    "cardiovascular": true,
    "renal": false,
    "sistolica": 120,
    "diastolica": 78,
    "conoceColesterol": true,
    "colesterolTotal": 180,
    "hdl": 50
  }
}
```

**Respuesta Esperada**:
```json
{
  "data": {
    "resultado": {
      "categoria": "ALTO",
      "riesgo": ">20%",
      "puntuacion": 0,
      "recomendaciones": [
        "Su nivel de riesgo cardiovascular es ALTO (>20%). Requiere atención médica inmediata."
      ]
    }
  }
}
```

**Verificaciones**:
- ✅ Categoría "ALTO" independiente de otros factores
- ✅ Puntuación puede ser baja, pero resultado es ALTO

---

## 🔍 PASO 3: Consultar Evaluaciones

### Test 3.1: Obtener Evaluación Específica
**Endpoint**: `GET /api/evaluaciones/{evaluacion_id}`  
**Headers**: `Authorization: Bearer {TOKEN_PACIENTE}`

**URL Ejemplo**:
```
GET /api/evaluaciones/EVAL_1711843200000_abc123xyz
```

**Respuesta Esperada** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "EVAL_1711843200000_abc123xyz",
    "tipo": "riesgo_cardiovascular",
    "paciente_id": "PAC001",
    "sesion_id": null,
    "fecha": "2026-03-31T05:20:00.000Z",
    "datos_entrada": {
      "edad": 55,
      "sexo": "masculino",
      // ... todos los datos
    },
    "resultado": {
      "categoria": "ALTO",
      "riesgo": ">20%",
      // ...
    },
    "pdf_path": "/pdfs/evaluaciones/EVAL_1711843200000_abc123xyz.pdf",
    "creado_por": "pac001",
    "version_algoritmo": "PAHO_v1.0"
  }
}
```

**Verificaciones**:
- ✅ Status 200
- ✅ Estructura completa con todos los campos
- ✅ `pdf_path` presente

### Test 3.2: Historial de Evaluaciones del Paciente
**Endpoint**: `GET /api/evaluaciones/paciente/{paciente_id}`  
**Headers**: `Authorization: Bearer {TOKEN_PACIENTE}`

**URL Ejemplo**:
```
GET /api/evaluaciones/paciente/PAC001
```

**Query Parameters** (opcionales):
- `tipo=riesgo_cardiovascular` - Filtrar por tipo
- `limit=10` - Límite de resultados (default: 50)
- `offset=0` - Paginación

**Respuesta Esperada** (200 OK):
```json
{
  "success": true,
  "data": {
    "evaluaciones": [
      {
        "id": "EVAL_1711843500000_def456uvw",
        "tipo": "riesgo_cardiovascular",
        "fecha": "2026-03-31T05:25:00.000Z",
        "resultado": {
          "categoria": "BAJO",
          "riesgo": "<1%"
        },
        "pdf_path": "/pdfs/evaluaciones/EVAL_1711843500000_def456uvw.pdf"
      },
      {
        "id": "EVAL_1711843200000_abc123xyz",
        "tipo": "riesgo_cardiovascular",
        "fecha": "2026-03-31T05:20:00.000Z",
        "resultado": {
          "categoria": "ALTO",
          "riesgo": ">20%"
        },
        "pdf_path": "/pdfs/evaluaciones/EVAL_1711843200000_abc123xyz.pdf"
      }
    ],
    "total": 2,
    "paciente_id": "PAC001"
  }
}
```

**Verificaciones**:
- ✅ Status 200
- ✅ Array ordenado por fecha DESC (más reciente primero)
- ✅ `total` coincide con cantidad de evaluaciones
- ✅ Todos tienen `pdf_path`

### Test 3.3: Filtrar por Tipo
**URL**:
```
GET /api/evaluaciones/paciente/PAC001?tipo=riesgo_cardiovascular&limit=5
```

**Verificaciones**:
- ✅ Solo devuelve evaluaciones de tipo "riesgo_cardiovascular"
- ✅ Máximo 5 resultados

---

## 📄 PASO 4: Descargar PDF

### Test 4.1: Descargar PDF de Evaluación
**Endpoint**: `GET /api/evaluaciones/{evaluacion_id}/pdf`  
**Headers**: `Authorization: Bearer {TOKEN_PACIENTE}`

**URL Ejemplo**:
```
GET /api/evaluaciones/EVAL_1711843200000_abc123xyz/pdf
```

**Respuesta Esperada** (200 OK):
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `inline; filename="EVAL_1711843200000_abc123xyz.pdf"`
- **Body**: Archivo PDF binario

**Verificación Manual**:
1. Abrir PDF descargado
2. Verificar contenido:
   - ✅ **Header**: "EVALUACIÓN DE RIESGO CARDIOVASCULAR", método PAHO, fecha, ID
   - ✅ **Datos del Paciente**: `paciente_id`, `sesion_id` (si aplica)
   - ✅ **Parámetros Evaluados**: 
     - Datos demográficos (edad, sexo)
     - Factores de riesgo (fumador, diabetes, etc.)
     - Signos vitales con **fuente** (manual, tensiometro, etc.)
     - **Trazabilidad IoT**: `medicion_id` visible cuando hay dispositivo
   - ✅ **Resultado**: Cuadro color-coded con categoría
     - Verde para BAJO
     - Amarillo/Naranja para MODERADO
     - Rojo para ALTO
   - ✅ **Puntuación PAHO** y clasificación PA
   - ✅ **Recomendaciones**: Lista numerada con consejos personalizados
   - ✅ **Footer**: Timestamp generación, versión algoritmo, marca SoyBienmedico

### Test 4.2: Verificar Archivo en Sistema
**Ruta Física**:
```
D:\Users\Jose Antonio Solano\Documents\AsResearch_D\InvestigacionDesarrollo\SoyBienmedico\pdfs\evaluaciones\EVAL_1711843200000_abc123xyz.pdf
```

**Comando PowerShell**:
```powershell
Test-Path "pdfs\evaluaciones\EVAL_1711843200000_abc123xyz.pdf"
# Resultado esperado: True
```

---

## 📊 PASO 5: Listar Tipos de Evaluación Disponibles

### Test 5.1: Obtener Tipos Disponibles
**Endpoint**: `GET /api/evaluaciones/tipos/disponibles`  
**Headers**: `Authorization: Bearer {TOKEN_PACIENTE}`

**Respuesta Esperada** (200 OK):
```json
{
  "success": true,
  "data": {
    "tipos": [
      {
        "tipo": "riesgo_cardiovascular",
        "nombre": "Evaluación de Riesgo Cardiovascular",
        "descripcion": "Método PAHO/OPS para estimar riesgo cardiovascular a 10 años",
        "disponible": true
      },
      {
        "tipo": "hads",
        "nombre": "Escala HADS (Ansiedad y Depresión)",
        "descripcion": "Hospital Anxiety and Depression Scale",
        "disponible": false,
        "disponible_en": "Sprint 3"
      }
    ]
  }
}
```

**Verificaciones**:
- ✅ Status 200
- ✅ `riesgo_cardiovascular` marcado como `disponible: true`
- ✅ `hads` marcado como `disponible: false` (Sprint 3)

---

## 🔒 PASO 6: Validación de Permisos

### Test 6.1: Paciente Accede a SU Evaluación (✅ Permitido)
**Endpoint**: `GET /api/evaluaciones/{evaluacion_id}`  
**Headers**: `Authorization: Bearer {TOKEN_PACIENTE}`  
**Evaluación**: Creada por PAC001

**Resultado Esperado**: 200 OK

### Test 6.2: Paciente Intenta Acceder a Evaluación de OTRO Paciente (❌ Prohibido)
**Endpoint**: `GET /api/evaluaciones/{evaluacion_id_otro_paciente}`  
**Headers**: `Authorization: Bearer {TOKEN_PACIENTE}`  
**Evaluación**: Creada por PAC002

**Respuesta Esperada** (403 Forbidden):
```json
{
  "success": false,
  "message": "No tiene permisos para acceder a esta evaluación"
}
```

### Test 6.3: Médico Accede a Evaluación de Cualquier Paciente (✅ Permitido)
**Endpoint**: `GET /api/evaluaciones/{evaluacion_id}`  
**Headers**: `Authorization: Bearer {TOKEN_MEDICO}`  
**Evaluación**: Creada por PAC001 o PAC002

**Resultado Esperado**: 200 OK

### Test 6.4: Admin Accede a Todo (✅ Permitido)
**Endpoint**: `GET /api/evaluaciones/{evaluacion_id}`  
**Headers**: `Authorization: Bearer {TOKEN_ADMIN}`

**Resultado Esperado**: 200 OK

### Test 6.5: Sin Token JWT (❌ No Autorizado)
**Endpoint**: `POST /api/evaluaciones/riesgo-cardiovascular`  
**Headers**: Sin `Authorization`

**Respuesta Esperada** (401 Unauthorized):
```json
{
  "message": "Token no proporcionado"
}
```

---

## ⚠️ PASO 7: Validación de Datos

### Test 7.1: Edad Fuera de Rango
**Request Body**:
```json
{
  "paciente_id": "PAC001",
  "datos_entrada": {
    "edad": 15,
    "sexo": "masculino",
    "fumador": false,
    "diabetes": false,
    "sistolica": 120,
    "diastolica": 80
  }
}
```

**Respuesta Esperada** (400 Bad Request):
```json
{
  "success": false,
  "message": "Errores de validación",
  "errores": [
    "Edad debe estar entre 18 y 120 años"
  ]
}
```

### Test 7.2: Sexo Inválido
**datos_entrada.sexo**: `"otro"`

**Respuesta Esperada** (400):
```json
{
  "errores": [
    "Sexo debe ser \"masculino\" o \"femenino\""
  ]
}
```

### Test 7.3: Presión Arterial Inválida
**datos_entrada**:
```json
{
  "sistolica": 90,
  "diastolica": 95
}
```

**Respuesta Esperada** (400):
```json
{
  "errores": [
    "La presión sistólica debe ser mayor que la diastólica"
  ]
}
```

### Test 7.4: Colesterol Fuera de Rango
**datos_entrada**:
```json
{
  "conoceColesterol": true,
  "colesterolTotal": 600
}
```

**Respuesta Esperada** (400):
```json
{
  "errores": [
    "Colesterol total debe estar entre 100 y 500 mg/dL"
  ]
}
```

### Test 7.5: Campos Requeridos Faltantes
**Request Body**:
```json
{
  "paciente_id": "PAC001",
  "datos_entrada": {
    "edad": 50
  }
}
```

**Respuesta Esperada** (400):
```json
{
  "errores": [
    "Sexo debe ser \"masculino\" o \"femenino\"",
    "Campo fumador debe ser true o false",
    "Valores de presión arterial inválidos"
  ]
}
```

---

## 📈 PASO 8: Validación de Algoritmo PAHO

### Test 8.1: Riesgo BAJO (<1%)
**Perfil**: Mujer joven, sin factores de riesgo, PA normal
```json
{
  "edad": 30,
  "sexo": "femenino",
  "fumador": false,
  "diabetes": false,
  "hipertension": false,
  "cardiovascular": false,
  "renal": false,
  "sistolica": 110,
  "diastolica": 70,
  "conoceColesterol": true,
  "colesterolTotal": 170,
  "hdl": 60
}
```

**Verificaciones**:
- ✅ `resultado.categoria` = "BAJO"
- ✅ `resultado.riesgo` = "<1%"
- ✅ `resultado.puntuacion` < 9 (femenino)

### Test 8.2: Riesgo MODERADO (2-5%)
**Perfil**: Hombre 55 años, fumador, PA elevada
```json
{
  "edad": 55,
  "sexo": "masculino",
  "fumador": true,
  "diabetes": false,
  "hipertension": false,
  "cardiovascular": false,
  "renal": false,
  "sistolica": 135,
  "diastolica": 88,
  "conoceColesterol": true,
  "colesterolTotal": 210,
  "hdl": 45
}
```

**Verificaciones**:
- ✅ `resultado.categoria` = "MODERADO"
- ✅ `resultado.riesgo` en rango "2%", "5%", o "10%"
- ✅ `resultado.puntuacion` entre 7-12 (masculino)

### Test 8.3: Riesgo ALTO (>20%)
**Perfil**: Hombre 65 años, fumador, diabetes, hipertensión, colesterol alto
```json
{
  "edad": 65,
  "sexo": "masculino",
  "fumador": true,
  "diabetes": true,
  "hipertension": true,
  "cardiovascular": false,
  "renal": false,
  "sistolica": 155,
  "diastolica": 98,
  "conoceColesterol": true,
  "colesterolTotal": 260,
  "hdl": 32
}
```

**Verificaciones**:
- ✅ `resultado.categoria` = "ALTO"
- ✅ `resultado.riesgo` = ">20%" o "20%"
- ✅ `resultado.puntuacion` >= 18 (masculino)

---

## 🔄 PASO 9: Testing de Trazabilidad IoT

### Test 9.1: Evaluación con Múltiples Fuentes
**Request Body**:
```json
{
  "paciente_id": "PAC001",
  "sesion_id": "SES_TEST_001",
  "datos_entrada": {
    "edad": 50,
    "sexo": "masculino",
    "fumador": false,
    "diabetes": false,
    "hipertension": false,
    "cardiovascular": false,
    "renal": false,
    "sistolica": {
      "valor": 130,
      "fuente": "tensiometro",
      "medicion_id": "MED_TEST_001",
      "timestamp": "2026-03-31T05:15:00.000Z"
    },
    "diastolica": {
      "valor": 85,
      "fuente": "tensiometro",
      "medicion_id": "MED_TEST_001",
      "timestamp": "2026-03-31T05:15:00.000Z"
    },
    "frecuencia": {
      "valor": 75,
      "fuente": "pulsoximetro",
      "medicion_id": "MED_TEST_002"
    },
    "conoceColesterol": false,
    "peso": {
      "valor": 82,
      "fuente": "balanza",
      "medicion_id": "MED_TEST_003"
    },
    "talla": 175
  }
}
```

**Verificaciones en Respuesta**:
- ✅ Evaluación creada exitosamente
- ✅ `datos_entrada` preserva estructura de objetos con `fuente` y `medicion_id`

**Verificaciones en PDF**:
1. Descargar PDF generado
2. ✅ Verificar sección "Signos Vitales" muestra:
   ```
   • Presión Arterial: 130/85 mmHg
     Fuente: tensiometro (ID: MED_TEST_001)
   • Frecuencia Cardíaca: 75 lpm
     Fuente: pulsoximetro (ID: MED_TEST_002)
   ```
3. ✅ Verificar sección "Datos Antropométricos" muestra:
   ```
   • Peso: 82 kg
     Fuente: balanza (ID: MED_TEST_003)
   • Talla: 175 cm
     Fuente: manual
   ```

### Test 9.2: Consultar Evaluación y Verificar Trazabilidad
**Endpoint**: `GET /api/evaluaciones/{evaluacion_id}`

**Verificaciones en JSON**:
```json
{
  "datos_entrada": {
    "sistolica": {
      "valor": 130,
      "fuente": "tensiometro",
      "medicion_id": "MED_TEST_001",
      "timestamp": "2026-03-31T05:15:00.000Z"
    },
    // ... otros campos
  }
}
```
- ✅ Estructura de objetos preservada en BD
- ✅ `medicion_id` permite rastrear origen de dato

---

## 📊 PASO 10: Testing de Integración con data/evaluaciones.json

### Test 10.1: Verificar Persistencia en JSON
**Archivo**: `data/evaluaciones.json`

**Comando PowerShell**:
```powershell
Get-Content "data\evaluaciones.json" | ConvertFrom-Json | Format-List
```

**Estructura Esperada**:
```json
{
  "riesgo_cardiovascular": [],
  "hads": [],
  "evaluaciones": [
    {
      "id": "EVAL_1711843200000_abc123xyz",
      "tipo": "riesgo_cardiovascular",
      "paciente_id": "PAC001",
      "sesion_id": null,
      "fecha": "2026-03-31T05:20:00.000Z",
      "datos_entrada": { /* ... */ },
      "resultado": { /* ... */ },
      "pdf_path": "/pdfs/evaluaciones/EVAL_1711843200000_abc123xyz.pdf",
      "creado_por": "pac001",
      "version_algoritmo": "PAHO_v1.0"
    }
  ]
}
```

**Verificaciones**:
- ✅ Array `evaluaciones` contiene todas las evaluaciones creadas
- ✅ Arrays legacy `riesgo_cardiovascular` y `hads` vacíos (compatibilidad)
- ✅ Cada evaluación tiene estructura completa
- ✅ No hay duplicados de ID

---

## 🎯 RESUMEN DE PRUEBAS CRÍTICAS

### ✅ Funcionalidades Esenciales
| # | Test | Esperado | Status |
|---|------|----------|--------|
| 1 | Login obtiene JWT | Token válido | ⬜ |
| 2 | Crear evaluación manual | 201 + PDF | ⬜ |
| 3 | Crear evaluación con IoT | 201 + trazabilidad | ⬜ |
| 4 | Consultar evaluación por ID | 200 + datos completos | ⬜ |
| 5 | Historial de paciente | 200 + array ordenado | ⬜ |
| 6 | Descargar PDF | Archivo válido | ⬜ |
| 7 | Verificar contenido PDF | Secciones completas | ⬜ |
| 8 | Validación de edad | 400 + error | ⬜ |
| 9 | Validación de PA | 400 + error | ⬜ |
| 10 | Permisos paciente | 403 para otros | ⬜ |
| 11 | Permisos médico | 200 para todos | ⬜ |
| 12 | Algoritmo BAJO | <1%, puntos < 9 | ⬜ |
| 13 | Algoritmo ALTO | >20%, múltiples factores | ⬜ |
| 14 | Trazabilidad IoT en PDF | Fuente + medicion_id visible | ⬜ |
| 15 | Persistencia JSON | Datos guardados correctamente | ⬜ |

### 🐛 Errores Conocidos a Verificar
- [ ] Sin token → 401
- [ ] Edad inválida → 400
- [ ] PA incoherente → 400
- [ ] Paciente accede a otro → 403
- [ ] ID inexistente → 404
- [ ] Colesterol fuera de rango → 400

---

## 📝 REGISTRO DE RESULTADOS

**Fecha Test**: _______________  
**Tester**: _______________  
**Rama**: `feature/evaluacion-riesgo-cardiovascular`  
**Commits**: e81fdbc, 1997c94

### Hallazgos:
```
[Anotar bugs, mejoras, comportamientos inesperados]







```

### Conclusión:
- [ ] ✅ APROBADO - Backend listo para frontend
- [ ] ⚠️ CONDICIONAL - Requiere ajustes menores
- [ ] ❌ RECHAZADO - Errores críticos encontrados

---

## 🚀 SIGUIENTES PASOS

**Si Backend Aprobado**:
1. Merge commit testing → feature branch
2. Continuar con Frontend Días 3-4:
   - Modificar `riesgo-cardiovascular.html`
   - Agregar selectores 3-modo (manual/última/ahora)
   - Integrar API POST y GET
   - Botón "Descargar PDF"

**Si Hay Bugs**:
1. Crear issues en Git
2. Priorizar críticos vs menores
3. Iterar fix → test → commit
4. Re-ejecutar tests afectados
