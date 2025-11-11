/**
 * Dashboard de Monitoreo en Tiempo Real - SoyBienmedico
 * Sistema de visualización IoT para dispositivos médicos
 */

let intervalId = null;
let chart = null;
let ultimasMediciones = [];

/**
 * Iniciar el monitoreo en tiempo real
 */
function iniciarMonitoreo() {
    console.log('🚀 Iniciando monitoreo en tiempo real...');
    
    // Cargar datos inmediatamente
    cargarMediciones();
    
    // Configurar actualización automática cada 3 segundos
    intervalId = setInterval(cargarMediciones, 3000);
    
    // Limpiar intervalo cuando se cierre la página
    window.addEventListener('beforeunload', () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    });
}

/**
 * Cargar mediciones desde el servidor
 */
async function cargarMediciones() {
    try {
        const response = await fetch('/api/mediciones/recientes?limite=50');
        
        if (!response.ok) {
            throw new Error('Error al cargar mediciones');
        }
        
        const data = await response.json();
        
        if (data.success && data.mediciones) {
            procesarMediciones(data.mediciones);
        }
        
    } catch (error) {
        console.error('❌ Error cargando mediciones:', error);
    }
}

/**
 * Procesar y clasificar mediciones por tipo de dispositivo
 */
function procesarMediciones(mediciones) {
    // Separar mediciones por tipo
    const medicionesOximetro = [];
    const medicionesTension = [];
    const medicionesBalanza = [];
    
    mediciones.forEach(medicion => {
        if (!medicion.datos_originales || !medicion.datos_originales.measure) {
            return;
        }
        
        const measures = medicion.datos_originales.measure;
        
        // Detectar tipo de dispositivo por parámetros
        const tieneSpO2 = measures.some(m => m.parameter === 'spo2');
        const tieneSistolica = measures.some(m => m.parameter === 'sistolica');
        const tienePeso = measures.some(m => m.parameter === 'peso');
        
        if (tieneSpO2) {
            medicionesOximetro.push(medicion);
        } else if (tieneSistolica) {
            medicionesTension.push(medicion);
        } else if (tienePeso) {
            medicionesBalanza.push(medicion);
        }
    });
    
    // Actualizar UI de cada dispositivo
    actualizarCardOximetro(medicionesOximetro[0]);
    actualizarCardTension(medicionesTension[0]);
    actualizarCardBalanza(medicionesBalanza[0]);
    
    // Actualizar gráficos
    actualizarGraficos(medicionesOximetro, medicionesTension, medicionesBalanza);
}

/**
 * Actualizar card del Oxímetro
 */
function actualizarCardOximetro(medicion) {
    const card = document.getElementById('cardOximetro');
    const valuesDiv = document.getElementById('valuesOximetro');
    const statusDot = document.getElementById('statusOximetro');
    const statusText = document.getElementById('statusTextOximetro');
    const metaDiv = document.getElementById('metaOximetro');
    
    if (!medicion) {
        statusDot.classList.add('inactive');
        statusText.textContent = 'Sin datos';
        return;
    }
    
    // Animación de nueva data
    card.classList.add('new-data-animation');
    setTimeout(() => card.classList.remove('new-data-animation'), 500);
    
    // Extraer valores
    const measures = medicion.datos_originales.measure;
    const spo2 = measures.find(m => m.parameter === 'spo2')?.value || 0;
    const fc = measures.find(m => m.parameter === 'frecuencia_cardiaca_ox')?.value || 0;
    
    // Determinar estado
    const esNormal = spo2 >= 95 && fc >= 60 && fc <= 100;
    const esAdvertencia = (spo2 >= 90 && spo2 < 95) || fc > 100;
    const esPeligro = spo2 < 90 || fc > 120;
    
    // Actualizar estado visual
    statusDot.classList.remove('inactive');
    statusText.textContent = 'Activo';
    
    // Construir HTML de valores
    let alertClass = 'normal';
    let alertText = 'Normal';
    if (esPeligro) {
        alertClass = 'danger';
        alertText = '¡Alerta!';
    } else if (esAdvertencia) {
        alertClass = 'warning';
        alertText = 'Precaución';
    }
    
    valuesDiv.innerHTML = `
        <div class="value-item">
            <div class="value-number" style="color: ${spo2 < 90 ? '#ef4444' : spo2 < 95 ? '#f59e0b' : '#10b981'}">
                ${spo2}%
            </div>
            <div class="value-label">SpO2</div>
        </div>
        <div class="value-item">
            <div class="value-number" style="color: ${fc > 100 ? '#f59e0b' : '#10b981'}">
                ${fc}
            </div>
            <div class="value-label">BPM</div>
        </div>
        <div class="value-item">
            <span class="alert-badge ${alertClass}">${alertText}</span>
        </div>
    `;
    
    // Actualizar metadata
    metaDiv.style.display = 'flex';
    document.getElementById('serialOximetro').textContent = `Serial: ${medicion.datos_originales.serial.substring(0, 12)}`;
    document.getElementById('timeOximetro').textContent = calcularTiempoTranscurrido(medicion.recibido_en);
}

