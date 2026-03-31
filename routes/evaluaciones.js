/**
 * Routes: Evaluaciones Médicas (Riesgo Cardiovascular, HADS, etc.)
 * Sprint 2 - Sistema modular y reutilizable
 * SoyBienmedico - 2026
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');
const evaluacionService = require('../services/evaluacion-service');
const pdfService = require('../services/pdf-service');
const { validarEvaluacionRiesgo } = require('../utils/validators');

/**
 * POST /api/evaluaciones/riesgo-cardiovascular
 * Crear nueva evaluación de riesgo cardiovascular
 * 
 * Body: {
 *   paciente_id: string,
 *   sesion_id?: string,
 *   datos_entrada: {
 *     edad: number,
 *     sexo: string,
 *     fumador: boolean,
 *     // ... todos los campos del formulario
 *     // con información de fuente para campos IoT
 *   }
 * }
 */
router.post('/riesgo-cardiovascular', verifyToken, async (req, res) => {
    try {
        const { paciente_id, sesion_id, datos_entrada, creado_por } = req.body;

        // Validar datos de entrada
        const validacion = validarEvaluacionRiesgo(datos_entrada);
        if (!validacion.valido) {
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos',
                detalles: validacion.errores
            });
        }

        // Calcular riesgo cardiovascular (algoritmo PAHO)
        const resultado = calcularRiesgoCardiovascular(datos_entrada);

        // Crear objeto de evaluación
        const evaluacionData = {
            tipo: 'riesgo_cardiovascular',
            paciente_id,
            sesion_id: sesion_id || null,
            datos_entrada,
            resultado,
            creado_por: creado_por || req.user.userId,
            version_algoritmo: 'PAHO_v1.0'
        };

        // Guardar evaluación en BD/JSON
        const evaluacion = await evaluacionService.crearEvaluacion(evaluacionData);

        // Generar PDF
        const pdfPath = await pdfService.generarPDFRiesgoCardiovascular(evaluacion);
        
        // Actualizar evaluación con ruta del PDF
        await evaluacionService.actualizarPDFPath(evaluacion.id, pdfPath);

        console.log(`✅ Evaluación creada: ${evaluacion.id} - PDF: ${pdfPath}`);

        res.status(201).json({
            success: true,
            mensaje: 'Evaluación de riesgo cardiovascular creada exitosamente',
            data: {
                evaluacion_id: evaluacion.id,
                resultado: resultado,
                pdf_url: `/api/evaluaciones/${evaluacion.id}/pdf`,
                fecha_creacion: evaluacion.fecha
            }
        });

    } catch (error) {
        console.error('❌ Error al crear evaluación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar evaluación',
            detalle: error.message
        });
    }
});

/**
 * GET /api/evaluaciones/:evaluacionId
 * Obtener detalles de una evaluación específica
 */
router.get('/:evaluacionId', verifyToken, async (req, res) => {
    try {
        const { evaluacionId } = req.params;

        const evaluacion = await evaluacionService.obtenerEvaluacionPorId(evaluacionId);

        if (!evaluacion) {
            return res.status(404).json({
                success: false,
                error: 'Evaluación no encontrada'
            });
        }

        // Verificar permisos (paciente solo ve sus evaluaciones, médico ve todas)
        const esAdmin = req.user.role === 'admin';
        const esMedico = req.user.role === 'medico';
        const esSuPaciente = evaluacion.paciente_id === req.user.pacienteId;

        if (!esAdmin && !esMedico && !esSuPaciente) {
            return res.status(403).json({
                success: false,
                error: 'No tiene permisos para ver esta evaluación'
            });
        }

        res.json({
            success: true,
            data: evaluacion
        });

    } catch (error) {
        console.error('❌ Error al obtener evaluación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener evaluación'
        });
    }
});

/**
 * GET /api/evaluaciones/paciente/:pacienteId
 * Obtener todas las evaluaciones de un paciente (historial)
 * Query params: ?tipo=riesgo_cardiovascular&limit=10&offset=0
 */
