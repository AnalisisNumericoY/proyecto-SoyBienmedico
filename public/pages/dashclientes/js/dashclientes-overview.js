/* ============================================================================
   DASHBOARD OVERVIEW - JAVASCRIPT
   Lógica para vista general del cliente
   ============================================================================ */

// ---------------------------------------------------------------------------
// AUTH CHECK
// ---------------------------------------------------------------------------
function checkAuth() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = 'dashclientes-login.html';
        return null;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'cliente') {
        alert('Acceso denegado: Solo para clientes');
        window.location.href = 'dashclientes-login.html';
        return null;
    }

    return user;
}

// ---------------------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------------------
function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('clienteId');
        localStorage.removeItem('proyectoActual');
        window.location.href = 'dashclientes-login.html';
    }
}

// ---------------------------------------------------------------------------
// CARGAR OVERVIEW
// ---------------------------------------------------------------------------
async function loadOverview() {
    const user = checkAuth();
    if (!user) return;

    // Obtener clienteId de URL o localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const clienteId = urlParams.get('clienteId') || localStorage.getItem('clienteId');

    if (!clienteId) {
        showError('No se encontró información del cliente');
        return;
    }

    // Mostrar email en navbar
    document.getElementById('userName').textContent = user.email;

    // Mostrar loading
    showLoading();

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/dashclientes/overview/${clienteId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar overview');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al cargar datos');
        }

        // Renderizar datos
        renderOverview(data);

    } catch (error) {
        console.error('❌ Error al cargar overview:', error);
        showError(error.message || 'Error al cargar información del cliente');
    }
}

// ---------------------------------------------------------------------------
// RENDERIZAR OVERVIEW
// ---------------------------------------------------------------------------
function renderOverview(data) {
    const { cliente, sedes, kpis } = data;

    // Breadcrumb
    document.getElementById('breadcrumbCliente').textContent = cliente.nombre_comercial;

    // KPIs
    document.getElementById('kpiColaboradores').textContent = formatNumber(kpis.total_colaboradores);
    document.getElementById('kpiTamizados').textContent = formatNumber(kpis.tamizados);
    document.getElementById('kpiRiesgoCV').textContent = formatNumber(kpis.riesgo_cv_alto);
    document.getElementById('kpiTeleconsultas').textContent = formatNumber(kpis.teleconsultas);

    // Stats de sedes
    document.getElementById('totalSedes').textContent = kpis.sedes_activas;
    document.getElementById('totalCiudades').textContent = kpis.ciudades;

    // Renderizar sedes
    if (sedes && sedes.length > 0) {
        renderSedes(sedes, cliente.color_hex);
    } else {
        showSedesEmpty();
    }

    // Mostrar contenido
    hideLoading();
    document.getElementById('overviewContent').style.display = 'block';
}

