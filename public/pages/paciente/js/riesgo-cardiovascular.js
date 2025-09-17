/**
 * Calculadora de Riesgo Cardiovascular
 * Implementa algoritmos de PAHO, AHA, OMS y ADA
 * SoyBienmedico - 2025
 */

// Variables globales para los resultados
let resultados = {};

/**
 * Función principal para calcular riesgo cardiovascular
 */
function calcularRiesgoCardiovascular() {
    try {
        // Obtener datos del formulario
        const datos = obtenerDatosFormulario();
        
        // Validar datos requeridos
        if (!validarDatos(datos)) {
            return;
        }

        // Calcular todos los indicadores
        resultados = {
            riesgoCardiovascular: calcularRiesgoPAHO(datos),
            presionArterial: clasificarPresionArterial(datos.sistolica, datos.diastolica),
            imc: datos.peso && datos.talla ? calcularIMC(datos.peso, datos.talla) : null,
            hba1c: datos.hba1c ? clasificarHbA1c(datos.hba1c) : null
        };

        // Mostrar resultados
        mostrarResultados(resultados, datos);
        
        // Scroll a resultados
        document.getElementById('resultados').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error en cálculo:', error);
        alert('Ocurrió un error al calcular el riesgo. Por favor, revise los datos ingresados.');
    }
}

/**
 * Obtener datos del formulario
 */
function obtenerDatosFormulario() {
    return {
        edad: parseInt(document.getElementById('edad').value),
        sexo: document.querySelector('input[name="sexo"]:checked')?.value,
        fumador: document.querySelector('input[name="fumador"]:checked')?.value === 'si',
        diabetes: document.getElementById('diabetes').checked,
        cardiovascular: document.getElementById('cardiovascular').checked,
        renal: document.getElementById('renal').checked,
        hipertension: document.getElementById('hipertension').checked,
        sistolica: parseInt(document.getElementById('sistolica').value),
        diastolica: parseInt(document.getElementById('diastolica').value),
        frecuencia: document.getElementById('frecuencia').value ? parseInt(document.getElementById('frecuencia').value) : null,
        conoceColesterol: document.getElementById('conoceColesterol').checked,
        colesterolTotal: document.getElementById('colesterolTotal').value ? parseInt(document.getElementById('colesterolTotal').value) : null,
        ldl: document.getElementById('ldl').value ? parseInt(document.getElementById('ldl').value) : null,
        hdl: document.getElementById('hdl').value ? parseInt(document.getElementById('hdl').value) : null,
        peso: document.getElementById('peso').value ? parseFloat(document.getElementById('peso').value) : null,
        talla: document.getElementById('talla').value ? parseInt(document.getElementById('talla').value) : null,
        hba1c: document.getElementById('hba1c').value ? parseFloat(document.getElementById('hba1c').value) : null
    };
}

/**
 * Validar datos mínimos requeridos
 */
function validarDatos(datos) {
    const errores = [];

    if (!datos.edad || datos.edad < 18 || datos.edad > 120) {
        errores.push('Edad debe estar entre 18 y 120 años');
    }

    if (!datos.sexo) {
        errores.push('Debe seleccionar el sexo');
    }

    if (!datos.sistolica || datos.sistolica < 80 || datos.sistolica > 250) {
        errores.push('Presión sistólica debe estar entre 80 y 250 mmHg');
    }

    if (!datos.diastolica || datos.diastolica < 40 || datos.diastolica > 150) {
        errores.push('Presión diastólica debe estar entre 40 y 150 mmHg');
    }

    if (document.querySelector('input[name="fumador"]:checked') === null) {
        errores.push('Debe indicar si es fumador o no');
    }

    if (errores.length > 0) {
        alert('Errores en el formulario:\n\n' + errores.join('\n'));
        return false;
    }

    return true;
}

/**
 * Algoritmo PAHO para cálculo de riesgo cardiovascular
 */
