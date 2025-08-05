# SoyBienmedico - Plataforma de Telemedicina

Sistema completo de telemedicina con videollamadas en tiempo real para médicos, pacientes y administradores.

## 🚀 Funcionalidades

### 👥 **Módulo Administrador**
- ✅ Crear nuevos médicos y pacientes
- ✅ Programar y gestionar citas médicas
- ✅ Consultar historias clínicas por paciente
- ✅ Dashboard administrativo completo

### 👨‍⚕️ **Módulo Médico**
- ✅ Ver citas programadas
- ✅ Videoconsultas con pacientes
- ✅ Formulario médico durante la consulta
- ✅ Generación de PDF con firma digital
- ✅ Teleorientación completa

### 👤 **Módulo Paciente**
- ✅ Ver citas agendadas
- ✅ Unirse a videoconsultas
- ✅ Acceso a historias clínicas en PDF

## 🛠️ Tecnologías

- **Backend**: Node.js + Express
- **WebRTC**: Socket.io para videollamadas
- **Autenticación**: JWT
- **Base de datos**: JSON local (migrable a Supabase)
- **Frontend**: HTML5, CSS3, JavaScript vanilla

## 📋 Credenciales de Prueba

```
Administrador: secretary@hospital.com / 123456
Médico: admin@hospital.com / 123456
Paciente: patient@hospital.com / 123456
```

## 🚀 Instalación y Uso

### Desarrollo Local

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

3. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

4. **Ejecutar en producción**
   ```bash
   npm start
   ```

### Despliegue en Vercel

1. Conectar repositorio a Vercel
2. Configurar variables de entorno en Vercel
3. Deploy automático

## 📁 Estructura del Proyecto

```
mediconnect-platform/
├── package.json
├── server.js                 # Servidor principal
├── .env.example              # Template de variables
├── .gitignore               # Archivos ignorados
├── config/                  # Configuraciones
├── data/                    # Base de datos JSON
├── routes/                  # Rutas de la API
└── public/                  # Frontend
    ├── index.html          # Login principal
    └── pages/              # Páginas por módulo
        ├── admin/
        ├── medico/
        └── paciente/
```

## 🔧 API Endpoints

- `POST /api/login` - Autenticación
- `GET /api/admin/*` - Rutas administrativas
- `GET /api/medico/*` - Rutas médicas
- `GET /api/paciente/*` - Rutas de pacientes
- `WebSocket /socket.io` - Videollamadas

## 👨‍💻 Desarrollado por

**Jose Solano** - Sistema de Telemedicina SoyBienmedico

## 📄 Licencia

MIT License