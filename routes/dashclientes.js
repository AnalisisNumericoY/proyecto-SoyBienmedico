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
// HELPER: Calcular edad desde fecha de nacimiento
// ---------------------------------------------------------------------------
function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    
    return edad;
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

// ---------------------------------------------------------------------------
// GET /api/dashclientes/jornadas/:clienteId
// Obtener lista de jornadas de un cliente específico
// ---------------------------------------------------------------------------
router.get('/jornadas/:clienteId', verifyToken, checkClienteRole, async (req, res) => {
    try {
        const { clienteId } = req.params;
        
        // Verificar que el usuario tenga acceso a este cliente
        if (req.user.cliente_id !== clienteId) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permiso para ver jornadas de este cliente'
            });
        }
        
        // Obtener jornadas del cliente (a través de programas)
        const { data: jornadas, error: jornadasError } = await supabase
            .from('jornadas')
            .select(`
                *,
                programa:programas!inner (
                    id,
                    nombre,
                    cliente_id
                ),
                sede:sedes (
                    id,
                    nombre,
                    ciudad
                )
            `)
            .eq('programa.cliente_id', clienteId)
            .order('fecha', { ascending: false });
        
        if (jornadasError) {
            console.error('❌ Error al obtener jornadas:', jornadasError);
            return res.status(500).json({
                success: false,
                message: 'Error al cargar jornadas'
            });
        }
        
        // Contar evaluaciones por jornada
        const jornadasConEvaluaciones = await Promise.all(
            (jornadas || []).map(async (jornada) => {
                const { count, error } = await supabase
                    .from('evaluaciones')
                    .select('*', { count: 'exact', head: true })
                    .eq('jornada_id', jornada.id);
                
                return {
                    id: jornada.id,
                    fecha: jornada.fecha,
                    responsable: jornada.responsable,
                    descripcion: jornada.descripcion,
                    activa: jornada.activa,
                    programa: {
                        id: jornada.programa.id,
                        nombre: jornada.programa.nombre
                    },
                    sede: jornada.sede ? {
                        id: jornada.sede.id,
                        nombre: jornada.sede.nombre,
                        ciudad: jornada.sede.ciudad,
                        departamento: jornada.sede.departamento,
                        tipo: jornada.sede.tipo_sede
                    } : {
                        nombre: 'Virtual/Móvil',
                        tipo: 'virtual'
                    },
                    total_evaluaciones: count || 0
                };
            })
        );
        
        res.json({
            success: true,
            jornadas: jornadasConEvaluaciones
        });
        
    } catch (error) {
        console.error('❌ Error en /dashclientes/jornadas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar jornadas',
            error: error.message
        });
    }
});

