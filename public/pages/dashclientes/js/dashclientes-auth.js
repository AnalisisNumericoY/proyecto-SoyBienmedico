/* ============================================================================
   DASHCLIENTES - AUTENTICACIÓN
   Manejo de login para clientes corporativos
   ============================================================================ */

// ---------------------------------------------------------------------------
// TOGGLE PASSWORD VISIBILITY
// ---------------------------------------------------------------------------
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// ---------------------------------------------------------------------------
// MOSTRAR/OCULTAR MENSAJES
// ---------------------------------------------------------------------------
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    errorDiv.style.display = 'flex';
    
    // Auto-hide después de 5 segundos
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

function showLoading() {
    document.getElementById('loadingMessage').style.display = 'flex';
    document.getElementById('loginBtn').disabled = true;
}

function hideLoading() {
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('loginBtn').disabled = false;
}

// ---------------------------------------------------------------------------
// VALIDACIÓN
// ---------------------------------------------------------------------------
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ---------------------------------------------------------------------------
// MANEJO DE LOGIN
// ---------------------------------------------------------------------------
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    hideError();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Validaciones
    if (!email || !password) {
        showError('Por favor complete todos los campos');
        return;
    }
    
    if (!validateEmail(email)) {
        showError('Por favor ingrese un correo electrónico válido');
        return;
    }
    
    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    // Mostrar loading
    showLoading();
    
    try {
        // Llamada al API de autenticación
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password,
                role: 'cliente' // Forzar role cliente
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Verificar que el usuario tenga role 'cliente'
            if (data.user.role !== 'cliente') {
                hideLoading();
                showError('Este panel es solo para clientes corporativos');
                return;
            }
            
            // Guardar token y datos en localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('clienteId', data.user.cliente_id);
            
            // Mostrar mensaje de éxito
            console.log('✅ Login exitoso:', data.user.email);
            
            // Redirigir a proyectos
            window.location.href = 'dashclientes-proyectos.html';
            
        } else {
            hideLoading();
            showError(data.message || 'Credenciales incorrectas');
        }
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        hideLoading();
        showError('Error de conexión. Por favor intente nuevamente.');
    }
});

// ---------------------------------------------------------------------------
// VERIFICAR SI YA ESTÁ LOGUEADO
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        try {
            const userData = JSON.parse(user);
            
            // Si ya está logueado como cliente, redirigir a proyectos
            if (userData.role === 'cliente') {
                console.log('✅ Usuario ya logueado, redirigiendo...');
                window.location.href = 'dashclientes-proyectos.html';
            }
        } catch (error) {
            console.error('❌ Error al parsear usuario:', error);
            // Si hay error, limpiar storage
            localStorage.clear();
        }
    }
    
    // Focus en campo email
    document.getElementById('email').focus();
});

// ---------------------------------------------------------------------------
// MANEJO DE TECLA ENTER
// ---------------------------------------------------------------------------
document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }
});
