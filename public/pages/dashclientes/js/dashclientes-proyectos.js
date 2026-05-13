/* ============================================================================
   DASHCLIENTES - PROYECTOS
   Manejo de lista de proyectos del cliente
   ============================================================================ */

// ---------------------------------------------------------------------------
// VERIFICAR AUTENTICACIÓN
// ---------------------------------------------------------------------------
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        console.log('❌ No autenticado, redirigiendo a login');
        window.location.href = 'dashclientes-login.html';
        return null;
    }
    
    try {
        const userData = JSON.parse(user);
        
        if (userData.role !== 'cliente') {
            console.log('❌ Usuario no es cliente, redirigiendo');
            localStorage.clear();
            window.location.href = 'dashclientes-login.html';
            return null;
        }
        
        return userData;
    } catch (error) {
        console.error('❌ Error al parsear usuario:', error);
        localStorage.clear();
        window.location.href = 'dashclientes-login.html';
        return null;
    }
}

// ---------------------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------------------
function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        localStorage.clear();
        window.location.href = 'dashclientes-login.html';
    }
}

// ---------------------------------------------------------------------------
// DATOS DEMO HARDCODEADOS (FASE 1)
// Se reemplazarán por llamada a API en FASE 2
// ---------------------------------------------------------------------------
const PROYECTOS_DEMO = [
    {
        id: 'coca-cola',
        nombre: 'Coca-Cola FEMSA Colombia',
        nit: '860.009.578-6',
        color_hex: '#E24B4A',
        icono: 'fa-bottle-droplet',
        industria: 'Alimentos y Bebidas',
        ubicacion: 'Nacional - 7 plantas',
        total_colaboradores: 9855,
        colaboradores_tamizados: 1251,
        teleconsultas: 218,
        estado: 'activo',
        descripcion: '7 plantas industriales · 23 CEDIS'
    },
    {
        id: 'ecopetrol',
        nombre: 'Ecopetrol S.A.',
        nit: '899.999.068-1',
        color_hex: '#185FA5',
        icono: 'fa-industry',
        industria: 'Petróleo y Energía',
        ubicacion: 'Nacional - Múltiples sedes',
        total_colaboradores: 15200,
        colaboradores_tamizados: 4280,
        teleconsultas: 456,
        estado: 'activo',
        descripcion: 'Refinería · Pozos · Oficinas'
    },
    {
        id: 'postobon',
        nombre: 'Postobón S.A.',
        nit: '890.903.407-5',
        color_hex: '#FAC775',
        icono: 'fa-bottle-water',
        industria: 'Alimentos y Bebidas',
        ubicacion: 'Medellín, Cali, Bogotá',
        total_colaboradores: 6400,
        colaboradores_tamizados: 0,
        teleconsultas: 0,
        estado: 'pendiente',
        descripcion: 'En proceso de onboarding'
    }
];

// ---------------------------------------------------------------------------
// CARGAR PROYECTOS
// ---------------------------------------------------------------------------
async function loadProyectos() {
    const user = checkAuth();
    if (!user) return;
    
    // Mostrar nombre de usuario en navbar
    document.getElementById('userName').textContent = user.email;
    
    // Mostrar loading
    showLoading();
    
    try {
        // FASE 1: Usar datos hardcodeados
        // FASE 2: Descomentar para usar API real
        /*
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashclientes/proyectos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar proyectos');
        }
        
        const data = await response.json();
        const proyectos = data.proyectos;
        */
        
        // SIMULACIÓN DE DELAY DE RED
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // FASE 1: Usar datos demo
        const proyectos = PROYECTOS_DEMO;
        
        // Renderizar proyectos
        if (proyectos && proyectos.length > 0) {
            renderProyectos(proyectos);
        } else {
            showEmpty();
        }
        
    } catch (error) {
        console.error('❌ Error al cargar proyectos:', error);
        showError(error.message || 'Error al cargar proyectos');
    }
}

