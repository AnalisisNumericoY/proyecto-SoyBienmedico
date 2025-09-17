/**
 * Calculadora HADS + Burnout Laboral
 * Implementa escalas HADS-Ansiedad, HADS-Depresión y CBI-Burnout
 * SoyBienmedico - 2025
 */

// Variables globales para los resultados
let resultadosHADS = {};

/**
 * Función principal para calcular resultados HADS + Burnout
 */
function calcularResultadosHADS() {
    try {
        // Obtener datos del formulario
        const datos = obtenerDatosFormularioHADS();
        
        // Validar que todas las preguntas estén respondidas
        if (!validarDatosCompletos(datos)) {
            return;
        }

        // Calcular puntuaciones
        resultadosHADS = {
            ansiedad: calcularPuntuacionAnsiedad(datos.ansiedad),
            depresion: calcularPuntuacionDepresion(datos.depresion),
            burnout: calcularPuntuacionBurnout(datos.burnout)
        };

        // Mostrar resultados
        mostrarResultadosHADS(resultadosHADS);
        
        // Scroll a resultados
        document.getElementById('resultados').style.display = 'block';
        document.getElementById('resultados').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error en cálculo HADS:', error);
        alert('Ocurrió un error al calcular los resultados. Por favor, revise que todas las preguntas estén respondidas.');
    }
}

/**
 * Obtener datos del formulario
 */
function obtenerDatosFormularioHADS() {
    const datos = {
        ansiedad: [],
        depresion: [],
        burnout: []
    };

    // Obtener respuestas de ansiedad (7 preguntas)
    for (let i = 1; i <= 7; i++) {
        const respuesta = document.querySelector(`input[name="ansiedad${i}"]:checked`);
        datos.ansiedad.push(respuesta ? parseInt(respuesta.value) : null);
    }

    // Obtener respuestas de depresión (7 preguntas)
    for (let i = 1; i <= 7; i++) {
        const respuesta = document.querySelector(`input[name="depresion${i}"]:checked`);
        datos.depresion.push(respuesta ? parseInt(respuesta.value) : null);
    }

    // Obtener respuestas de burnout (7 preguntas)
    for (let i = 1; i <= 7; i++) {
        const respuesta = document.querySelector(`input[name="burnout${i}"]:checked`);
        datos.burnout.push(respuesta ? parseInt(respuesta.value) : null);
    }

    return datos;
}

/**
 * Validar que todas las preguntas estén respondidas
 */
function validarDatosCompletos(datos) {
    // Verificar ansiedad
    for (let i = 0; i < 7; i++) {
        if (datos.ansiedad[i] === null) {
            alert(`Por favor responda la pregunta ${i + 1} de la escala de Ansiedad.`);
            return false;
        }
    }

    // Verificar depresión
    for (let i = 0; i < 7; i++) {
        if (datos.depresion[i] === null) {
            alert(`Por favor responda la pregunta ${i + 1} de la escala de Depresión.`);
            return false;
        }
    }

    // Verificar burnout
    for (let i = 0; i < 7; i++) {
        if (datos.burnout[i] === null) {
            alert(`Por favor responda la pregunta ${i + 1} de la escala de Burnout.`);
            return false;
        }
    }

    return true;
}

/**
 * Calcular puntuación y categoría de Ansiedad HADS
 */
function calcularPuntuacionAnsiedad(respuestas) {
    const puntuacion = respuestas.reduce((suma, valor) => suma + valor, 0);
    
    let categoria, descripcion, clase;

    if (puntuacion >= 15) {
        categoria = 'GRAVE';
        descripcion = 'Ansiedad severa - Se recomienda atención especializada urgente';
        clase = 'grave';
    } else if (puntuacion >= 11) {
        categoria = 'MODERADO';
        descripcion = 'Ansiedad moderada - Se recomienda consulta con especialista';
        clase = 'moderado';
    } else if (puntuacion >= 8) {
        categoria = 'LEVE';
        descripcion = 'Ansiedad leve - Monitoreo y técnicas de relajación recomendadas';
        clase = 'leve';
    } else {
        categoria = 'NORMAL';
        descripcion = 'Nivel normal de ansiedad';
        clase = 'normal';
    }

    return {
        puntuacion: puntuacion,
        maxPuntuacion: 21,
        categoria: categoria,
        descripcion: descripcion,
        clase: clase,
        porcentaje: Math.round((puntuacion / 21) * 100)
    };
}

/**
 * Calcular puntuación y categoría de Depresión HADS
 */
