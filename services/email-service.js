const nodemailer = require('nodemailer');

// Configuración del transporter de Nodemailer
// IMPORTANTE: Configurar variables de entorno en Railway
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,                    // Puerto TLS (más compatible que 465)
  secure: false,                // false para TLS, true para SSL
  auth: {
    user: process.env.EMAIL_USER || 'soybienmedico@gmail.com',
    pass: process.env.EMAIL_PASSWORD || ''
  },
  family: 4,                    // Forzar IPv4 (evita problemas con IPv6)
  tls: {
    rejectUnauthorized: false   // Permitir certificados autofirmados si es necesario
  }
});

/**
 * Servicio reutilizable para envío de correos electrónicos
 * @param {Object} options - Opciones del correo
 * @param {string} options.to - Destinatario(s) separados por coma
 * @param {string} options.cc - Copia (opcional)
 * @param {string} options.subject - Asunto del correo
 * @param {string} options.html - Contenido HTML del correo
 * @param {Array} options.attachments - Archivos adjuntos (opcional)
 * @returns {Promise<Object>} Resultado del envío
 */
async function sendEmail({ to, cc, subject, html, attachments = [] }) {
  try {
    const mailOptions = {
      from: `"SoyBienmedico" <${process.env.EMAIL_USER || 'soybienmedico@gmail.com'}>`,
      to: to,
      subject: subject,
      html: html
    };

    // Agregar CC si existe
    if (cc) {
      mailOptions.cc = cc;
    }

    // Agregar adjuntos si existen
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email enviado:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      to: to,
      subject: subject
    };

  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Enviar credenciales de acceso a nuevo paciente
 */
async function sendPacienteCredentials({ email, nombre, username, password }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Bienvenido a SoyBienmedico! 🏥</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Tu cuenta de paciente ha sido creada exitosamente. A continuación, tus credenciales de acceso:</p>
          
          <div class="credentials">
            <p><strong>👤 Usuario:</strong> ${username}</p>
            <p><strong>🔑 Contraseña:</strong> ${password}</p>
            <p><strong>🌐 Acceso:</strong> <a href="https://proyecto-soybienmedico-production.up.railway.app">Ingresa aquí</a></p>
          </div>
          
          <p><strong>⚠️ Recomendaciones de seguridad:</strong></p>
          <ul>
            <li>Cambia tu contraseña después del primer ingreso</li>
            <li>No compartas tus credenciales con nadie</li>
            <li>Mantén tu correo electrónico actualizado</li>
          </ul>
          
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <p>Saludos cordiales,<br><strong>Equipo SoyBienmedico</strong></p>
        </div>
        <div class="footer">
          <p>Este es un correo automático, por favor no responder.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: '🏥 Credenciales de acceso - SoyBienmedico',
    html: html
  });
}

/**
 * Enviar credenciales de acceso a nuevo médico
 */
async function sendMedicoCredentials({ email, nombre, username, password, especialidad }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: white; padding: 20px; border-left: 4px solid #2193b0; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Bienvenido al equipo médico! 👨‍⚕️</h1>
        </div>
        <div class="content">
          <p>Hola Dr(a). <strong>${nombre}</strong>,</p>
          <p>Tu cuenta de médico ha sido creada exitosamente. Ahora eres parte del equipo de SoyBienmedico.</p>
          
          <div class="credentials">
            <p><strong>🩺 Especialidad:</strong> ${especialidad || 'Medicina General'}</p>
            <p><strong>👤 Usuario:</strong> ${username}</p>
            <p><strong>🔑 Contraseña:</strong> ${password}</p>
            <p><strong>🌐 Portal Médico:</strong> <a href="https://proyecto-soybienmedico-production.up.railway.app">Ingresa aquí</a></p>
          </div>
          
          <p><strong>📋 Funcionalidades disponibles:</strong></p>
          <ul>
            <li>Ver agenda de citas programadas</li>
            <li>Realizar videoconsultas</li>
            <li>Generar historias clínicas digitales</li>
            <li>Acceder a información de pacientes</li>
          </ul>
          
          <p>Saludos cordiales,<br><strong>Equipo SoyBienmedico</strong></p>
        </div>
        <div class="footer">
          <p>Este es un correo automático, por favor no responder.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: '👨‍⚕️ Credenciales de acceso - Portal Médico SoyBienmedico',
    html: html
  });
}

/**
 * Enviar historia clínica por correo
 */
async function sendHistoriaClinica({ pacienteEmail, pacienteNombre, medicoNombre, pdfBuffer, pdfFileName, adminEmail }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-left: 4px solid #11998e; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📄 Historia Clínica Digital</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${pacienteNombre}</strong>,</p>
          <p>Tu historia clínica de la teleconsulta realizada con <strong>Dr. ${medicoNombre}</strong> está adjunta en este correo.</p>
          
          <div class="info-box">
            <p><strong>📋 Documento:</strong> Historia Clínica - Teleorientación</p>
            <p><strong>👨‍⚕️ Médico:</strong> ${medicoNombre}</p>
            <p><strong>📅 Fecha:</strong> ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <p><strong>⚠️ Información importante:</strong></p>
          <ul>
            <li>Conserva este documento para tu historial médico</li>
            <li>Puedes acceder a todas tus historias desde tu cuenta en la plataforma</li>
            <li>Este documento es confidencial, no lo compartas públicamente</li>
          </ul>
          
          <p>Si tienes alguna pregunta sobre tu consulta, comunícate con tu médico tratante.</p>
          <p>Saludos cordiales,<br><strong>Equipo SoyBienmedico</strong></p>
        </div>
        <div class="footer">
          <p>Este es un correo automático, por favor no responder.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: pacienteEmail,
    cc: adminEmail, // Copia a administradora
    subject: `📄 Historia Clínica - Teleconsulta con Dr. ${medicoNombre}`,
    html: html,
    attachments: [
      {
        filename: pdfFileName,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });
}

module.exports = {
  sendEmail,
  sendPacienteCredentials,
  sendMedicoCredentials,
  sendHistoriaClinica
};