/**
 * Actualizar card del Tensiómetro
 */
function actualizarCardTension(medicion) {
    const card = document.getElementById('cardTension');
    const valuesDiv = document.getElementById('valuesTension');
    const statusDot = document.getElementById('statusTension');
    const statusText = document.getElementById('statusTextTension');
    const metaDiv = document.getElementById('metaTension');
    
    if (!medicion) {
        statusDot.classList.add('inactive');
        statusText.textContent = 'Sin datos';
        return;
    }
    
    // Animación
    card.classList.add('new-data-animation');
    setTimeout(() => card.classList.remove('new-data-animation'), 500);
    
    // Extraer valores
    const measures = medicion.datos_originales.measure;
    const sistolica = measures.find(m => m.parameter === 'sistolica')?.value || 0;
    const diastolica = measures.find(m => m.parameter === 'diastolica')?.value || 0;
    const fc = measures.find(m => m.parameter === 'frecuencia_cardiaca')?.value || 0;
    
    // Determinar estado (clasificación AHA)
    let alertClass = 'normal';
    let alertText = 'Normal';
    
    if (sistolica >= 180 || diastolica >= 120) {
        alertClass = 'danger';
        alertText = 'Crisis Hipertensiva';
    } else if (sistolica >= 140 || diastolica >= 90) {
        alertClass = 'danger';
        alertText = 'Hipertensión';
    } else if (sistolica >= 130 || diastolica >= 80) {
        alertClass = 'warning';
        alertText = 'Elevada';
    } else if (sistolica < 90 || diastolica < 60) {
        alertClass = 'warning';
        alertText = 'Hipotensión';
    }
    
    // Actualizar estado
    statusDot.classList.remove('inactive');
    statusText.textContent = 'Activo';
    
    valuesDiv.innerHTML = `
        <div class="value-item">
            <div class="value-number" style="color: ${sistolica >= 140 ? '#ef4444' : sistolica >= 130 ? '#f59e0b' : '#10b981'}">
                ${sistolica}
            </div>
            <div class="value-label">Sistólica</div>
        </div>
        <div class="value-item">
            <div class="value-number" style="color: ${diastolica >= 90 ? '#ef4444' : diastolica >= 80 ? '#f59e0b' : '#10b981'}">
                ${diastolica}
            </div>
            <div class="value-label">Diastólica</div>
        </div>
        <div class="value-item">
            <div class="value-number">
                ${fc}
            </div>
            <div class="value-label">BPM</div>
        </div>
        <div class="value-item">
            <span class="alert-badge ${alertClass}">${alertText}</span>
        </div>
    `;
    
    // Metadata
    metaDiv.style.display = 'flex';
    document.getElementById('serialTension').textContent = `Serial: ${medicion.datos_originales.serial.substring(0, 12)}`;
    document.getElementById('timeTension').textContent = calcularTiempoTranscurrido(medicion.recibido_en);
}

/**
 * Actualizar card de la Balanza
 */