function calcularPuntuacionDepresion(respuestas) {
    const puntuacion = respuestas.reduce((suma, valor) => suma + valor, 0);
    
    let categoria, descripcion, clase;

    if (puntuacion >= 15) {
        categoria = 'GRAVE';
        descripcion = 'Depresión severa - Se recomienda atención especializada urgente';
        clase = 'grave';
    } else if (puntuacion >= 11) {
        categoria = 'MODERADO';
        descripcion = 'Depresión moderada - Se recomienda consulta con especialista';
        clase = 'moderado';
    } else if (puntuacion >= 8) {
        categoria = 'LEVE';
        descripcion = 'Depresión leve - Actividades de bienestar y seguimiento recomendados';
        clase = 'leve';
    } else {
        categoria = 'NORMAL';
        descripcion = 'Nivel normal del estado de ánimo';
        clase = 'normal';
    }

    return {
        puntuacion: puntuacion,
        maxPuntuacion: 21,
        categoria: categoria,
        descripcion: descripcion,
        clase: clase,
        porcentaje: Math.round((puntuacion / 21) * 100)
    };
}

/**
 * Calcular puntuación y categoría de Burnout CBI
 */
function calcularPuntuacionBurnout(respuestas) {
    const suma = respuestas.reduce((suma, valor) => suma + valor, 0);
    const promedio = suma / 7; // CBI usa el promedio de las 7 respuestas
    
    let categoria, descripcion, clase;

    if (promedio >= 3.0) {
        categoria = 'ALTO';
        descripcion = 'Alto nivel de burnout - Requiere intervención inmediata';
        clase = 'grave';
    } else if (promedio >= 1.5) {
        categoria = 'MEDIO';
        descripcion = 'Nivel medio de burnout - Se recomienda implementar estrategias de manejo';
        clase = 'moderado';
    } else {
        categoria = 'BAJO';
        descripcion = 'Bajo nivel de burnout - Mantener estrategias de bienestar actuales';
        clase = 'normal';
    }

    return {
        puntuacion: promedio,
        maxPuntuacion: 4.0,
        categoria: categoria,
        descripcion: descripcion,
        clase: clase,
        porcentaje: Math.round((promedio / 4.0) * 100),
        puntuacionFormateada: promedio.toFixed(2)
    };
}

/**
 * Mostrar todos los resultados en la interfaz
 */
function mostrarResultadosHADS(resultados) {
    const resultsGrid = document.getElementById('resultsGrid');
    
    // Limpiar resultados anteriores
    resultsGrid.innerHTML = '';

    // Crear tarjetas de resultados
    const ansiedadCard = crearTarjetaResultado(
        'Ansiedad',
        'fas fa-exclamation-triangle',
        resultados.ansiedad
    );

    const depresionCard = crearTarjetaResultado(
        'Depresión',
        'fas fa-cloud-rain',
        resultados.depresion
    );

    const burnoutCard = crearTarjetaResultado(
        'Burnout Laboral',
        'fas fa-fire',
        resultados.burnout,
        true // Indica que es burnout (usa promedio)
    );

    // Agregar tarjetas al grid
    resultsGrid.appendChild(ansiedadCard);
    resultsGrid.appendChild(depresionCard);
    resultsGrid.appendChild(burnoutCard);

    // Generar recomendaciones
    generarRecomendacionesHADS(resultados);
}

/**
 * Crear tarjeta de resultado individual
 */
function crearTarjetaResultado(titulo, icono, resultado, esBurnout = false) {
    const card = document.createElement('div');
    card.className = `result-card result-${resultado.clase}`;
    
    const valorMostrar = esBurnout ? resultado.puntuacionFormateada : resultado.puntuacion;
    const maxValor = esBurnout ? '4.0' : resultado.maxPuntuacion;
    
    card.innerHTML = `
        <div class="result-title">
            <i class="${icono}"></i> ${titulo}
        </div>
        <div class="result-value">${valorMostrar}${esBurnout ? '' : '/' + maxValor}</div>
        <div class="result-category">${resultado.categoria}</div>
        <div class="result-description">${resultado.descripcion}</div>
        <div style="margin-top: 1rem; font-size: 0.9rem;">
            ${esBurnout ? 'Promedio: ' + resultado.puntuacionFormateada : 'Puntuación: ' + resultado.puntuacion + '/' + maxValor}
        </div>
    `;
    
    return card;
}

/**
 * Generar recomendaciones personalizadas basadas en los resultados
 */
function generarRecomendacionesHADS(resultados) {
    const recommendationsGrid = document.getElementById('recommendationsGrid');
    recommendationsGrid.innerHTML = '';

    // Recomendaciones para Ansiedad
    const ansiedadRecomendaciones = obtenerRecomendacionesAnsiedad(resultados.ansiedad);
    const ansiedadCard = crearCategoriaRecomendacion('Manejo de la Ansiedad', 'fas fa-heart', ansiedadRecomendaciones);
    recommendationsGrid.appendChild(ansiedadCard);

    // Recomendaciones para Depresión
    const depresionRecomendaciones = obtenerRecomendacionesDepresion(resultados.depresion);
    const depresionCard = crearCategoriaRecomendacion('Bienestar Emocional', 'fas fa-smile', depresionRecomendaciones);
    recommendationsGrid.appendChild(depresionCard);

    // Recomendaciones para Burnout
    const burnoutRecomendaciones = obtenerRecomendacionesBurnout(resultados.burnout);
    const burnoutCard = crearCategoriaRecomendacion('Equilibrio Laboral', 'fas fa-balance-scale', burnoutRecomendaciones);
    recommendationsGrid.appendChild(burnoutCard);
}