// ---------------------------------------------------------------------------
// RENDERIZAR SEDES (lista de tarjetas agrupadas por ciudad)
// ---------------------------------------------------------------------------
function renderSedes(sedes, colorCliente) {
    const grid = document.getElementById('sedesGrid');
    
    // Agrupar sedes por ciudad
    const ciudades = {};
    sedes.forEach(sede => {
        if (!ciudades[sede.ciudad]) {
            ciudades[sede.ciudad] = [];
        }
        ciudades[sede.ciudad].push(sede);
    });

    // Generar HTML
    grid.innerHTML = sedes.map(sede => {
        const tipoIcon = getTipoSedeIcon(sede.tipo_sede);
        const tipoClass = sede.tipo_sede || 'planta';
        
        return `
            <div class="sede-card" onclick="verSede('${sede.id}')">
                <div class="sede-header">
                    <div class="sede-icon" style="background: linear-gradient(135deg, ${colorCliente}, ${adjustColor(colorCliente, -20)});">
                        ${tipoIcon}
                    </div>
                    <div class="sede-info">
                        <div class="sede-nombre">${sede.nombre}</div>
                        <div class="sede-ciudad">
                            <i class="fas fa-map-marker-alt"></i>
                            ${sede.ciudad}
                        </div>
                    </div>
                </div>
                
                <div class="sede-tipo ${tipoClass}">
                    ${(sede.tipo_sede || 'sede').toUpperCase()}
                </div>

                <div class="sede-stats">
                    <div class="sede-stat-item">
                        <span class="sede-stat-label">
                            <i class="fas fa-users"></i>
                            Colaboradores
                        </span>
                        <span class="sede-stat-value">${formatNumber(sede.colaboradores_objetivo)}</span>
                    </div>
                    <div class="sede-stat-item">
                        <span class="sede-stat-label">
                            <i class="fas fa-user-tie"></i>
                            Responsable
                        </span>
                        <span class="sede-stat-value">${sede.responsable_sede || 'N/A'}</span>
                    </div>
                    ${sede.telefono_sede ? `
                    <div class="sede-stat-item">
                        <span class="sede-stat-label">
                            <i class="fas fa-phone"></i>
                            Teléfono
                        </span>
                        <span class="sede-stat-value">${sede.telefono_sede}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="sede-footer">
                    <button class="btn-view-sede" onclick="verSede('${sede.id}'); event.stopPropagation();">
                        <i class="fas fa-chart-area"></i>
                        Ver Estadísticas
                    </button>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('sedesEmpty').style.display = 'none';
    grid.style.display = 'grid';
}

// ---------------------------------------------------------------------------
// VER DETALLE DE SEDE
// ---------------------------------------------------------------------------
function verSede(sedeId) {
    console.log('📍 Abriendo sede:', sedeId);
    
    // Guardar sede seleccionada
    localStorage.setItem('sedeActual', sedeId);
    
    // FASE 3: Redirigir a detalle de sede (próxima implementación)
    alert(`🚧 Próximamente: Detalle de sede\n\nEsta pantalla mostrará:\n• KPIs de la sede\n• Módulos de salud (CV, SM, TC)\n• Lista de colaboradores`);
    
    // DESCOMENTAR EN FASE 3:
    // const clienteId = localStorage.getItem('clienteId');
    // window.location.href = `dashclientes-sede.html?clienteId=${clienteId}&sedeId=${sedeId}`;
}

// ---------------------------------------------------------------------------
// UTILIDADES
// ---------------------------------------------------------------------------
function formatNumber(num) {
    if (!num && num !== 0) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getTipoSedeIcon(tipo) {
    const iconos = {
        'planta': '<i class="fas fa-industry"></i>',
        'cedis': '<i class="fas fa-warehouse"></i>',
        'oficina': '<i class="fas fa-building"></i>',
        'bodega': '<i class="fas fa-boxes"></i>'
    };
    return iconos[tipo] || '<i class="fas fa-map-marker-alt"></i>';
}

function adjustColor(color, amount) {
    // Convertir hex a RGB
    const num = parseInt(color.replace('#', ''), 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    
    // Limitar entre 0-255
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    
    // Convertir de vuelta a hex
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// ---------------------------------------------------------------------------
// ESTADOS UI
// ---------------------------------------------------------------------------
function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('overviewContent').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
}

function showError(message) {
    hideLoading();
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('overviewContent').style.display = 'none';
}

function showSedesEmpty() {
    document.getElementById('sedesGrid').style.display = 'none';
    document.getElementById('sedesEmpty').style.display = 'block';
}

// ---------------------------------------------------------------------------
// VER JORNADAS
// ---------------------------------------------------------------------------
function verJornadas() {
    const urlParams = new URLSearchParams(window.location.search);
    const clienteId = urlParams.get('clienteId') || urlParams.get('id');
    
    if (clienteId) {
        window.location.href = `dashclientes-jornadas.html?id=${clienteId}`;
    } else {
        console.error('No se encontró clienteId');
        alert('Error: No se pudo determinar el cliente');
    }
}

// ---------------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadOverview();
});
