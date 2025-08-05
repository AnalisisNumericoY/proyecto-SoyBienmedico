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
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://proyecto-soybienmedico-production.up.railway.app"]
      : "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? "https://proyecto-soybienmedico-production.up.railway.app"
    : "*",
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/medico', medicoRoutes);
app.use('/paciente', pacienteRoutes);
app.use('/api', apiRoutes);

// Debug endpoint directly in server
app.get('/debug/data', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const loadJsonFile = async (filePath) => {
      try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
        return {};
      }
    };

    const CITAS_FILE = path.join(__dirname, 'data/citas.json');
    const MEDICOS_FILE = path.join(__dirname, 'data/medicos.json');
    const PACIENTES_FILE = path.join(__dirname, 'data/pacientes.json');
    const HISTORIAS_FILE = path.join(__dirname, 'data/historias-clinicas.json');
    const USERS_FILE = path.join(__dirname, 'data/users.json');

    console.log('Loading debug data...');
    
    const citasData = await loadJsonFile(CITAS_FILE);
    const medicosData = await loadJsonFile(MEDICOS_FILE);
    const pacientesData = await loadJsonFile(PACIENTES_FILE);
    const historiasData = await loadJsonFile(HISTORIAS_FILE);
    const usersData = await loadJsonFile(USERS_FILE);

    console.log('Citas loaded:', citasData.citas?.length || 0);
    console.log('Medicos loaded:', medicosData.medicos?.length || 0);
    console.log('Pacientes loaded:', pacientesData.pacientes?.length || 0);

    res.json({
      success: true,
      citas: citasData.citas || [],
      medicos: medicosData.medicos || [],
      pacientes: pacientesData.pacientes || [],
      historias: historiasData.historias || [],
      users: usersData.users || []
    });

  } catch (error) {
    console.error('Error loading debug data:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

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

    // Store user info for proper cleanup
    socket.userId = userId;
    socket.roomId = roomId;

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Usuario ${userId} se desconectó de la sala ${roomId}`);
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });

  // Handle explicit room leaving
  socket.on('leave-room', (roomId) => {
    if (socket.userId && socket.roomId) {
      console.log(`Usuario ${socket.userId} salió explícitamente de la sala ${socket.roomId}`);
      socket.to(socket.roomId).emit('user-disconnected', socket.userId);
      socket.leave(socket.roomId);
    }
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📱 Modo: ${process.env.NODE_ENV}`);
  console.log(`🌐 Plataforma de telemedicina SoyBienmedico iniciada`);
});

module.exports = { app, io };