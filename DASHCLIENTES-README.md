# 🏢 DASHBOARD CLIENTES - FASE 1 COMPLETADA

## ✅ LO QUE SE ACABA DE CREAR:

### 📁 **Estructura de carpetas:**
```
public/pages/dashclientes/           ← TODO EL MÓDULO AQUÍ
├── css/
│   ├── dashclientes-main.css        ← Estilos base (gradientes SoyBien)
│   └── dashclientes-proyectos.css   ← Estilos específicos de proyectos
├── js/
│   ├── dashclientes-auth.js         ← Login y autenticación
│   └── dashclientes-proyectos.js    ← Lógica de proyectos
├── dashclientes-login.html          ← Pantalla de login corporativo
└── dashclientes-proyectos.html      ← Lista de proyectos/empresas

public/pages/dashsuper/              ← Para superadmin (vacío por ahora)

routes/
└── dashclientes.js                  ← Endpoints API

scripts/dashclientes/
├── dashclientes-schema-v1.sql       ← Crear tabla clientes
├── dashclientes-seed-demo.sql       ← Insertar 3 clientes demo
└── README-EJECUTAR-SQL.md           ← Instrucciones para Supabase
```

---

## 🚀 PRÓXIMOS PASOS PARA TI:

### **PASO 1: Ejecutar SQLs en Supabase** ⏱️ 5 minutos

1. Ve a Supabase: https://supabase.com/dashboard
2. Abre el SQL Editor
3. Ejecuta el contenido de `scripts/dashclientes/dashclientes-schema-v1.sql`
4. Ejecuta el contenido de `scripts/dashclientes/dashclientes-seed-demo.sql`
5. Verifica que se crearon 3 clientes:
   ```sql
   SELECT nombre, nombre_comercial, color_hex FROM clientes;
   ```

**👉 LEE:** `scripts/dashclientes/README-EJECUTAR-SQL.md` para instrucciones detalladas

---

### **PASO 2: Extender tabla `users`** ⏱️ 3 minutos

Necesitas agregar el campo `cliente_id` a la tabla `users`:

```sql
-- Agregar columna cliente_id
ALTER TABLE users ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES clientes(id);

-- Verificar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'cliente_id';
```

---

### **PASO 3: Crear un usuario cliente de prueba** ⏱️ 5 minutos

**Opción A: Manual en Supabase (por ahora)**

```sql
-- 1. Obtener el ID de Coca-Cola
SELECT id FROM clientes WHERE nombre = 'coca-cola';

-- 2. Crear usuario cliente (reemplaza el UUID con el que obtuviste)
INSERT INTO users (
  id,
  username,
  email,
  password,
  role,
  cliente_id,
  active
) VALUES (
  'user_cliente_cocacola',
  'juan.perez',
  'juan.perez@coca-cola.com',
  '$2a$10$DYMqINhoJya9PEjAtLkxW.f5feiyqxaLQm3zkwFUlmYiE/bzuUphm',  -- pass123
  'cliente',
  'AQUI_EL_UUID_DE_COCA_COLA',
  true
);
```

**Credenciales de prueba:**
- Email: `juan.perez@coca-cola.com`
- Password: `pass123`
- Role: `cliente`

---

### **PASO 4: Actualizar enum de roles (si es necesario)** ⏱️ 2 minutos

Si tu tabla `users` tiene un ENUM para `role`, necesitas agregar 'cliente':

```sql
-- Ver tipo actual
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';

-- Si es ENUM, agregar 'cliente' y 'superadmin':
ALTER TYPE <nombre_del_enum> ADD VALUE IF NOT EXISTS 'cliente';
ALTER TYPE <nombre_del_enum> ADD VALUE IF NOT EXISTS 'superadmin';
```

**⚠️ Si `role` es solo `text`, no hace falta este paso.**

---

## 🧪 TESTING - CÓMO PROBAR:

### **1. Levantar servidor:**
```bash
npm start
```

### **2. Abrir en navegador:**
```
http://localhost:3000/pages/dashclientes/dashclientes-login.html
```

### **3. Login con usuario cliente:**
- Email: `juan.perez@coca-cola.com`
- Password: `pass123`

### **4. Deberías ver:**
- ✅ Pantalla de proyectos con 3 empresas (hardcoded):
  - Coca-Cola FEMSA Colombia
  - Ecopetrol S.A.
  - Postobón S.A.
- ✅ Cards con colores, estadísticas, progress bars
- ✅ Al hacer click en "Ver Dashboard" → Alert (pantalla overview aún no existe)