// ---------------------------------------------------------------------------
// GET /api/dashclientes/jornada/:jornadaId
// Obtener detalles y estadísticas de una jornada específica
// ---------------------------------------------------------------------------
router.get('/jornada/:jornadaId', verifyToken, checkClienteRole, async (req, res) => {
    try {
        const { jornadaId } = req.params;
        const clienteId = req.user.cliente_id;
        
        // 1. Obtener información de la jornada con programa y sede
        const { data: jornada, error: jornadaError } = await supabase
            .from('jornadas')
            .select(`
                *,
                programa:programas (
                    id,
                    nombre,
                    cliente_id,
                    cliente:clientes (
                        id,
                        nombre,
                        nombre_comercial,
                        color_hex
                    )
                ),
                sede:sedes (
                    id,
                    nombre,
                    ciudad,
                    colaboradores_objetivo
                )
            `)
            .eq('id', jornadaId)
            .single();
        
        if (jornadaError || !jornada) {
            console.error('❌ Error al obtener jornada:', jornadaError);
            return res.status(404).json({
                success: false,
                message: 'Jornada no encontrada'
            });
        }
        
        // 2. Verificar que la jornada pertenece al cliente del usuario
        if (jornada.programa?.cliente?.id !== clienteId) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permiso para ver esta jornada'
            });
        }
        
        // 3. Obtener todas las evaluaciones de la jornada
        const { data: evaluaciones, error: evalError } = await supabase
            .from('evaluaciones')
            .select(`
                id,
                tipo,
                fecha,
                resultado,
                datos_entrada,
                paciente_id,
                pacientes!paciente_id (
                    id,
                    nombre,
                    apellidos,
                    numero_documento,
                    tipo_documento,
                    fecha_nacimiento,
                    sexo
                )
            `)
            .eq('jornada_id', jornadaId)
            .order('fecha', { ascending: false });
        
        if (evalError) {
            console.error('❌ Error al obtener evaluaciones:', evalError);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener evaluaciones',
                error: evalError.message,
                details: evalError
            });
        }
        
        const evaluacionesData = evaluaciones || [];
        
        // 4. Calcular estadísticas por tipo
        const porTipo = {
            riesgo_cardiovascular: evaluacionesData.filter(e => e.tipo === 'riesgo_cardiovascular').length,
            hads: evaluacionesData.filter(e => e.tipo === 'hads').length
        };
        
        // 5. Analizar distribución de resultados RIESGO CARDIOVASCULAR
        const evaluacionesCV = evaluacionesData.filter(e => e.tipo === 'riesgo_cardiovascular');
        const distribucionCV = {
            bajo: 0,
            moderado: 0,
            alto: 0,
            muy_alto: 0
        };
        
        evaluacionesCV.forEach(e => {
            const res = e.resultado;
            if (res && res.categoria) {
                const categoria = res.categoria || '';
                if (categoria.includes('BAJO') || categoria.includes('Bajo')) {
                    distribucionCV.bajo++;
                } else if (categoria.includes('MODERADO') || categoria.includes('Moderado')) {
                    distribucionCV.moderado++;
                } else if (categoria.includes('MUY ALTO') || categoria.includes('Muy Alto')) {
                    distribucionCV.muy_alto++;
                } else if (categoria.includes('ALTO') || categoria.includes('Alto')) {
                    distribucionCV.alto++;
                }
            }
        });
        
        // 6. Analizar distribución de resultados HADS (Ansiedad y Depresión)
        const evaluacionesHADS = evaluacionesData.filter(e => e.tipo === 'hads');
        const distribucionAnsiedad = {
            normal: 0,
            leve: 0,
            moderado: 0,
            severo: 0
        };
        const distribucionDepresion = {
            normal: 0,
            leve: 0,
            moderado: 0,
            severo: 0
        };
        
        evaluacionesHADS.forEach(e => {
            const res = e.resultado;
            
            // Ansiedad
            if (res && res.ansiedad) {
                const cat = res.ansiedad.categoria || res.ansiedad.clase || '';
                if (cat.includes('NORMAL') || cat.includes('normal') || cat.includes('Normal')) {
                    distribucionAnsiedad.normal++;
                } else if (cat.includes('LEVE') || cat.includes('leve') || cat.includes('Leve')) {
                    distribucionAnsiedad.leve++;
                } else if (cat.includes('MODERADO') || cat.includes('moderado') || cat.includes('Moderado')) {
                    distribucionAnsiedad.moderado++;
                } else if (cat.includes('SEVERO') || cat.includes('severo') || cat.includes('GRAVE') || cat.includes('Grave')) {
                    distribucionAnsiedad.severo++;
                }
            }
            
            // Depresión
            if (res && res.depresion) {
                const cat = res.depresion.categoria || res.depresion.clase || '';
                if (cat.includes('NORMAL') || cat.includes('normal') || cat.includes('Normal')) {
                    distribucionDepresion.normal++;
                } else if (cat.includes('LEVE') || cat.includes('leve') || cat.includes('Leve')) {
                    distribucionDepresion.leve++;
                } else if (cat.includes('MODERADO') || cat.includes('moderado') || cat.includes('Moderado')) {
                    distribucionDepresion.moderado++;
                } else if (cat.includes('SEVERO') || cat.includes('severo') || cat.includes('GRAVE') || cat.includes('Grave')) {
                    distribucionDepresion.severo++;
                }
            }
        });
        
        // 7. Identificar casos que requieren seguimiento
        const casosSeguimiento = evaluacionesData.filter(e => {
            const res = e.resultado;
            
            if (e.tipo === 'riesgo_cardiovascular') {
                // Riesgo CV alto o muy alto
                const cat = res?.categoria || '';
                return cat.includes('ALTO') || cat.includes('Alto') || cat.includes('MUY ALTO') || cat.includes('Muy Alto');
            }
            
            if (e.tipo === 'hads') {
                // Ansiedad o depresión moderada o severa
                const ansiedadCat = res?.ansiedad?.categoria || res?.ansiedad?.clase || '';
                const depresionCat = res?.depresion?.categoria || res?.depresion?.clase || '';
                
                const ansiedadAlta = ansiedadCat.includes('MODERADO') || ansiedadCat.includes('SEVERO') || 
                                     ansiedadCat.includes('moderado') || ansiedadCat.includes('severo') ||
                                     ansiedadCat.includes('GRAVE') || ansiedadCat.includes('Grave');
                
                const depresionAlta = depresionCat.includes('MODERADO') || depresionCat.includes('SEVERO') ||
                                      depresionCat.includes('moderado') || depresionCat.includes('severo') ||
                                      depresionCat.includes('GRAVE') || depresionCat.includes('Grave');
                
                return ansiedadAlta || depresionAlta;
            }
            
            return false;
        }).map(e => ({
            evaluacion_id: e.id,
            tipo: e.tipo,
            fecha: e.fecha,
            paciente: {
                id: e.pacientes?.id,
                nombre: `${e.pacientes?.nombre || ''} ${e.pacientes?.apellidos || ''}`.trim(),
                identificacion: e.pacientes?.numero_documento,
                tipo_documento: e.pacientes?.tipo_documento,
                edad: calcularEdad(e.pacientes?.fecha_nacimiento),
                sexo: e.pacientes?.sexo
            },
            motivo: obtenerMotivoSeguimiento(e)
        }));
        
        // 8. Preparar respuesta
        res.json({
            success: true,
            jornada: {
                id: jornada.id,
                fecha: jornada.fecha,
                responsable: jornada.responsable,
                descripcion: jornada.descripcion,
                activa: jornada.activa,
                programa: {
                    id: jornada.programa?.id,
                    nombre: jornada.programa?.nombre,
                    descripcion: jornada.programa?.descripcion
                },
                sede: jornada.sede ? {
                    id: jornada.sede.id,
                    nombre: jornada.sede.nombre,
                    ciudad: jornada.sede.ciudad,
                    departamento: jornada.sede.departamento,
                    direccion: jornada.sede.direccion,
                    tipo: jornada.sede.tipo_sede,
                    colaboradores_objetivo: jornada.sede.colaboradores_objetivo
                } : {
                    nombre: 'Virtual/Móvil',
                    tipo: 'virtual'
                },
                cliente: {
                    id: jornada.programa?.cliente?.id,
                    nombre: jornada.programa?.cliente?.nombre_comercial,
                    color_hex: jornada.programa?.cliente?.color_hex
                }
            },
            estadisticas: {
                total_evaluaciones: evaluacionesData.length,
                por_tipo: porTipo,
                distribucion_riesgo_cv: distribucionCV,
                distribucion_ansiedad: distribucionAnsiedad,
                distribucion_depresion: distribucionDepresion,
                casos_seguimiento: casosSeguimiento.length
            },
            casos_seguimiento: casosSeguimiento,
            evaluaciones: evaluacionesData.map(e => ({
                id: e.id,
                tipo: e.tipo,
                fecha: e.fecha,
                paciente: {
                    id: e.pacientes?.id,
                    nombre: `${e.pacientes?.nombre || ''} ${e.pacientes?.apellidos || ''}`.trim(),
                    identificacion: e.pacientes?.numero_documento,
                    tipo_documento: e.pacientes?.tipo_documento,
                    edad: calcularEdad(e.pacientes?.fecha_nacimiento),
                    sexo: e.pacientes?.sexo
                },
                resultado_resumido: obtenerResumenResultado(e)
            }))
        });
        
    } catch (error) {
        console.error('❌ Error en /dashclientes/jornada:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar datos de jornada',
            error: error.message
        });
    }
});

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Obtener motivo de seguimiento de una evaluación
 */
