# Configuración de Email para SoyBienmedico

## Variables de entorno requeridas

Agregar estas variables en **Railway** → **Variables**:

```env
EMAIL_USER=soybienmedico@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicacion_gmail
ADMIN_EMAIL=administracion@soybienmedico.com
```

## Cómo obtener la contraseña de aplicación de Gmail

1. Ve a tu cuenta de Google
2. Seguridad → Verificación en dos pasos (debe estar activada)
3. Seguridad → Contraseñas de aplicaciones
4. Selecciona "Correo" y "Otro (nombre personalizado)"
5. Escribe "SoyBienmedico Railway"
6. Click en "Generar"
7. Copia la contraseña de 16 caracteres
8. Pégala en Railway como `EMAIL_PASSWORD`

## Funcionalidades de email implementadas

### ✅ Servicios disponibles (en services/email-service.js)

1. **sendPacienteCredentials** - Envía credenciales de acceso a nuevo paciente
2. **sendMedicoCredentials** - Envía credenciales de acceso a nuevo médico  
3. **sendHistoriaClinica** - Envía PDF de historia clínica a paciente (con copia a admin)

### 📧 Emails que se envían actualmente

- **Historia clínica**: Al finalizar teleconsulta
  - Destinatario: Email del paciente
  - CC: Email de administración
  - Adjunto: PDF de historia clínica

### 🔜 Pendientes de implementar

- Enviar credenciales al crear paciente (en routes/admin.js)
- Enviar credenciales al crear médico (en routes/admin.js)
- Enviar PDF de riesgo cardiovascular
- Enviar PDF de salud mental (HADS)

## Estructura de emails

Todos los emails usan:
- HTML responsive
- Diseño profesional con gradientes
- Información relevante según el contexto
- Instrucciones claras para el usuario

## Testing

Para probar los emails localmente:

1. Configura las variables de entorno en un archivo `.env`
2. Asegúrate de que el EMAIL_USER y EMAIL_PASSWORD sean válidos
3. El servicio usa Gmail por defecto, pero puede cambiarse a otro proveedor