function actualizarCardBalanza(medicion) {
    const card = document.getElementById('cardBalanza');
    const valuesDiv = document.getElementById('valuesBalanza');
    const statusDot = document.getElementById('statusBalanza');
    const statusText = document.getElementById('statusTextBalanza');
    const metaDiv = document.getElementById('metaBalanza');
    
    if (!medicion) {
        statusDot.classList.add('inactive');
        statusText.textContent = 'Sin datos';
        return;
    }
    
    // Animación
    card.classList.add('new-data-animation');
    setTimeout(() => card.classList.remove('new-data-animation'), 500);
    
    // Extraer valores
    const measures = medicion.datos_originales.measure;
    const peso = measures.find(m => m.parameter === 'peso')?.value || 0;
    
    // Determinar estado (asumiendo altura promedio de 1.70m para IMC estimado)
    const imcEstimado = peso / (1.70 * 1.70);
    let alertClass = 'normal';
    let alertText = 'Normal';
    
    if (imcEstimado >= 30) {
        alertClass = 'danger';
        alertText = 'Obesidad';
    } else if (imcEstimado >= 25) {
        alertClass = 'warning';
        alertText = 'Sobrepeso';
    } else if (imcEstimado < 18.5) {
        alertClass = 'warning';
        alertText = 'Bajo Peso';
    }
    
    // Actualizar estado
    statusDot.classList.remove('inactive');
    statusText.textContent = 'Activo';
    
    valuesDiv.innerHTML = `
        <div class="value-item">
            <div class="value-number" style="color: #10b981">
                ${peso.toFixed(1)}
            </div>
            <div class="value-label">Peso (kg)</div>
        </div>
        <div class="value-item">
            <div class="value-number" style="font-size: 1.5rem;">
                ${imcEstimado.toFixed(1)}
            </div>
            <div class="value-label">IMC Est.</div>
        </div>
        <div class="value-item">
            <span class="alert-badge ${alertClass}">${alertText}</span>
        </div>
    `;
    
    // Metadata
    metaDiv.style.display = 'flex';
    document.getElementById('serialBalanza').textContent = `Serial: ${medicion.datos_originales.serial.substring(0, 12)}`;
    document.getElementById('timeBalanza').textContent = calcularTiempoTranscurrido(medicion.recibido_en);
}

/**
 * Actualizar gráficos de tendencias
 */
function actualizarGraficos(oximetro, tension, balanza) {
    const ctx = document.getElementById('trendsChart');
    
    // Limitar a últimas 10 mediciones
    const oxData = oximetro.slice(0, 10).reverse();
    const tensionData = tension.slice(0, 10).reverse();
    const balanzaData = balanza.slice(0, 10).reverse();
    
    // Preparar labels (timestamps)
    const maxLength = Math.max(oxData.length, tensionData.length, balanzaData.length);
    const labels = Array.from({length: maxLength}, (_, i) => `Med ${i + 1}`);
    
    // Extraer valores para cada dataset
    const spo2Values = oxData.map(m => {
        const measure = m.datos_originales.measure.find(item => item.parameter === 'spo2');
        return measure ? measure.value : null;
    });
    
    const sistolicaValues = tensionData.map(m => {
        const measure = m.datos_originales.measure.find(item => item.parameter === 'sistolica');
        return measure ? measure.value : null;
    });
    
    const pesoValues = balanzaData.map(m => {
        const measure = m.datos_originales.measure.find(item => item.parameter === 'peso');
        return measure ? measure.value : null;
    });
    
    // Destruir gráfico anterior si existe
    if (chart) {
        chart.destroy();
    }
    
    // Crear nuevo gráfico
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'SpO2 (%)',
                    data: spo2Values,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Presión Sistólica (mmHg)',
                    data: sistolicaValues,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                },
                {
                    label: 'Peso (kg)',
                    data: pesoValues,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y2'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    enabled: true
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'SpO2 (%)'
                    },
                    min: 80,
                    max: 100
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Presión (mmHg)'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    min: 60,
                    max: 160
                },
                y2: {
                    type: 'linear',
                    display: false,
                    position: 'right'
                }
            }
        }
    });
}

/**
 * Calcular tiempo transcurrido desde una fecha
 */
function calcularTiempoTranscurrido(fechaString) {
    const fecha = new Date(fechaString);
    const ahora = new Date();
    const diferencia = Math.floor((ahora - fecha) / 1000); // segundos
    
    if (diferencia < 60) {
        return `Hace ${diferencia} seg`;
    } else if (diferencia < 3600) {
        const minutos = Math.floor(diferencia / 60);
        return `Hace ${minutos} min`;
    } else {
        const horas = Math.floor(diferencia / 3600);
        return `Hace ${horas} h`;
    }
}
