# 📋 MIGRACIÓN: Programas y Jornadas - Guía de Ejecución

## 🎯 Objetivo
Normalizar el sistema agregando:
- Tabla **programas** (evitar texto libre en campo `programa`)
- Tabla **jornadas** (rastrear dónde y cuándo se hicieron evaluaciones)
- Asociar pacientes a programas via FK
- Asociar evaluaciones/historias a jornadas via FK

---

## ⚠️ IMPORTANTE - Leer antes de ejecutar

1. **Hacer backup** de la base de datos antes de comenzar
2. **Ejecutar en orden** - NO saltar pasos
3. **Reemplazar UUIDs** donde se indique `REEMPLAZAR_CON_UUID_XXX`
4. **Verificar** cada paso antes de continuar al siguiente
5. **Tiempo estimado**: 30-40 minutos

---

## 📝 ORDEN DE EJECUCIÓN

### **PASO 1: Crear 3 clientes nuevos**
📄 Archivo: `clientes-adicionales.sql`

**Acción:**
1. Abrir Supabase → SQL Editor
2. Copiar y ejecutar TODO el archivo
3. **Guardar los UUIDs** que retorna el último SELECT

**Salida esperada:**
```
envigado        | Alcaldía de Envigado  | #17a2b8
sabaneta        | Alcaldía de Sabaneta  | #28a745
savia-salud     | Savia Salud EPS       | #20c997
```

✅ **Verificación**: Deben aparecer 3 registros nuevos

---

### **PASO 2: Obtener UUIDs de clientes**
**Acción:**
Ejecutar este query y **copiar los UUIDs** (los necesitarás en PASO 3):

```sql
SELECT 
    id,
    nombre,
    nombre_comercial
FROM clientes
WHERE nombre IN ('coca-cola', 'sabaneta', 'envigado', 'savia-salud')
ORDER BY nombre;
```

**Copiar a un documento temporal:**
```
coca-cola:   UUID_AQUI (ya conocido: f7dbcec1-9bab-4e9b-a83d-a96d26ae2f77)
envigado:    UUID_AQUI
sabaneta:    UUID_AQUI
savia-salud: UUID_AQUI
```

---

### **PASO 3: Crear tabla programas + 4 programas**
📄 Archivo: `programas-schema.sql`

**Acción:**
1. Abrir el archivo
2. **REEMPLAZAR** los 3 placeholders con UUIDs reales del PASO 2:
   - `REEMPLAZAR_CON_UUID_SABANETA` → UUID de sabaneta
   - `REEMPLAZAR_CON_UUID_ENVIGADO` → UUID de envigado
   - `REEMPLAZAR_CON_UUID_SAVIA` → UUID de savia-salud
3. Ejecutar TODO el archivo en Supabase

**Salida esperada:**
```
Coca Cola saludable           | riesgo cardiovascular y salud mental
Mi barrio Envigado            | salud sexual y riesgo cardiovascular
Sabaneta saludable            | riesgo cardiovascular y salud mental
Savia me cuida                | riesgo cardiovascular y atención en general
```

✅ **Verificación**: 4 programas creados, cada uno vinculado a su cliente

---

### **PASO 4: Obtener UUIDs de programas**
**Acción:**
Ejecutar este query y **copiar los UUIDs** (para usar en formularios backend):

```sql
SELECT 
    id,
    nombre,
    tipo
FROM programas
ORDER BY nombre;
```

**Copiar a documento temporal:**
```
Coca Cola saludable:  UUID_AQUI
Mi barrio Envigado:   UUID_AQUI
Sabaneta saludable:   UUID_AQUI
Savia me cuida:       UUID_AQUI
```

---

### **PASO 5: Crear tabla jornadas**
📄 Archivo: `jornadas-schema.sql`

**Acción:**
1. Ejecutar TODO el archivo en Supabase (no requiere reemplazos)

**Salida esperada:**
- Tabla `jornadas` creada
- Sin registros por ahora (se crearán después)

✅ **Verificación**: La tabla debe tener columnas `id, programa_id, sede_id, fecha, responsable_jornada, descripcion, activa`

---

### **PASO 6: Migrar tabla pacientes**
📄 Archivo: `migration-pacientes-programa-id.sql`

**Acción:**
1. Abrir el archivo
2. **REEMPLAZAR** `UUID_COCA_COLA_SALUDABLE` con el UUID del programa "Coca Cola saludable" (del PASO 4)
3. Ejecutar TODO el archivo en Supabase

**Qué hace:**
- Agrega columna `programa_id` a tabla `pacientes`
- Migra pacientes con `programa` = "Coca-cola" o "Coca-cola Quick" → programa "Coca Cola saludable"