// ---------------------------------------------------------------------------
// RENDERIZAR PROYECTOS
// ---------------------------------------------------------------------------
function renderProyectos(proyectos) {
    const grid = document.getElementById('proyectosGrid');
    
    grid.innerHTML = proyectos.map(proyecto => {
        const porcentaje = proyecto.total_colaboradores > 0 
            ? Math.round((proyecto.colaboradores_tamizados / proyecto.total_colaboradores) * 100)
            : 0;
        
        const estadoTag = proyecto.estado === 'activo' 
            ? '<span class="tag tag-activo"><i class="fas fa-check-circle"></i> Activo</span>'
            : '<span class="tag tag-pendiente"><i class="fas fa-clock"></i> Pendiente</span>';
        
        return `
            <div class="proyecto-card" onclick="verProyecto('${proyecto.id}')">
                <div class="card-header">
                    <div class="card-company">
                        <div class="company-icon" style="background: ${proyecto.color_hex}">
                            <i class="fas ${proyecto.icono}"></i>
                        </div>
                        <div class="company-info">
                            <h3>${proyecto.nombre}</h3>
                            <p>${proyecto.descripcion}</p>
                        </div>
                    </div>
                    <div class="card-tags">
                        ${estadoTag}
                        <span class="tag"><i class="fas fa-industry"></i> ${proyecto.industria}</span>
                        <span class="tag"><i class="fas fa-map-marker-alt"></i> ${proyecto.ubicacion}</span>
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="card-stats">
                        <div class="stat-item">
                            <span class="stat-label">
                                <i class="fas fa-users"></i>
                                Total colaboradores
                            </span>
                            <span class="stat-value">${proyecto.total_colaboradores.toLocaleString()}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">
                                <i class="fas fa-user-check"></i>
                                Tamizados
                            </span>
                            <span class="stat-value stat-highlight">${proyecto.colaboradores_tamizados.toLocaleString()}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">
                                <i class="fas fa-video"></i>
                                Teleconsultas
                            </span>
                            <span class="stat-value">${proyecto.teleconsultas}</span>
                        </div>
                    </div>
                    
                    <div class="progress-section">
                        <div class="progress-header">
                            <span class="progress-label">Avance del proyecto</span>
                            <span class="progress-percent">${porcentaje}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${porcentaje}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="card-footer">
                    <button class="btn-view-project" onclick="verProyecto('${proyecto.id}'); event.stopPropagation();">
                        <i class="fas fa-chart-line"></i>
                        Ver Dashboard
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    hideLoading();
    grid.style.display = 'grid';
}

// ---------------------------------------------------------------------------
// VER DETALLE DE PROYECTO
// ---------------------------------------------------------------------------
function verProyecto(proyectoId) {
    console.log('📊 Abriendo proyecto:', proyectoId);
    
    // Guardar proyecto seleccionado
    localStorage.setItem('proyectoActual', proyectoId);
    
    // FASE 1: Mostrar alert (página overview aún no existe)
    // FASE 2: Redirigir a overview
    alert(`🚧 Próximamente: Dashboard de ${proyectoId}\n\nEsta pantalla se implementará en la siguiente fase con:\n• Mapa de sedes\n• KPIs principales\n• Módulos de salud (CV, SM, TC)`);
    
    // DESCOMENTAR EN FASE 2:
    // window.location.href = `dashclientes-overview.html?proyecto=${proyectoId}`;
}

// ---------------------------------------------------------------------------
// ESTADOS UI
// ---------------------------------------------------------------------------
function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('proyectosGrid').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
}

function showError(message) {
    document.getElementById('errorText').textContent = message;
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('proyectosGrid').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
}

function showEmpty() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('proyectosGrid').style.display = 'none';
}

// ---------------------------------------------------------------------------
// INICIALIZACIÓN
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando dashboard de proyectos...');
    loadProyectos();
});
