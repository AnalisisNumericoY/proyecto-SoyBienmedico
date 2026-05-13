/* ============================================================================
   DASHCLIENTES - RUTAS API
   Endpoints para dashboard de clientes corporativos
   ============================================================================ */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');
const supabase = require('../config/supabase');

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
        
        // 1. Obtener información del cliente
        const { data: cliente, error: clienteError } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', clienteId)
            .eq('activo', true)
            .single();
        
        if (clienteError || !cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        // 2. Obtener sedes del cliente
        const { data: sedes, error: sedesError } = await supabase
            .from('sedes')
            .select('*')
            .eq('cliente_id', clienteId)
            .eq('activa', true)
            .order('ciudad', { ascending: true })
            .order('nombre', { ascending: true });
        
        if (sedesError) {
            console.error('❌ Error al obtener sedes:', sedesError);
        }
        
        const sedesData = sedes || [];
        
        // 3. Calcular KPIs básicos de sedes
        const totalColaboradores = sedesData.reduce((sum, sede) => sum + (sede.colaboradores_objetivo || 0), 0);
        const ciudadesUnicas = [...new Set(sedesData.map(s => s.ciudad))].length;
        
        // 4. Calcular KPIs de salud desde evaluaciones
        // NOTA: Por ahora usaremos datos demo porque la tabla 'pacientes' 
        // todavía no tiene cliente_id para filtrar evaluaciones por cliente.
        // TODO: Cuando se agregue cliente_id a pacientes, calcular desde BD
        
        // Query para contar evaluaciones (sin filtro por cliente por ahora)
        const { count: totalEvaluaciones, error: evalError } = await supabase
            .from('evaluaciones')
            .select('*', { count: 'exact', head: true });
        
        // Query para riesgo CV alto (evaluar tipo = 'riesgo_cardiovascular' y resultado)
        const { data: evaluacionesCV, error: cvError } = await supabase
            .from('evaluaciones')
            .select('resultado')
            .eq('tipo', 'riesgo_cardiovascular');
        
        // Contar riesgo CV alto/muy alto (resultado > 20% o texto contiene 'Alto')
        let riesgoCVAlto = 0;
        if (evaluacionesCV) {
            riesgoCVAlto = evaluacionesCV.filter(e => {
                const res = e.resultado;
                if (typeof res === 'string') {
                    return res.includes('Alto') || res.includes('Muy Alto');
                }
                if (typeof res === 'object' && res.riesgo_porcentaje) {
                    return res.riesgo_porcentaje > 20;
                }
                return false;
            }).length;
        }
        
        // KPIs calculados y demo
        const kpis = {
            total_colaboradores: totalColaboradores,
            sedes_activas: sedesData.length,
            ciudades: ciudadesUnicas,
            
            // Datos reales de evaluaciones (sin filtro de cliente por ahora)
            tamizados: totalEvaluaciones || 0,
            riesgo_cv_alto: riesgoCVAlto,
            
            // Datos demo (hasta implementar citas y monitoreo por cliente)
            teleconsultas: Math.floor(totalColaboradores * 0.046), // ~4.6% demo
            en_monitoreo: Math.floor(totalColaboradores * 0.028)   // ~2.8% demo
        };
        
        res.json({
            success: true,
            cliente: {
                id: cliente.id,
                nombre: cliente.nombre,
                nombre_comercial: cliente.nombre_comercial,
                nit: cliente.nit,
                color_hex: cliente.color_hex,
                industria: cliente.industria
            },
            sedes: sedesData.map(s => ({
                id: s.id,
                nombre: s.nombre,
                ciudad: s.ciudad,
                direccion: s.direccion,
                latitud: s.latitud,
                longitud: s.longitud,
                responsable_sede: s.responsable_sede,
                telefono_sede: s.telefono_sede,
                colaboradores_objetivo: s.colaboradores_objetivo,
                tipo_sede: s.tipo_sede
            })),
            kpis: kpis
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