function calcularRiesgoPAHO(datos) {
    // Si hay enfermedad cardiovascular o renal: riesgo ALTO automáticamente
    if (datos.cardiovascular || datos.renal) {
        return {
            puntos: null,
            porcentaje: '>20%',
            categoria: 'ALTO',
            descripcion: 'Riesgo alto por enfermedad cardiovascular o renal preexistente'
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
    if (datos.sistolica >= 160) puntos += 3;
    else if (datos.sistolica >= 140) puntos += 2;
    else if (datos.sistolica >= 130) puntos += 1;

    // Puntos por colesterol o IMC
    if (datos.conoceColesterol && datos.colesterolTotal) {
        if (datos.colesterolTotal >= 280) puntos += 3;
        else if (datos.colesterolTotal >= 240) puntos += 2;
        else if (datos.colesterolTotal >= 200) puntos += 1;
    } else if (datos.peso && datos.talla) {
        const imc = datos.peso / Math.pow(datos.talla / 100, 2);
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

    return {
        puntos: puntos,
        porcentaje: porcentaje,
        categoria: categoria,
        descripcion: `Riesgo de evento cardiovascular a 10 años: ${porcentaje}`
    };
}

/**
 * Clasificación de Presión Arterial según AHA
 */
function clasificarPresionArterial(sistolica, diastolica) {
    let categoria, descripcion, clase;

    if (sistolica >= 180 || diastolica >= 120) {
        categoria = 'Crisis Hipertensiva';
        descripcion = 'Requiere atención médica inmediata';
        clase = 'crisis';
    } else if (sistolica >= 140 || diastolica >= 90) {
        categoria = 'Hipertensión Grado 2';
        descripcion = 'Presión arterial alta - requiere tratamiento médico';
        clase = 'alto';
    } else if (sistolica >= 130 || diastolica >= 80) {
        categoria = 'Hipertensión Grado 1';
        descripcion = 'Presión arterial alta - consulte con su médico';
        clase = 'moderado';
    } else if (sistolica >= 120 && diastolica < 80) {
        categoria = 'Presión Elevada';
        descripcion = 'Presión arterial elevada - monitoreo recomendado';
        clase = 'elevado';
    } else {
        categoria = 'Normal';
        descripcion = 'Presión arterial normal';
        clase = 'normal';
    }

    return {
        categoria: categoria,
        descripcion: descripcion,
        valores: `${sistolica}/${diastolica} mmHg`,
        clase: clase
    };
}

/**
 * Calcular y clasificar IMC según OMS
 */
function calcularIMC(peso, talla) {
    const imc = peso / Math.pow(talla / 100, 2);
    let categoria, descripcion, clase;

    if (imc < 18.5) {
        categoria = 'Bajo peso';
        descripcion = 'Peso por debajo del normal';
        clase = 'bajo';
    } else if (imc < 25) {
        categoria = 'Normal';
        descripcion = 'Peso normal';
        clase = 'normal';
    } else if (imc < 30) {
        categoria = 'Sobrepeso';
        descripcion = 'Peso por encima del normal';
        clase = 'elevado';
    } else if (imc < 35) {
        categoria = 'Obesidad Grado I';
        descripcion = 'Obesidad leve';
        clase = 'moderado';
    } else if (imc < 40) {
        categoria = 'Obesidad Grado II';
        descripcion = 'Obesidad moderada';
        clase = 'alto';
    } else {
        categoria = 'Obesidad Grado III';
        descripcion = 'Obesidad severa';
        clase = 'crisis';
    }

    return {
        valor: imc.toFixed(1),
        categoria: categoria,
        descripcion: descripcion,
        clase: clase
    };
}

/**
 * Clasificar HbA1c según ADA
 */
function clasificarHbA1c(hba1c) {
    let categoria, descripcion, clase;

    if (hba1c >= 6.5) {
        categoria = 'Diabetes';
        descripcion = 'Indica diabetes mellitus';
        clase = 'alto';
    } else if (hba1c >= 5.7) {
        categoria = 'Prediabetes';
        descripcion = 'Riesgo aumentado de diabetes';
        clase = 'moderado';
    } else {
        categoria = 'Normal';
        descripcion = 'Nivel normal de glucosa';
        clase = 'normal';
    }

    return {
        valor: hba1c + '%',
        categoria: categoria,
        descripcion: descripcion,
        clase: clase
    };
}

/**
 * Mostrar todos los resultados en la interfaz
 */
function mostrarResultados(resultados, datos) {
    // Mostrar sección de resultados
    document.getElementById('resultados').style.display = 'block';

    // Resultado principal - Riesgo Cardiovascular
    const riesgoDiv = document.getElementById('riesgoCardiovascular');
    const riesgo = resultados.riesgoCardiovascular;
    let claseRiesgo = '';

    switch (riesgo.categoria) {
        case 'BAJO':
            claseRiesgo = 'risk-low';
            break;
        case 'MODERADO':
            claseRiesgo = 'risk-moderate';
            break;
        case 'ALTO':
            claseRiesgo = 'risk-high';
            break;
    }

    riesgoDiv.className = `result-card ${claseRiesgo}`;
    riesgoDiv.innerHTML = `
        <div class="result-title">Riesgo Cardiovascular</div>
        <div class="result-value">${riesgo.categoria}</div>
        <div>${riesgo.descripcion}</div>
        ${riesgo.puntos !== null ? `<div style="margin-top: 0.5rem; font-size: 0.9rem;">Puntuación PAHO: ${riesgo.puntos} puntos</div>` : ''}
    `;

    // Otros resultados
    const otrosDiv = document.getElementById('otrosResultados');
    let otrosHTML = '';

    // Presión Arterial
    const pa = resultados.presionArterial;
    otrosHTML += `
        <div class="result-card" style="background: #ecf0f1; color: #2c3e50; text-align: left;">
            <h4><i class="fas fa-tachometer-alt"></i> Presión Arterial</h4>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${pa.valores}</strong><br>
                    <span style="color: #7f8c8d;">${pa.categoria}</span>
                </div>
                <div style="text-align: right; font-size: 0.9rem;">
                    ${pa.descripcion}
                </div>
            </div>
        </div>
    `;

    // IMC
    if (resultados.imc) {
        const imc = resultados.imc;
        otrosHTML += `
            <div class="result-card" style="background: #ecf0f1; color: #2c3e50; text-align: left;">
                <h4><i class="fas fa-weight"></i> Índice de Masa Corporal</h4>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${imc.valor} kg/m²</strong><br>
                        <span style="color: #7f8c8d;">${imc.categoria}</span>
                    </div>
                    <div style="text-align: right; font-size: 0.9rem;">
                        ${imc.descripcion}
                    </div>
                </div>
            </div>
        `;
    }

    // HbA1c
    if (resultados.hba1c) {
        const hba1c = resultados.hba1c;
        otrosHTML += `
            <div class="result-card" style="background: #ecf0f1; color: #2c3e50; text-align: left;">
                <h4><i class="fas fa-vial"></i> Hemoglobina Glicosilada</h4>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${hba1c.valor}</strong><br>
                        <span style="color: #7f8c8d;">${hba1c.categoria}</span>
                    </div>
                    <div style="text-align: right; font-size: 0.9rem;">
                        ${hba1c.descripcion}
                    </div>
                </div>
            </div>
        `;
    }

    otrosDiv.innerHTML = otrosHTML;

    // Generar recomendaciones
    generarRecomendaciones(resultados, datos);
}

/**
 * Generar recomendaciones personalizadas
 */
function generarRecomendaciones(resultados, datos) {
    const recomendacionesUl = document.getElementById('recomendaciones');
    const recomendaciones = [];

    // Recomendaciones basadas en riesgo cardiovascular
    switch (resultados.riesgoCardiovascular.categoria) {
        case 'ALTO':
            recomendaciones.push({
                icono: 'fas fa-exclamation-triangle',
                texto: 'Consulte con su médico cardiovascular lo antes posible'
            });
            recomendaciones.push({
                icono: 'fas fa-pills',
                texto: 'Es probable que necesite medicación para control cardiovascular'
            });
            break;
        case 'MODERADO':
            recomendaciones.push({
                icono: 'fas fa-calendar-check',
                texto: 'Programe una consulta médica en las próximas semanas'
            });
            recomendaciones.push({
                icono: 'fas fa-chart-line',
                texto: 'Monitoree regularmente su presión arterial y colesterol'
            });
            break;
        case 'BAJO':
            recomendaciones.push({
                icono: 'fas fa-thumbs-up',
                texto: 'Mantenga sus hábitos saludables actuales'
            });
            recomendaciones.push({
                icono: 'fas fa-calendar',
                texto: 'Revisiones médicas anuales son suficientes'
            });
            break;
    }

    // Recomendaciones específicas
    if (datos.fumador) {
        recomendaciones.push({
            icono: 'fas fa-smoking-ban',
            texto: 'Deje de fumar - es el factor de riesgo más importante que puede controlar'
        });
    }

    if (resultados.presionArterial.clase === 'alto' || resultados.presionArterial.clase === 'crisis') {
        recomendaciones.push({
            icono: 'fas fa-tachometer-alt',
            texto: 'Controle su presión arterial diariamente y reduzca el consumo de sal'
        });
    }

    if (resultados.imc && (resultados.imc.clase === 'moderado' || resultados.imc.clase === 'alto')) {
        recomendaciones.push({
            icono: 'fas fa-running',
            texto: 'Inicie un programa de ejercicio regular y dieta balanceada'
        });
    }

    if (datos.diabetes || (resultados.hba1c && resultados.hba1c.clase === 'alto')) {
        recomendaciones.push({
            icono: 'fas fa-apple-alt',
            texto: 'Mantenga control estricto de glucosa y siga dieta para diabéticos'
        });
    }

    // Recomendaciones generales
    recomendaciones.push({
        icono: 'fas fa-heart',
        texto: 'Consuma una dieta rica en frutas, verduras y pescado'
    });
    recomendaciones.push({
        icono: 'fas fa-dumbbell',
        texto: 'Realice al menos 150 minutos de ejercicio moderado por semana'
    });
    recomendaciones.push({
        icono: 'fas fa-bed',
        texto: 'Mantenga un patrón de sueño regular (7-8 horas por noche)'
    });

    // Generar HTML de recomendaciones
    recomendacionesUl.innerHTML = recomendaciones.map(rec => `
        <li>
            <i class="${rec.icono}" style="color: #e74c3c; width: 20px;"></i>
            ${rec.texto}
        </li>
    `).join('');
}