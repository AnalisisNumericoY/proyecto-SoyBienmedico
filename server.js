const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import routes
const { router: authRoutes } = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const medicoRoutes = require('./routes/medico');
const pacienteRoutes = require('./routes/paciente');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/medico', medicoRoutes);
app.use('/paciente', pacienteRoutes);
app.use('/api', apiRoutes);

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebRTC Socket handling for video calls
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Join room for video call
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    console.log(`Usuario ${userId} se unió a la sala ${roomId}`);
    socket.to(roomId).emit('user-connected', userId);

    // Handle disconnection
    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });

  // Handle signaling for WebRTC
  socket.on('offer', (roomId, offer) => {
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', (roomId, answer) => {
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('ice-candidate', (roomId, candidate) => {
    socket.to(roomId).emit('ice-candidate', candidate);
  });

  // Handle form data sharing during video call
  socket.on('form-update', (roomId, formData) => {
    socket.to(roomId).emit('form-update', formData);
  });

  // Handle PDF generation completion
  socket.on('pdf-generated', (roomId, pdfData) => {
    socket.to(roomId).emit('pdf-ready', pdfData);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Ruta no encontrada' 
  });
});

server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log(`Visita: http://localhost:${PORT}`);
});

module.exports = { app, io };