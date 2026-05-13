-- ============================================================================
-- MIGRACIÓN: Agregar programa_id a tabla PACIENTES
-- Normalizar campo 'programa' de texto libre a relación FK
-- Fecha: Mayo 13, 2026
-- ============================================================================

-- PREREQUISITO: Ejecutar programas-schema.sql PRIMERO

-- ============================================================================
-- 1. AGREGAR COLUMNA programa_id
-- ============================================================================

-- Agregar nueva columna (nullable inicialmente para migración)
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS programa_id uuid;

-- Agregar foreign key constraint
ALTER TABLE pacientes
ADD CONSTRAINT fk_pacientes_programa 
FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE SET NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_pacientes_programa_id ON pacientes(programa_id);

-- ============================================================================
-- 2. MIGRACIÓN DE DATOS EXISTENTES
-- ============================================================================

-- PASO PREVIO: Obtener UUID del programa "Coca Cola saludable"
-- Ejecutar primero:
/*
SELECT id, nombre FROM programas WHERE nombre = 'Coca Cola saludable';
*/

-- ⚠️ IMPORTANTE: Reemplazar 'UUID_COCA_COLA_SALUDABLE' con el UUID real

-- Normalizar "Coca-cola" → "Coca Cola saludable"
UPDATE pacientes
SET programa_id = 'UUID_COCA_COLA_SALUDABLE' -- ⚠️ Reemplazar
WHERE LOWER(programa) LIKE '%coca%cola%'
  AND programa_id IS NULL;

-- ============================================================================
-- 3. VERIFICACIÓN DE MIGRACIÓN
-- ============================================================================

-- Ver distribución de pacientes por programa (antes de migración)
SELECT 
    programa AS programa_texto_antiguo,
    COUNT(*) AS total_pacientes
FROM pacientes
WHERE programa IS NOT NULL
GROUP BY programa
ORDER BY total_pacientes DESC;

-- Ver pacientes migrados con información del programa
SELECT 
    pac.id,
    pac.nombre,
    pac.apellidos,
    pac.programa AS programa_texto_antiguo,
    prog.nombre AS programa_nuevo,
    c.nombre_comercial AS cliente
FROM pacientes pac
LEFT JOIN programas prog ON pac.programa_id = prog.id
LEFT JOIN clientes c ON prog.cliente_id = c.id
WHERE pac.programa_id IS NOT NULL
ORDER BY pac.created_at DESC
LIMIT 20;

-- Contar pacientes por programa normalizado
SELECT 
    prog.nombre AS programa,
    c.nombre_comercial AS cliente,
    COUNT(pac.id) AS total_pacientes
FROM programas prog
INNER JOIN clientes c ON prog.cliente_id = c.id
LEFT JOIN pacientes pac ON prog.id = pac.programa_id
GROUP BY prog.nombre, c.nombre_comercial
ORDER BY total_pacientes DESC;

-- Identificar pacientes SIN programa asignado
SELECT 
    id,
    nombre,
    apellidos,
    programa AS programa_texto,
    created_at
FROM pacientes
WHERE programa_id IS NULL
ORDER BY created_at DESC;

-- ============================================================================
-- 4. LIMPIEZA (Opcional - CUIDADO)
-- ============================================================================

-- OPCIONAL: Una vez verificada la migración, puedes considerar hacer
-- el campo programa_id obligatorio para nuevos pacientes

-- DESCOMENTAR SOLO DESPUÉS DE VERIFICAR QUE TODOS LOS PACIENTES TIENEN programa_id
/*
ALTER TABLE pacientes
ALTER COLUMN programa_id SET NOT NULL;
*/

-- NOTA: El campo 'programa' (texto) se mantiene para referencia histórica
-- pero ya NO se debe usar en formularios (usar programa_id en su lugar)

-- ============================================================================
-- 5. QUERIES ÚTILES POST-MIGRACIÓN
-- ============================================================================

-- Pacientes de un programa específico
/*
SELECT 
    pac.id,
    pac.nombre,
    pac.apellidos,
    pac.numero_documento,
    pac.email,
    prog.nombre AS programa
FROM pacientes pac
INNER JOIN programas prog ON pac.programa_id = prog.id
WHERE prog.nombre = 'Coca Cola saludable'
ORDER BY pac.apellidos, pac.nombre;
*/

-- Pacientes de un cliente específico
/*
SELECT 
    pac.id,
    pac.nombre,
    pac.apellidos,
    prog.nombre AS programa,
    c.nombre_comercial AS cliente
FROM pacientes pac
INNER JOIN programas prog ON pac.programa_id = prog.id
INNER JOIN clientes c ON prog.cliente_id = c.id
WHERE c.nombre = 'coca-cola'
ORDER BY pac.created_at DESC;
*/

-- Estadísticas de programas
/*
SELECT 
    c.nombre_comercial AS cliente,
    prog.nombre AS programa,
    prog.tipo,
    COUNT(pac.id) AS total_pacientes,
    COUNT(CASE WHEN pac.active = true THEN 1 END) AS pacientes_activos
FROM programas prog
INNER JOIN clientes c ON prog.cliente_id = c.id
LEFT JOIN pacientes pac ON prog.id = pac.programa_id
GROUP BY c.nombre_comercial, prog.nombre, prog.tipo
ORDER BY total_pacientes DESC;
*/
