const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación JWT
 * Valida tokens JWT del servidor principal para endpoints internos
 */
const validateJWT = (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó token de autenticación',
        code: 'NO_TOKEN'
      });
    }

    // Verificar formato "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Formato de token inválido. Use: Bearer <token>',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    const token = parts[1];

    // Verificar y decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Agregar información del usuario a la request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      medicoId: decoded.medicoId,
      pacienteId: decoded.pacienteId,
      cliente_id: decoded.cliente_id
    };

    console.log(`✅ JWT validado - Usuario: ${decoded.username} (${decoded.role})`);
    
    next();
  } catch (error) {
    console.error('❌ Error validando JWT:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Error al validar autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware para validar API Keys (futuro)
 * Para endpoints públicos que requieren API Key
 */
const validateApiKey = (req, res, next) => {
  // TODO: Implementar en FASE 3
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API Key requerida',
      code: 'NO_API_KEY'
    });
  }
  
  // Por ahora, rechazar todas las peticiones con API Key
  return res.status(501).json({
    success: false,
    error: 'Autenticación con API Key no implementada aún',
    code: 'NOT_IMPLEMENTED'
  });
};

module.exports = {
  validateJWT,
  validateApiKey
};