router.get('/paciente/:pacienteId', verifyToken, async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const { tipo, limit = 50, offset = 0 } = req.query;

        // Verificar permisos
        const esAdmin = req.user.role === 'admin';
        const esMedico = req.user.role === 'medico';
        const esSuPaciente = pacienteId === req.user.pacienteId;

        if (!esAdmin && !esMedico && !esSuPaciente) {
            return res.status(403).json({
                success: false,
                error: 'No tiene permisos para ver las evaluaciones de este paciente'
            });
        }

        const evaluaciones = await evaluacionService.obtenerEvaluacionesPorPaciente(
            pacienteId,
            tipo,
            parseInt(limit),
            parseInt(offset)
        );

        res.json({
            success: true,
            data: {
                paciente_id: pacienteId,
                total: evaluaciones.length,
                evaluaciones: evaluaciones
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener evaluaciones del paciente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener evaluaciones'
        });
    }
});

/**
 * GET /api/evaluaciones/:evaluacionId/pdf
 * Descargar PDF de una evaluación
 */
router.get('/:evaluacionId/pdf', verifyToken, async (req, res) => {
    try {
        const { evaluacionId } = req.params;

        const evaluacion = await evaluacionService.obtenerEvaluacionPorId(evaluacionId);

        if (!evaluacion) {
            return res.status(404).json({
                success: false,
                error: 'Evaluación no encontrada'
            });
        }

        // Verificar permisos
        const esAdmin = req.user.role === 'admin';
        const esMedico = req.user.role === 'medico';
        const esSuPaciente = evaluacion.paciente_id === req.user.pacienteId;

        if (!esAdmin && !esMedico && !esSuPaciente) {
            return res.status(403).json({
                success: false,
                error: 'No tiene permisos para descargar este PDF'
            });
        }

        if (!evaluacion.pdf_path) {
            return res.status(404).json({
                success: false,
                error: 'PDF no disponible para esta evaluación'
            });
        }

        // Enviar archivo PDF
        const path = require('path');
        const fs = require('fs');
        const pdfFullPath = path.join(__dirname, '..', evaluacion.pdf_path);

        if (!fs.existsSync(pdfFullPath)) {
            return res.status(404).json({
                success: false,
                error: 'Archivo PDF no encontrado en el servidor'
            });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="evaluacion_${evaluacionId}.pdf"`);
        res.sendFile(pdfFullPath);

    } catch (error) {
        console.error('❌ Error al descargar PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Error al descargar PDF'
        });
    }
});

/**
 * GET /api/evaluaciones/tipos/disponibles
 * Obtener tipos de evaluaciones disponibles en el sistema
 */
router.get('/tipos/disponibles', verifyToken, (req, res) => {
    res.json({
        success: true,
        data: {
            tipos: [
                {
                    id: 'riesgo_cardiovascular',
                    nombre: 'Evaluación de Riesgo Cardiovascular',
                    algoritmo: 'PAHO',
                    version: '1.0',
                    disponible: true
                },
                {
                    id: 'hads',
                    nombre: 'Escala HADS (Ansiedad y Depresión)',
                    algoritmo: 'HADS_Hospital_Anxiety_Depression_Scale',
                    version: '1.0',
                    disponible: false // Sprint 3
                }
            ]
        }
    });
});

/**
 * Función auxiliar: Calcular riesgo cardiovascular usando algoritmo PAHO
 * (Extraída del frontend para reutilización en backend)
 */
function calcularRiesgoCardiovascular(datos) {
    // Si hay enfermedad cardiovascular o renal: riesgo ALTO automáticamente
    if (datos.cardiovascular || datos.renal) {
        return {
            puntos: null,
            porcentaje: '>20%',
            categoria: 'ALTO',
            descripcion: 'Riesgo alto por enfermedad cardiovascular o renal preexistente',
            recomendaciones: [
                'Requiere seguimiento médico estrecho',
                'Control estricto de todos los factores de riesgo',
                'Considerar evaluación por cardiología',
                'Adherencia estricta al tratamiento farmacológico'
            ]
        };
    }

    let puntos = 0;

    // Puntos por edad
    if (datos.edad >= 70) puntos += 8;
    else if (datos.edad >= 60) puntos += 6;
    else if (datos.edad >= 50) puntos += 3;
    else if (datos.edad >= 40) puntos += 1;

    // Puntos por fumador
    if (datos.fumador) puntos += 2;

    // Puntos por diabetes
    if (datos.diabetes) puntos += 2;

    // Puntos por presión arterial sistólica
    const sistolica = typeof datos.sistolica === 'object' ? datos.sistolica.valor : datos.sistolica;
    if (sistolica >= 160) puntos += 3;
    else if (sistolica >= 140) puntos += 2;
    else if (sistolica >= 130) puntos += 1;

    // Puntos por colesterol o IMC
    if (datos.conoceColesterol && datos.colesterolTotal) {
        const colesterol = typeof datos.colesterolTotal === 'object' ? datos.colesterolTotal.valor : datos.colesterolTotal;
        if (colesterol >= 280) puntos += 3;
        else if (colesterol >= 240) puntos += 2;
        else if (colesterol >= 200) puntos += 1;
    } else if (datos.peso && datos.talla) {
        const peso = typeof datos.peso === 'object' ? datos.peso.valor : datos.peso;
        const talla = typeof datos.talla === 'object' ? datos.talla.valor : datos.talla;
        const imc = peso / Math.pow(talla / 100, 2);
        if (imc >= 30) puntos += 3;
        else if (imc >= 25) puntos += 2;
        else if (imc >= 23) puntos += 1;
    }

    // Determinar porcentaje y categoría según sexo
    let porcentaje, categoria;
    
    if (datos.sexo === 'masculino') {
        if (puntos < 7) {
            porcentaje = '1%';
            categoria = 'BAJO';
        } else if (puntos < 10) {
            porcentaje = '2%';
            categoria = 'BAJO';
        } else if (puntos < 13) {
            porcentaje = '5%';
            categoria = 'MODERADO';
        } else if (puntos < 18) {
            porcentaje = '10%';
            categoria = 'MODERADO';
        } else {
            porcentaje = '20%';
            categoria = 'ALTO';
        }
    } else { // femenino
        if (puntos < 9) {
            porcentaje = '1%';
            categoria = 'BAJO';
        } else if (puntos < 13) {
            porcentaje = '2%';
            categoria = 'BAJO';
        } else if (puntos < 15) {
            porcentaje = '5%';
            categoria = 'MODERADO';
        } else if (puntos < 18) {
            porcentaje = '10%';
            categoria = 'MODERADO';
        } else {
            porcentaje = '20%';
            categoria = 'ALTO';
        }
    }

    // Generar recomendaciones personalizadas
    const recomendaciones = generarRecomendaciones(datos, categoria);

    return {
        puntos: puntos,
        porcentaje: porcentaje,
        categoria: categoria,
        descripcion: `Riesgo de evento cardiovascular a 10 años: ${porcentaje}`,
        recomendaciones: recomendaciones
    };
}

/**
 * Generar recomendaciones personalizadas según factores de riesgo
 */
function generarRecomendaciones(datos, categoria) {
    const recomendaciones = [];

    // Recomendaciones generales por categoría
    if (categoria === 'BAJO') {
        recomendaciones.push('Mantener estilo de vida saludable');
        recomendaciones.push('Continuar con controles médicos anuales');
    } else if (categoria === 'MODERADO') {
        recomendaciones.push('Control médico cada 6 meses');
        recomendaciones.push('Monitoreo regular de presión arterial y colesterol');
    } else { // ALTO
        recomendaciones.push('Requiere seguimiento médico estrecho');
        recomendaciones.push('Considerar derivación a cardiología');
    }

    // Recomendaciones específicas
    if (datos.fumador) {
        recomendaciones.push('IMPORTANTE: Cesación del tabaquismo (reduce riesgo en 50%)');
    }

    const sistolica = typeof datos.sistolica === 'object' ? datos.sistolica.valor : datos.sistolica;
    if (sistolica >= 140) {
        recomendaciones.push('Control de hipertensión arterial - considerar medicación');
    } else if (sistolica >= 130) {
        recomendaciones.push('Monitorear presión arterial - modificar estilo de vida');
    }

    if (datos.diabetes) {
        recomendaciones.push('Control estricto de glicemia (HbA1c < 7%)');
    }

    if (datos.peso && datos.talla) {
        const peso = typeof datos.peso === 'object' ? datos.peso.valor : datos.peso;
        const talla = typeof datos.talla === 'object' ? datos.talla.valor : datos.talla;
        const imc = peso / Math.pow(talla / 100, 2);
        if (imc >= 30) {
            recomendaciones.push('Reducción de peso > 10% (obesidad)');
        } else if (imc >= 25) {
            recomendaciones.push('Reducción de peso 5-10% (sobrepeso)');
        }
    }

    // Recomendaciones universales
    recomendaciones.push('Actividad física: mínimo 150 min/semana');
    recomendaciones.push('Dieta: reducir sal, grasas saturadas y azúcares');

    return recomendaciones;
}

module.exports = router;