/**
 * Obtener recomendaciones específicas para ansiedad
 */
function obtenerRecomendacionesAnsiedad(ansiedad) {
    const recomendaciones = [];

    switch (ansiedad.clase) {
        case 'grave':
            recomendaciones.push('Busque atención psicológica o psiquiátrica inmediatamente');
            recomendaciones.push('Considere terapia cognitivo-conductual especializada');
            recomendaciones.push('Evite la cafeína y otras sustancias estimulantes');
            recomendaciones.push('Informe a familiares cercanos sobre su situación');
            break;
        case 'moderado':
            recomendaciones.push('Programe una consulta con un psicólogo clínico');
            recomendaciones.push('Practique técnicas de respiración profunda diariamente');
            recomendaciones.push('Considere ejercicio regular como caminatas o yoga');
            recomendaciones.push('Limite la exposición a noticias estresantes');
            break;
        case 'leve':
            recomendaciones.push('Implemente técnicas de relajación y mindfulness');
            recomendaciones.push('Mantenga horarios regulares de sueño');
            recomendaciones.push('Practique ejercicio físico 3-4 veces por semana');
            recomendaciones.push('Considere técnicas de meditación guiada');
            break;
        default:
            recomendaciones.push('Mantenga sus estrategias actuales de manejo del estrés');
            recomendaciones.push('Continue con actividades que le brinden bienestar');
            recomendaciones.push('Practique autocuidado preventivo regularmente');
            break;
    }

    return recomendaciones;
}

/**
 * Obtener recomendaciones específicas para depresión
 */
function obtenerRecomendacionesDepresion(depresion) {
    const recomendaciones = [];

    switch (depresion.clase) {
        case 'grave':
            recomendaciones.push('Busque atención especializada en salud mental urgentemente');
            recomendaciones.push('Considere evaluación para tratamiento farmacológico');
            recomendaciones.push('Mantenga contacto estrecho con red de apoyo');
            recomendaciones.push('Evite tomar decisiones importantes mientras se estabiliza');
            break;
        case 'moderado':
            recomendaciones.push('Consulte con un profesional en salud mental');
            recomendaciones.push('Incorpore actividades placenteras en su rutina diaria');
            recomendaciones.push('Mantenga conexiones sociales y evite el aislamiento');
            recomendaciones.push('Establezca metas pequeñas y alcanzables');
            break;
        case 'leve':
            recomendaciones.push('Incremente actividades que antes disfrutaba');
            recomendaciones.push('Mantenga rutinas estructuradas diarias');
            recomendaciones.push('Busque apoyo social y actividades grupales');
            recomendaciones.push('Considere terapia psicológica preventiva');
            break;
        default:
            recomendaciones.push('Continue cultivando relaciones sociales positivas');
            recomendaciones.push('Mantenga actividades que le generen satisfacción');
            recomendaciones.push('Practique gratitud y actividades de bienestar');
            break;
    }

    return recomendaciones;
}

/**
 * Obtener recomendaciones específicas para burnout
 */
function obtenerRecomendacionesBurnout(burnout) {
    const recomendaciones = [];

    switch (burnout.clase) {
        case 'grave':
            recomendaciones.push('Considere tomar licencia médica o tiempo de descanso');
            recomendaciones.push('Busque apoyo de recursos humanos o superiores');
            recomendaciones.push('Evalúe cambios significativos en su entorno laboral');
            recomendaciones.push('Consulte con especialista en medicina ocupacional');
            break;
        case 'moderado':
            recomendaciones.push('Establezca límites claros entre trabajo y vida personal');
            recomendaciones.push('Delegue responsabilidades cuando sea posible');
            recomendaciones.push('Tome descansos regulares durante la jornada laboral');
            recomendaciones.push('Comunique su situación con su supervisor directo');
            break;
        default:
            recomendaciones.push('Mantenga equilibrio entre trabajo y descanso');
            recomendaciones.push('Continue con estrategias actuales de manejo del estrés');
            recomendaciones.push('Practique actividades de desconexión laboral');
            break;
    }

    return recomendaciones;
}

/**
 * Crear categoría de recomendación
 */
function crearCategoriaRecomendacion(titulo, icono, recomendaciones) {
    const card = document.createElement('div');
    card.className = 'recommendation-category';
    
    const lista = recomendaciones.map(rec => `
        <li>
            <i class="fas fa-check-circle" style="color: #27ae60;"></i>
            ${rec}
        </li>
    `).join('');
    
    card.innerHTML = `
        <h5><i class="${icono}"></i> ${titulo}</h5>
        <ul class="recommendation-list">
            ${lista}
        </ul>
    `;
    
    return card;
}