function obtenerMotivoSeguimiento(evaluacion) {
    const motivos = [];
    const res = evaluacion.resultado;
    
    if (evaluacion.tipo === 'riesgo_cardiovascular') {
        const cat = res?.categoria || '';
        if (cat.includes('MUY ALTO') || cat.includes('Muy Alto')) {
            motivos.push('Riesgo cardiovascular MUY ALTO');
        } else if (cat.includes('ALTO') || cat.includes('Alto')) {
            motivos.push('Riesgo cardiovascular ALTO');
        }
    }
    
    if (evaluacion.tipo === 'hads') {
        const ansiedadCat = res?.ansiedad?.categoria || res?.ansiedad?.clase || '';
        const depresionCat = res?.depresion?.categoria || res?.depresion?.clase || '';
        
        if (ansiedadCat.includes('SEVERO') || ansiedadCat.includes('severo') || ansiedadCat.includes('GRAVE')) {
            motivos.push('Ansiedad SEVERA');
        } else if (ansiedadCat.includes('MODERADO') || ansiedadCat.includes('moderado')) {
            motivos.push('Ansiedad MODERADA');
        }
        
        if (depresionCat.includes('SEVERO') || depresionCat.includes('severo') || depresionCat.includes('GRAVE')) {
            motivos.push('Depresión SEVERA');
        } else if (depresionCat.includes('MODERADO') || depresionCat.includes('moderado')) {
            motivos.push('Depresión MODERADA');
        }
    }
    
    return motivos.join(', ') || 'Requiere evaluación';
}

/**
 * Obtener resumen de resultado de una evaluación
 */
function obtenerResumenResultado(evaluacion) {
    const res = evaluacion.resultado;
    
    if (evaluacion.tipo === 'riesgo_cardiovascular') {
        return {
            categoria: res?.categoria || 'N/A',
            porcentaje: res?.porcentaje || 0,
            imc: res?.imc?.valor || null,
            presion: res?.presionArterial?.categoria || 'N/A'
        };
    }
    
    if (evaluacion.tipo === 'hads') {
        return {
            ansiedad: {
                categoria: res?.ansiedad?.categoria || res?.ansiedad?.clase || 'N/A',
                puntuacion: res?.ansiedad?.puntuacion || 0
            },
            depresion: {
                categoria: res?.depresion?.categoria || res?.depresion?.clase || 'N/A',
                puntuacion: res?.depresion?.puntuacion || 0
            },
            burnout: {
                categoria: res?.burnout?.categoria || res?.burnout?.clase || 'N/A',
                puntuacion: res?.burnout?.puntuacion || 0
            }
        };
    }
    
    return {};
}

module.exports = router;
