/**
 * DashClientes - Jornada
 * Vista detallada de una jornada específica con estadísticas y evaluaciones
 * SoyBienmedico - 2026
 */

// Variables globales
let jornadaData = null;
let jornadaId = null;
let clienteId = null;

/**
 * Inicialización al cargar la página
 */
$(document).ready(function() {
    // Verificar autenticación
    if (!checkAuth()) {
        window.location.href = 'dashclientes-login.html';
        return;
    }
    
    // Obtener jornadaId de URL
    const urlParams = new URLSearchParams(window.location.search);
    jornadaId = urlParams.get('id');
    clienteId = urlParams.get('clienteId');
    
    if (!jornadaId) {
        showError('No se especificó una jornada válida');
        return;
    }
    
    // Mostrar nombre de usuario
    const user = JSON.parse(localStorage.getItem('dashclientesUser'));
    $('#userName').text(user.email || user.nombre || 'Usuario');
    
    // Cargar datos de la jornada
    loadJornada();
});

/**
 * Cargar datos de la jornada desde el backend
 */
async function loadJornada() {
    try {
        $('#loadingState').show();
        $('#errorState').hide();
        $('#jornadaContent').hide();
        
        const token = localStorage.getItem('dashclientesToken');
        
        const response = await fetch(`/api/dashclientes/jornada/${jornadaId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Error al cargar datos de jornada');
        }
        
        jornadaData = result;
        
        // Renderizar datos
        renderJornadaHeader(result.jornada);
        renderKPIs(result.estadisticas);
        renderDistribuciones(result.estadisticas);
        renderCasosSeguimiento(result.casos_seguimiento);
        renderEvaluaciones(result.evaluaciones);
        
        // Ocultar loading y mostrar contenido
        $('#loadingState').hide();
        $('#jornadaContent').fadeIn(300);
        
        console.log('✅ Datos de jornada cargados:', result);
        
    } catch (error) {
        console.error('❌ Error cargando jornada:', error);
        showError(error.message);
    }
}

/**
 * Renderizar header de la jornada
 */
function renderJornadaHeader(jornada) {
    // Título
    $('#jornadaTitulo').text(jornada.programa.nombre);
    
    // Breadcrumb
    $('#breadcrumbCliente').text(jornada.cliente.nombre);
    $('#breadcrumbOverview').attr('href', `dashclientes-overview.html?id=${jornada.cliente.id}`);
    $('#breadcrumbJornada').text(`Jornada ${formatFecha(jornada.fecha)}`);
    
    // Metadata
    $('#jornadaFecha').text(formatFecha(jornada.fecha));
    $('#jornadaSede').text(jornada.sede.nombre + (jornada.sede.ciudad ? ` - ${jornada.sede.ciudad}` : ''));
    $('#jornadaResponsable').text(jornada.responsable || 'No asignado');
    
    // Estado
    if (jornada.activa) {
        $('#jornadaEstado').text('ACTIVA').removeClass('badge-inactiva').addClass('badge-activa');
    } else {
        $('#jornadaEstado').text('FINALIZADA').removeClass('badge-activa').addClass('badge-inactiva');
    }
    
    // Descripción
    if (jornada.descripcion) {
        $('#jornadaDescripcion').html(`<i class="fas fa-info-circle"></i> ${jornada.descripcion}`);
    } else {
        $('#jornadaDescripcion').hide();
    }
}

/**
 * Renderizar KPIs principales
 */
function renderKPIs(stats) {
    $('#kpiTotalEvaluaciones').text(stats.total_evaluaciones);
    $('#kpiRiesgoCV').text(stats.por_tipo.riesgo_cardiovascular);
    $('#kpiHADS').text(stats.por_tipo.hads);
    $('#kpiSeguimiento').text(stats.casos_seguimiento);
    
    // Animar contadores
    animateCounters();
}

/**
 * Renderizar distribuciones (gráficos de barras)
 */
function renderDistribuciones(stats) {
    const totalCV = stats.por_tipo.riesgo_cardiovascular;
    const totalHADS = stats.por_tipo.hads;
    
    // Riesgo Cardiovascular
    $('#totalRiesgoCV').text(`${totalCV} evaluaciones`);
    renderProgressBar('cvBajo', stats.distribucion_riesgo_cv.bajo, totalCV);
    renderProgressBar('cvModerado', stats.distribucion_riesgo_cv.moderado, totalCV);
    renderProgressBar('cvAlto', stats.distribucion_riesgo_cv.alto, totalCV);
    renderProgressBar('cvMuyAlto', stats.distribucion_riesgo_cv.muy_alto, totalCV);
    
    // Ansiedad
    $('#totalHADS').text(`${totalHADS} evaluaciones`);
    $('#totalHADS2').text(`${totalHADS} evaluaciones`);
    renderProgressBar('ansiedadNormal', stats.distribucion_ansiedad.normal, totalHADS);
    renderProgressBar('ansiedadLeve', stats.distribucion_ansiedad.leve, totalHADS);
    renderProgressBar('ansiedadModerado', stats.distribucion_ansiedad.moderado, totalHADS);
    renderProgressBar('ansiedadSevero', stats.distribucion_ansiedad.severo, totalHADS);
    
    // Depresión
    renderProgressBar('depresionNormal', stats.distribucion_depresion.normal, totalHADS);
    renderProgressBar('depresionLeve', stats.distribucion_depresion.leve, totalHADS);
    renderProgressBar('depresionModerado', stats.distribucion_depresion.moderado, totalHADS);
    renderProgressBar('depresionSevero', stats.distribucion_depresion.severo, totalHADS);
}

/**
 * Renderizar barra de progreso individual
 */
function renderProgressBar(id, value, total) {
    const percentage = total > 0 ? (value / total * 100) : 0;
    
    $(`#${id}`).text(value);
    $(`#${id}Bar`).css('width', `${percentage}%`);
}

/**
 * Renderizar tabla de casos que requieren seguimiento
 */
function renderCasosSeguimiento(casos) {
    $('#totalCasosSeguimiento').text(`${casos.length} casos`);
    
    const container = $('#casosSeguimientoContainer');
    
    if (casos.length === 0) {
        container.html(`
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>¡Excelente!</h3>
                <p>No hay casos que requieran seguimiento inmediato en esta jornada.</p>
            </div>
        `);
        return;
    }
    
    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Paciente</th>
                    <th>Identificación</th>
                    <th>Edad</th>
                    <th>Sexo</th>
                    <th>Tipo Evaluación</th>
                    <th>Motivo Seguimiento</th>
                    <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    casos.forEach(caso => {
        const tipoClass = caso.tipo === 'riesgo_cardiovascular' ? 'riesgo' : 'hads';
        const tipoLabel = caso.tipo === 'riesgo_cardiovascular' ? 'Riesgo CV' : 'HADS';
        
        tableHTML += `
            <tr>
                <td><strong>${caso.paciente.nombre || 'Sin nombre'}</strong></td>
                <td>${caso.paciente.identificacion || 'N/A'}</td>
                <td>${caso.paciente.edad || 'N/A'}</td>
                <td>${caso.paciente.sexo || 'N/A'}</td>
                <td><span class="badge-tipo ${tipoClass}">${tipoLabel}</span></td>
                <td><strong style="color: #e53e3e;">${caso.motivo}</strong></td>
                <td>${formatFechaHora(caso.fecha)}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    container.html(tableHTML);
}

/**
 * Renderizar tabla de todas las evaluaciones
 */
function renderEvaluaciones(evaluaciones) {
    $('#totalEvaluaciones').text(`${evaluaciones.length} evaluaciones`);
    
    const container = $('#evaluacionesContainer');
    
    if (evaluaciones.length === 0) {
        container.html(`
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>Sin evaluaciones</h3>
                <p>Aún no se han registrado evaluaciones para esta jornada.</p>
            </div>
        `);
        return;
    }
    
    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Paciente</th>
                    <th>Identificación</th>
                    <th>Edad</th>
                    <th>Tipo</th>
                    <th>Resultado</th>
                    <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    evaluaciones.forEach(evaluacion => {
        const tipoClass = evaluacion.tipo === 'riesgo_cardiovascular' ? 'riesgo' : 'hads';
        const tipoLabel = evaluacion.tipo === 'riesgo_cardiovascular' ? 'Riesgo CV' : 'HADS';
        
        const resultadoHTML = formatResultado(evaluacion);
        
        tableHTML += `
            <tr>
                <td><strong>${evaluacion.paciente.nombre || 'Sin nombre'}</strong></td>
                <td>${evaluacion.paciente.identificacion || 'N/A'}</td>
                <td>${evaluacion.paciente.edad || 'N/A'}</td>
                <td><span class="badge-tipo ${tipoClass}">${tipoLabel}</span></td>
                <td>${resultadoHTML}</td>
                <td>${formatFechaHora(evaluacion.fecha)}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    container.html(tableHTML);
}

/**
 * Formatear resultado de evaluación
 */
function formatResultado(evaluacion) {
    const res = evaluacion.resultado_resumido;
    
    if (evaluacion.tipo === 'riesgo_cardiovascular') {
        const categoria = res.categoria || 'N/A';
        const categoriaClass = getCategoriaClass(categoria);
        const porcentaje = res.porcentaje ? `${res.porcentaje}%` : '';
        
        return `
            <span class="badge-resultado ${categoriaClass}">${categoria}</span>
            ${porcentaje ? `<small style="margin-left: 0.5rem; color: #718096;">${porcentaje}</small>` : ''}
        `;
    }
    
    if (evaluacion.tipo === 'hads') {
        const ansiedadClass = getCategoriaClass(res.ansiedad.categoria);
        const depresionClass = getCategoriaClass(res.depresion.categoria);
        
        return `
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <div>
                    <small style="color: #718096; font-size: 0.75rem;">Ansiedad:</small>
                    <span class="badge-resultado ${ansiedadClass}">${res.ansiedad.categoria}</span>
                </div>
                <div>
                    <small style="color: #718096; font-size: 0.75rem;">Depresión:</small>
                    <span class="badge-resultado ${depresionClass}">${res.depresion.categoria}</span>
                </div>
            </div>
        `;
    }
    
    return 'N/A';
}

/**
 * Obtener clase CSS según categoría
 */
function getCategoriaClass(categoria) {
    const cat = categoria.toLowerCase();
    
    if (cat.includes('bajo') || cat.includes('normal')) {
        return 'bajo';
    }
    if (cat.includes('leve')) {
        return 'leve';
    }
    if (cat.includes('moderado')) {
        return 'moderado';
    }
    if (cat.includes('muy alto')) {
        return 'muy-alto';
    }
    if (cat.includes('alto') || cat.includes('severo') || cat.includes('grave')) {
        return 'alto';
    }
    
    return 'bajo';
}

/**
 * Animar contadores al cargar
 */
function animateCounters() {
    $('.kpi-value').each(function() {
        const $this = $(this);
        const countTo = parseInt($this.text());
        
        if (isNaN(countTo)) return;
        
        $({ countNum: 0 }).animate({
            countNum: countTo
        }, {
            duration: 1000,
            easing: 'swing',
            step: function() {
                $this.text(Math.floor(this.countNum));
            },
            complete: function() {
                $this.text(this.countNum);
            }
        });
    });
}

/**
 * Formatear fecha (YYYY-MM-DD -> DD/MM/YYYY)
 */
function formatFecha(fecha) {
    if (!fecha) return 'N/A';
    
    try {
        const [year, month, day] = fecha.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
    } catch (e) {
        return fecha;
    }
}

/**
 * Formatear fecha y hora
 */
function formatFechaHora(fechaHora) {
    if (!fechaHora) return 'N/A';
    
    try {
        const date = new Date(fechaHora);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
        return fechaHora;
    }
}

/**
 * Mostrar estado de error
 */
function showError(message) {
    $('#loadingState').hide();
    $('#jornadaContent').hide();
    $('#errorState').show();
    $('#errorMessage').text(message);
}

/**
 * Descargar reporte consolidado PDF
 */
function descargarReporteConsolidado() {
    alert('Funcionalidad de descarga de PDF consolidado en desarrollo.\n\n' +
          'Se generará un PDF con:\n' +
          '- Resumen de la jornada\n' +
          '- Estadísticas generales\n' +
          '- Gráficos de distribución\n' +
          '- Listado de casos que requieren seguimiento\n' +
          '- Todas las evaluaciones realizadas');
    
    // TODO: Implementar generación de PDF consolidado
    // Puede ser un endpoint backend que genere el PDF
    // o usar una librería cliente como jsPDF + html2canvas
}

/**
 * Logout
 */
function logout() {
    localStorage.removeItem('dashclientesToken');
    localStorage.removeItem('dashclientesUser');
    window.location.href = 'dashclientes-login.html';
}
