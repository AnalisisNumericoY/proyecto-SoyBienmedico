# Arquitectura Modular - SoyBienmedico

## 📁 Estructura de Carpetas

```
SoyBienmedico/
├── services/           # Lógica de negocio reutilizable
├── utils/              # Utilidades compartidas
├── routes/             # Endpoints de API
├── data/               # Base de datos JSON
├── uploads/            # PDFs generados
└── public/             # Frontend
```

## 🔧 Services (Servicios)

Los servicios encapsulan la lógica de negocio y son reutilizables en toda la aplicación.

### `capsula-service.js`
Gestión de cápsulas en múltiples ubicaciones
- `getAllCapsulas()` - Obtiene todas las cápsulas
- `getCapsulaById(id)` - Obtiene una cápsula específica
- `getActiveCapsulas()` - Obtiene cápsulas activas
- `createCapsula(data)` - Crea nueva cápsula
- `updateCapsula(id, data)` - Actualiza cápsula

### `sesion-service.js`
Gestión de sesiones de medición
- `iniciarSesion(data)` - Inicia sesión de medición
- `finalizarSesion(id)` - Finaliza sesión
- `getSesionActivaByCapsula(id)` - Obtiene sesión activa
- `haySesionActiva(id)` - Verifica si hay sesión activa

### `medicion-service.js`
Gestión de mediciones de dispositivos
- `guardarMedicion(data)` - Guarda nueva medición
- `getUltimasMedicionesByPaciente(id)` - Obtiene últimas mediciones
- `getMedicionesRecientes(id)` - Obtiene mediciones recientes
- `getResumenSignosVitales(id)` - Obtiene resumen de signos vitales

### `paciente-service.js`
Operaciones sobre pacientes
- `getAllPacientes()` - Obtiene todos los pacientes
- `getPacienteById(id)` - Obtiene paciente por ID
- `getPacienteByDocumento(doc)` - Obtiene paciente por documento
- `getDatosBasicos(id)` - Obtiene datos básicos del paciente

### `evaluacion-service.js`
Gestión de evaluaciones (Riesgo CV, HADS)
- `guardarRiesgoCardiovascular(data)` - Guarda evaluación de riesgo
- `guardarHADS(data)` - Guarda evaluación HADS
- `getResumenEvaluaciones(id)` - Obtiene resumen de evaluaciones

### `pdf-service.js`
Generación de PDFs
- `generarPDFRiesgoCardiovascular(data)` - Genera PDF de riesgo CV
- `generarPDFHADS(data)` - Genera PDF de HADS
- `generarPDFHistoriaClinica(data)` - Genera PDF de historia clínica

## 🛠️ Utils (Utilidades)

Funciones helper reutilizables en toda la aplicación.

### `file-handler.js`
Manejo de archivos JSON
- `loadJsonFile(path)` - Carga archivo JSON
- `saveJsonFile(path, data)` - Guarda archivo JSON
- `fileExists(path)` - Verifica si existe archivo
- `ensureDirectory(path)` - Crea directorio si no existe

### `validators.js`
Validaciones
- `validateRequiredFields(obj, fields)` - Valida campos requeridos
- `isValidDocumento(doc)` - Valida número de documento
- `isValidEmail(email)` - Valida email
- `validatePresionArterial(s, d)` - Valida presión arterial

### `date-helpers.js`
Manejo de fechas
- `getCurrentTimestamp()` - Obtiene timestamp actual
- `formatDateTime(date)` - Formatea fecha y hora
- `formatDate(date)` - Formatea solo fecha
- `calculateAge(birthDate)` - Calcula edad

## 💾 Archivos de Datos

### Nuevos archivos JSON:

- `capsulas.json` - Registro de cápsulas en diferentes ubicaciones
- `sesiones-medicion.json` - Sesiones de medición activas/finalizadas
- `evaluaciones.json` - Evaluaciones de riesgo cardiovascular y HADS

## 🚀 Uso de Servicios

### Ejemplo: Iniciar sesión de medición

```javascript
const sesionService = require('./services/sesion-service');
const medicionService = require('./services/medicion-service');

// Iniciar sesión
const sesion = await sesionService.iniciarSesion({
  capsula_id: 'CAPSULA_01',
  paciente_id: 'PAC001',
  numero_documento: '12345678',
  tipo_sesion: 'clasificacion_riesgos'
});

// Guardar medición
const medicion = await medicionService.guardarMedicion({
  paciente_id: 'PAC001',
  numero_documento: '12345678',
  sesion_id: sesion.id,
  capsula_id: 'CAPSULA_01',
  dispositivo: 'tensiometro',
  mediciones: {
    sistolica: 120,
    diastolica: 80
  }
});

// Finalizar sesión
await sesionService.finalizarSesion(sesion.id);
```

## 🔄 Migración Progresiva

Los servicios están listos para ser usados. La migración de código existente se hará progresivamente:

1. ✅ Estructura modular creada
2. 🔄 Routes usarán los servicios (próximo sprint)
3. 🔄 Frontend usará nuevos endpoints (próximo sprint)

## 📝 Notas

- Todos los servicios usan async/await
- Manejo de errores con try/catch
- Funciones documentadas con JSDoc
- Código reutilizable y testeable
