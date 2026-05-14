# 🏥 SoyBienmedico - Plataforma de Telemedicina

> Sistema integral de telemedicina para gestión de pacientes, videoconsultas, evaluaciones médicas y dashboards corporativos. Especializada en programas de salud ocupacional B2B y atención individual B2C.

[![Deployment](https://img.shields.io/badge/Deploy-Railway-purple)](https://proyecto-soybienmedico-production.up.railway.app)
[![Database](https://img.shields.io/badge/Database-Supabase-green)](https://supabase.com)
[![Node](https://img.shields.io/badge/Node.js-Express-blue)](https://expressjs.com)

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Arquitectura Técnica](#-arquitectura-técnica)
- [Roles de Usuario](#-roles-de-usuario)
- [Base de Datos](#-base-de-datos)
- [Funcionalidades](#-funcionalidades)
- [Rutas API](#-rutas-api)
- [Estructura de Archivos](#-estructura-de-archivos)
- [Deployment](#-deployment)
- [Datos de Producción](#-datos-de-producción)
- [Pendientes](#-pendientes)
- [Desarrollo](#-desarrollo)

---

## 🎯 Descripción General

**SoyBienmedico** es una plataforma de telemedicina completa que ofrece:

- **Atención individual**: Consultas médicas, historias clínicas, evaluaciones
- **Programas corporativos**: Dashboards para empresas con jornadas de salud
- **Evaluaciones especializadas**: Riesgo Cardiovascular (Framingham), HADS (Ansiedad/Depresión)
- **Monitoreo en tiempo real**: Presión arterial, glucosa, oxígeno
- **Sistema de jornadas**: Gestión de eventos de salud ocupacional
- **Generación de PDFs**: Historias clínicas, evaluaciones con QR único

---

## 🏗️ Arquitectura Técnica

### Backend
- **Framework**: Node.js + Express
- **Puerto**: 3000
- **Archivo principal**: `server.js`
- **Deployment**: Railway
- **URL Producción**: `https://proyecto-soybienmedico-production.up.railway.app`

### Base de Datos
- **Plataforma**: Supabase (PostgreSQL)
- **Configuración**: `config/supabase.js`
- **RLS**: Pendiente implementar en tablas corporativas

### Frontend
- **Stack**: HTML5 + jQuery 3.6.0
- **Componentes**: Select2 4.1.0, QRCode.js, FontAwesome 6.0.0
- **PDF**: PDFMake
- **Diseño**: Gradientes SoyBien (#667eea → #764ba2), glassmorphism

### Autenticación
- **Método**: JWT (bcryptjs)
- **Duración token**: 24 horas
- **Payload**: `{userId, username, role, medicoId, pacienteId, cliente_id}`

---

## 👥 Roles de Usuario

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `admin` | Super administrador SoyBienmedico | Todo el sistema |
| `medico` | Médicos que atienden pacientes | Pacientes asignados, historias, citas |
| `paciente` | Pacientes individuales | Dashboard personal, evaluaciones |
| `cliente` | Clientes corporativos (ej: Coca-Cola) | Dashboard de jornadas y estadísticas |

---

## 🗄️ Base de Datos

### Tablas Principales

#### **Usuarios y Pacientes**
```sql
users               -- Credenciales y roles
pacientes           -- Datos demográficos (programa_id FK)
medicos             -- Información de médicos
```

#### **Evaluaciones**
```sql
evaluaciones        -- Riesgo CV, HADS (jornada_id FK)
historias_clinicas  -- Historias médicas (jornada_id FK)
citas               -- Citas médicas
sesiones_medicion   -- Monitoreo tiempo real
```

#### **Estructura Corporativa (Sistema Jornadas)**
```sql
clientes   -- Empresas clientes
programas  -- Programas de salud por cliente
sedes      -- Ubicaciones físicas del cliente
jornadas   -- Eventos específicos (programa + sede + fecha)
```

### Relaciones Clave
```
clientes (1) ──► (N) programas
clientes (1) ──► (N) sedes
programas + sedes ──► jornadas
jornadas (1) ──► (N) evaluaciones
programas (1) ──► (N) pacientes
```

### Columnas Importantes

**Tabla `pacientes`:**
- `id`, `nombre`, `apellidos`
- `numero_documento`, `tipo_documento` (NO `identificacion`)
- `fecha_nacimiento` (NO `edad` - se calcula)
- `programa_id` (FK a programas)

**Tabla `evaluaciones`:**
- `tipo`: `'riesgo_cardiovascular'` | `'hads'`
- `resultado`: JSON con estructura específica por tipo
- `jornada_id`: FK a jornadas

---

## ✨ Funcionalidades

### 👤 Panel PACIENTE
- ✅ Dashboard con resumen médico
- ✅ Monitoreo tiempo real (presión, glucosa, oxígeno)
- ✅ Evaluaciones:
  - Riesgo Cardiovascular (Framingham)
  - HADS (Ansiedad + Depresión)
- ✅ Videoconsulta
- ✅ **Historias Clínicas con QR**: Cada historia genera QR único para verificación

### 👨‍⚕️ Panel MÉDICO
- ✅ Dashboard con pacientes asignados
- ✅ Crear/editar historias clínicas
- ✅ Videoconsulta
- ✅ Gestión de citas

### 🔧 Panel ADMIN
- ✅ Gestión completa de usuarios
- ✅ Asignación médico-paciente

### 🏢 Panel CLIENTE (Dashboards Corporativos)

**Páginas:**
1. **Login**: `dashclientes-login.html`
2. **Proyectos**: Lista de programas del cliente
3. **Overview**: Vista general con estadísticas de sedes
4. **Jornadas**: Lista de jornadas con total de evaluaciones
5. **Detalle Jornada**: 
   - 4 KPIs: Total evaluaciones, por tipo, casos seguimiento
   - 3 gráficas: Distribución Riesgo CV, Ansiedad, Depresión
   - Tabla de evaluaciones completas
   - Tabla de casos que requieren seguimiento
   - Botón "Descargar Reporte" (⏳ pendiente PDF)

---

## 🛣️ Rutas API

### Autenticación
```javascript
POST /login                      // Login general
POST /dashclientes/login         // Login clientes corporativos
```

### API Dashclientes (`routes/dashclientes.js`)
```javascript
GET /api/dashclientes/proyectos                // Lista programas del cliente
GET /api/dashclientes/overview/:clienteId      // Estadísticas generales
GET /api/dashclientes/jornadas/:clienteId      // Lista jornadas con totales
GET /api/dashclientes/jornada/:jornadaId       // Detalle completo de jornada
```

### Evaluaciones (`routes/evaluaciones.js`)
```javascript
POST /evaluaciones/riesgo-cardiovascular       // Crear evaluación Riesgo CV
POST /evaluaciones/hads                        // Crear evaluación HADS
```

---

## 📁 Estructura de Archivos

```
SoyBienmedico/
├── server.js                    # Servidor principal
├── package.json
├── README.md
│
├── config/
│   ├── supabase.js             # Cliente Supabase
│   └── local-db.js             # Fallback local
│
├── routes/
│   ├── dashclientes.js         # 🔥 API dashboards corporativos
│   ├── evaluaciones.js         # Crear evaluaciones (CV, HADS)
│   ├── auth.js                 # Login, JWT
│   ├── paciente.js             # Panel paciente
│   ├── medico.js               # Panel médico
│   └── admin.js                # Panel admin
│
├── services/
│   ├── evaluacion-service.js   # CRUD evaluaciones
│   ├── pdf-service.js          # Generación PDFs
│   ├── email-service.js        # Envío emails
│   └── paciente-service.js     # CRUD pacientes
│
├── public/
│   ├── index.html              # Login principal
│   └── pages/
│       ├── dashclientes/       # 🔥 Dashboards corporativos
│       │   ├── dashclientes-login.html
│       │   ├── dashclientes-proyectos.html
│       │   ├── dashclientes-overview.html
│       │   ├── dashclientes-jornadas.html
│       │   ├── dashclientes-jornada.html    # Detalle jornada
│       │   └── js/
│       │       ├── dashclientes-auth.js     # Helpers auth
│       │       └── dashclientes-jornada.js  # Carga estadísticas
│       ├── paciente/
│       │   ├── dashboard.html
│       │   ├── riesgo-cardiovascular.html
│       │   ├── hads-ansiedad-depresion.html
│       │   └── monitoreo-tiempo-real.html
│       ├── medico/
│       └── admin/
│
├── scripts/
│   └── dashclientes/
│       └── migrations SQL
│
├── uploads/
├── pdfs/
└── data/                       # JSON legacy (no usado)
```

---

## 🚀 Deployment

### Flujo de Despliegue (Railway)

```bash
# 1. Hacer cambios en código
git add .

# 2. Commit
git commit -m "descripción del cambio"

# 3. Push a GitHub
git push origin main

# 4. Railway auto-deploy (~2 minutos)
# URL: https://proyecto-soybienmedico-production.up.railway.app
```

### Variables de Entorno (Railway)

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
JWT_SECRET=xxx
EMAIL_USER=xxx
EMAIL_PASS=xxx
```

---

## 📊 Datos de Producción

### Cliente: Coca-Cola FEMSA

**Credenciales Dashboard:**
```
Email: soybiendashboard@gmail.com
Password: CocaCola2024!
```

**IDs Principales:**
```
Cliente ID:  f7dbcec1-9bab-4e9b-a83d-a96d26ae2f77
Programa ID: 52d053a0-7072-493a-a1a3-32667c02ecc8 ("Coca Cola saludable")
```

**Sedes Activas (8):**
1. CEDI Funza: `4a99be3c-040f-4851-abed-929df46d4d83`
2. Planta Tocancipá
3. Planta Madrid
4. Planta Girardot
5. Planta La Calera
6. Oficinas Bogotá
7. Planta Fúquene
8. Planta Villavicencio

**Jornada Real (Ejemplo):**
```
ID: 240ee82d-afa5-4a53-97bc-0f0ced9d62a6
Fecha: 12 Mayo 2026
Sede: CEDI Funza
Evaluaciones: 56 total
  - 10 Riesgo Cardiovascular
  - 46 HADS (Ansiedad/Depresión)
Descripción: "Jornada de salud Coca-Cola - Funza"
```

---

## ⏳ Pendientes

### 🔴 PRIORIDAD ALTA
- [ ] **Mejorar diseño de PDFs**
  - Actualmente: texto corrido sin estructura
  - Necesario: diseño profesional con secciones, logos, tablas, estética médica
  - Afecta: Historias clínicas, Riesgo CV, HADS

### 🟡 PRIORIDAD MEDIA
- [ ] **RLS (Row Level Security) en Supabase**
  - Tablas: `clientes`, `sedes`, `programas`, `jornadas`
  - Para que cada cliente solo vea SUS datos

- [ ] **PDF consolidado de jornada**
  - Botón "Descargar Reporte" funcional
  - PDF con estadísticas, gráficas, casos seguimiento

- [ ] **Envío de PDFs individuales por correo**
  - Riesgo Cardiovascular → email al paciente
  - HADS (Salud Mental) → email al paciente
  - Con link de descarga (como historias clínicas)

### 🟢 PRIORIDAD BAJA
- [ ] **Dashboard Superadmin global**
  - Para SoyBienmedico (administrador)
  - Ver todos los clientes, todas las jornadas
  - KPIs globales, tendencias, ingresos

---

## 💻 Desarrollo

### Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/SoyBienmedico.git
cd SoyBienmedico

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear archivo .env con las credenciales de Supabase

# 4. Ejecutar servidor
npm start
```

### Estructura de Commits

```bash
# Features
git commit -m "feat: agregar dashboard de jornadas"

# Fixes
git commit -m "fix: corregir columnas de pacientes en query"

# Docs
git commit -m "docs: actualizar README con arquitectura"
```

### Problemas Resueltos Recientemente

✅ Evaluaciones no aparecían (columnas incorrectas: `identificacion` → `numero_documento`)  
✅ Riesgo CV mostraba N/A (acceso incorrecto: `res.riesgoCardiovascular.categoria` → `res.categoria`)  
✅ localStorage inconsistente (usaba `token` en vez de `dashclientesToken`)  
✅ checkAuth() faltante en dashclientes-auth.js  
✅ SQL queries con columnas inexistentes

---

## 🔑 Notas Técnicas

### Cálculo de Edad
```javascript
// Se calcula desde fecha_nacimiento (NO se guarda en DB)
function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}
```

### Estructura JSON Resultado Riesgo CV
```json
{
  "puntos": 2,
  "categoria": "BAJO",
  "porcentaje": "1%",
  "descripcion": "Riesgo de evento cardiovascular a 10 años: 1%",
  "recomendaciones": [...]
}
```

### Estructura JSON Resultado HADS
```json
{
  "ansiedad": {
    "puntuacion": 5,
    "categoria": "NORMAL"
  },
  "depresion": {
    "puntuacion": 3,
    "categoria": "NORMAL"
  }
}
```

---

## 👨‍💻 Autor

**Jose Antonio Solano**  
Sistema de Telemedicina SoyBienmedico  
📧 Contacto: [soporte@soybiendmedico.com]

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles

---

## 🆘 Soporte

Para reportar bugs o solicitar features, contactar al equipo de desarrollo.