---

## 🎨 LO QUE YA FUNCIONA:

### ✅ **LOGIN:**
- Formulario con validación de email
- Toggle de contraseña (ojo)
- Mensajes de error animados
- Loading spinner
- Redirige a proyectos si ya está logueado
- Look & feel de SoyBien (gradiente morado-azul)

### ✅ **PROYECTOS:**
- Navbar con nombre de usuario
- Botón de logout
- Grid responsive de proyectos
- Cards con:
  - Ícono y color por empresa
  - Tags de estado (Activo/Pendiente)
  - Estadísticas (colaboradores, tamizados, teleconsultas)
  - Progress bar animada
  - Botón "Ver Dashboard"
- Estados: loading, error, vacío
- **DATOS: Hardcodeados en JS** (línea 50 de dashclientes-proyectos.js)

### ✅ **BACKEND:**
- Endpoint: `GET /api/dashclientes/proyectos`
- Middleware: `verifyToken` + `checkClienteRole`
- Filtra por `cliente_id` del usuario
- Integrado en `server.js`

---

## 📊 DATOS ACTUALES:

### **HARDCODED (Fase 1):**
Los datos están en `public/pages/dashclientes/js/dashclientes-proyectos.js` línea 50:

```javascript
const PROYECTOS_DEMO = [
  { id: 'coca-cola', nombre: 'Coca-Cola FEMSA Colombia', ... },
  { id: 'ecopetrol', nombre: 'Ecopetrol S.A.', ... },
  { id: 'postobon', nombre: 'Postobón S.A.', ... }
];
```

### **CONECTAR CON API (Fase 2):**
Para usar datos reales de Supabase, descomentar líneas 73-87 de `dashclientes-proyectos.js`:

```javascript
// DESCOMENTAR ESTO:
const token = localStorage.getItem('token');
const response = await fetch('/api/dashclientes/proyectos', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
const data = await response.json();
const proyectos = data.proyectos;

// COMENTAR ESTO:
// const proyectos = PROYECTOS_DEMO;
```

---

## 🔄 PRÓXIMAS PANTALLAS (Día 2-3):

1. **dashclientes-overview.html** - Vista general del cliente
   - Mapa de Colombia con sedes
   - KPIs principales (CV, SM, TC, Monitoreo)
   - Lista de sedes clickeables

2. **dashclientes-sede.html** - Detalle de una sede
   - Header con KPIs de sede
   - 4 módulos: CV, SM, TC, Monitoreo
   - Clickeable para drill-down

3. **dashclientes-modulo-cv.html** - Riesgo cardiovascular
   - Clasificación de riesgo (4 niveles)
   - Factores de riesgo clickeables
   - Gráficas Chart.js

---

## 📝 NOTAS IMPORTANTES:

### **Autenticación:**
- El login actual (`/api/auth/login`) debe aceptar `role: 'cliente'`
- Verifica que tu endpoint `/auth/login` en `routes/auth.js` permita login con email

### **Look & Feel:**
- ✅ Colores de SoyBien mantenidos (#667eea, #764ba2)
- ✅ Gradientes en login y botones
- ✅ Font Awesome icons
- ✅ Diseño responsive

### **Separación:**
- ✅ Todo en carpeta `dashclientes/` - NO toca tu app actual
- ✅ Prefijos en archivos: `dashclientes-*.html`
- ✅ Rutas API: `/api/dashclientes/*`
- ✅ Fácil de borrar si algo falla

---

## 🐛 SI ALGO NO FUNCIONA:

### **Error: "Cliente no encontrado"**
→ Ejecuta los SQLs en Supabase (Paso 1)

### **Error: "Usuario no asociado a ningún cliente"**
→ Crea usuario con `cliente_id` (Paso 3)

### **Error: "Acceso denegado"**
→ Verifica que `role = 'cliente'` en la tabla users

### **No carga proyectos:**
→ Abre DevTools Console (F12) y busca errores
→ Por ahora usa datos hardcoded, no depende de BD

---

## ✅ CHECKLIST ANTES DE CONTINUAR:

- [ ] SQLs ejecutados en Supabase
- [ ] Tabla `clientes` creada con 3 registros
- [ ] Campo `cliente_id` agregado a tabla `users`
- [ ] Usuario cliente creado
- [ ] Servidor levantado (`npm start`)
- [ ] Login funciona
- [ ] Proyectos se ven (con datos hardcoded)

**Cuando completes esto, avísame para continuar con Día 2 (Overview + Mapa)** 🚀