**Salida esperada:**
El query de verificación mostrará:
- Pacientes con `programa_id` asignado
- Campo antiguo `programa` (texto) se mantiene para referencia

✅ **Verificación**: Ejecutar el query de conteo por programa - debe mostrar pacientes asociados

---

### **PASO 7: Migrar tabla evaluaciones**
📄 Archivo: `migration-evaluaciones-jornada.sql`

**Acción:**
1. Ejecutar TODO el archivo en Supabase (no requiere reemplazos)

**Qué hace:**
- Agrega columna `jornada_id` a tabla `evaluaciones`
- Las evaluaciones existentes quedan con `jornada_id = NULL` (sin jornada asignada)

**NOTA IMPORTANTE:**
- Evaluaciones **nuevas** SÍ tendrán jornada asignada desde el backend
- Evaluaciones **históricas** quedan sin jornada (o puedes crear jornadas retroactivas - ver comentarios en el archivo)

✅ **Verificación**: Campo `jornada_id` existe en tabla evaluaciones

---

### **PASO 8: Migrar tabla historias_clinicas**
📄 Archivo: `migration-historias-jornada.sql`

**Acción:**
1. Ejecutar TODO el archivo en Supabase

**Qué hace:**
- Agrega columna `jornada_id` a tabla `historias_clinicas`

**NOTA:** Historias clínicas son consultas individuales, NO siempre parte de jornadas

✅ **Verificación**: Campo `jornada_id` existe en tabla historias_clinicas

---

## 🎉 RESULTADO FINAL

Después de ejecutar todos los pasos, tendrás:

### ✅ **Tablas nuevas:**
- `programas` (4 registros)
- `jornadas` (0 registros - se crearán desde el sistema)

### ✅ **Tablas modificadas:**
- `pacientes` → nuevo campo `programa_id uuid FK`
- `evaluaciones` → nuevo campo `jornada_id uuid FK`
- `historias_clinicas` → nuevo campo `jornada_id uuid FK`

### ✅ **Clientes creados:**
- Alcaldía de Sabaneta (verde #28a745)
- Alcaldía de Envigado (azul #17a2b8)
- Savia Salud EPS (verde agua #20c997)
- Coca-Cola (ya existía - rojo #E24B4A)

### ✅ **Programas creados:**
1. **Coca Cola saludable** (Coca-Cola)
   - Tipo: riesgo cardiovascular y salud mental
   
2. **Sabaneta saludable** (Alcaldía de Sabaneta)
   - Tipo: riesgo cardiovascular y salud mental
   
3. **Mi barrio Envigado** (Alcaldía de Envigado)
   - Tipo: salud sexual y riesgo cardiovascular
   
4. **Savia me cuida** (Savia Salud EPS)
   - Tipo: riesgo cardiovascular y atención en general

---

## 🔧 SIGUIENTES PASOS (Backend/Frontend)

Después de la migración de base de datos, implementar:

1. **Backend:**
   - Endpoint `GET /api/programas` (lista programas activos)
   - Modificar servicio `paciente-service.js` para usar `programa_id`
   - Modificar servicio `evaluacion-service.js` para guardar `jornada_id`

2. **Frontend:**
   - Modificar modal admin "Crear Paciente"
   - Cambiar `<input programa>` → `<select programa_id>` (dropdown)
   - Cargar opciones desde `GET /api/programas`

3. **Testing:**
   - Crear paciente nuevo con programa seleccionado
   - Verificar que se guarda `programa_id` correctamente
   - Crear jornada de prueba
   - Crear evaluación asociada a jornada

---

## 📞 Soporte

Si encuentras errores durante la migración:

1. **Error de FK:** Verificar que las tablas referenciadas existen
2. **UUID no válido:** Copiar UUID completo sin espacios
3. **Constraint violation:** Verificar que no haya duplicados

**Rollback:** Si algo sale mal, restaurar desde el backup inicial.

---

## ✅ Checklist de Ejecución

- [ ] Backup de base de datos creado
- [ ] PASO 1: Clientes adicionales creados
- [ ] PASO 2: UUIDs de clientes copiados
- [ ] PASO 3: Tabla programas creada + 4 programas insertados
- [ ] PASO 4: UUIDs de programas copiados
- [ ] PASO 5: Tabla jornadas creada
- [ ] PASO 6: Tabla pacientes migrada (programa_id agregado)
- [ ] PASO 7: Tabla evaluaciones migrada (jornada_id agregado)
- [ ] PASO 8: Tabla historias_clinicas migrada (jornada_id agregado)
- [ ] Verificaciones ejecutadas (todos los SELECTs al final de cada archivo)
- [ ] Migración completada exitosamente ✅

---

**Fecha de creación:** Mayo 13, 2026  
**Versión:** 1.0
