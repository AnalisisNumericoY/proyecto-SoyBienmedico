/* ============================================================================
   DASHCLIENTES - RUTAS API
   Endpoints para dashboard de clientes corporativos
   ============================================================================ */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');
const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// ---------------------------------------------------------------------------
// MIDDLEWARE: Verificar rol cliente
// ---------------------------------------------------------------------------
function checkClienteRole(req, res, next) {
    if (req.user.role !== 'cliente') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo para clientes corporativos.'
        });
    }
    next();
}

// ---------------------------------------------------------------------------
// GET /api/dashclientes/proyectos
// Obtener lista de proyectos del cliente autenticado
// ---------------------------------------------------------------------------
router.get('/proyectos', verifyToken, checkClienteRole, async (req, res) => {
    try {
        const clienteId = req.user.cliente_id;
        
        if (!clienteId) {
            return res.status(400).json({
                success: false,
                message: 'Usuario no asociado a ningún cliente'
            });
        }
        
        // Obtener información del cliente
        const { data: cliente, error: clienteError } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', clienteId)
            .eq('activo', true)
            .single();
        
        if (clienteError || !cliente) {
            console.error('❌ Error al obtener cliente:', clienteError);
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        // TODO: Calcular estadísticas reales desde pacientes/evaluaciones
        // Por ahora, devolver datos básicos del cliente
        const proyecto = {
            id: cliente.nombre,
            nombre: cliente.nombre_comercial,
            nit: cliente.nit,
            color_hex: cliente.color_hex,
            industria: cliente.industria || 'No especificada',
            total_colaboradores: cliente.objetivo_colaboradores || 0,
            // Estos se calcularán con queries a pacientes/evaluaciones
            colaboradores_tamizados: 0,
            teleconsultas: 0,
            estado: 'activo',
            descripcion: cliente.nombre_comercial
        };
        
        res.json({
            success: true,
            proyectos: [proyecto] // Por ahora, 1 cliente = 1 proyecto
        });
        
    } catch (error) {
        console.error('❌ Error en /dashclientes/proyectos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar proyectos',
            error: error.message
        });
    }
});

// ---------------------------------------------------------------------------
// GET /api/dashclientes/overview/:clienteId
// Obtener vista general de un cliente específico
// ---------------------------------------------------------------------------
router.get('/overview/:clienteId', verifyToken, checkClienteRole, async (req, res) => {
    try {
        const { clienteId } = req.params;
        
        // Verificar que el usuario tenga acceso a este cliente
        if (req.user.cliente_id !== clienteId) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permiso para ver este cliente'
            });
        }
        
        // Obtener cliente
        const { data: cliente, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', clienteId)
            .single();
        
        if (error || !cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        // TODO: Implementar queries para:
        // - Sedes del cliente
        // - Estadísticas de pacientes
        // - KPIs de salud (CV, SM, TC)
        
        res.json({
            success: true,
            cliente: cliente,
            sedes: [], // TODO
            kpis: {
                tamizaje_cv: 0,
                salud_mental: 0,
                teleconsultas: 0,
                en_monitoreo: 0
            }
        });
        
    } catch (error) {
        console.error('❌ Error en /dashclientes/overview:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar overview',
            error: error.message
        });
    }
});

module.exports = router;
