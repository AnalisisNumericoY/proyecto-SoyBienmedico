-- ============================================================================
-- TABLA PROGRAMAS
-- Definición de programas de salud asociados a clientes corporativos
-- Fecha: Mayo 13, 2026
-- ============================================================================

-- PREREQUISITO: Ejecutar clientes-adicionales.sql PRIMERO
-- IMPORTANTE: Reemplazar los UUIDs con los valores reales de tu base de datos

-- ============================================================================
-- 1. CREAR TABLA PROGRAMAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS programas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id uuid NOT NULL,
    nombre text NOT NULL,
    tipo text NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW(),
    
    -- Foreign Key
    CONSTRAINT fk_programas_cliente FOREIGN KEY (cliente_id) 
        REFERENCES clientes(id) ON DELETE CASCADE,
    
    -- Constraint: nombre único por cliente
    CONSTRAINT uq_programa_nombre_cliente UNIQUE (cliente_id, nombre)
);

-- Índices
CREATE INDEX idx_programas_cliente_id ON programas(cliente_id);
CREATE INDEX idx_programas_activo ON programas(activo);
CREATE INDEX idx_programas_nombre ON programas(nombre);

-- Comentarios
COMMENT ON TABLE programas IS 'Programas de salud asociados a clientes corporativos';
COMMENT ON COLUMN programas.cliente_id IS 'Cliente al que pertenece el programa';
COMMENT ON COLUMN programas.nombre IS 'Nombre del programa (ej: Coca Cola saludable)';
COMMENT ON COLUMN programas.tipo IS 'Servicios incluidos en el programa';
COMMENT ON COLUMN programas.activo IS 'Estado del programa';

-- ============================================================================
-- 2. INSERTAR PROGRAMAS
-- ============================================================================

-- PASO PREVIO: Obtener UUIDs de clientes ejecutando este query:
/*
SELECT id, nombre, nombre_comercial 
FROM clientes 
WHERE nombre IN ('coca-cola', 'sabaneta', 'envigado', 'savia-salud')
ORDER BY nombre;
*/

-- ⚠️ IMPORTANTE: Reemplaza estos UUIDs con los valores REALES de tu base de datos

-- Variables para UUIDs (reemplazar con valores reales)
-- Coca-Cola UUID: f7dbcec1-9bab-4e9b-a83d-a96d26ae2f77 (ya conocido)
-- Sabaneta UUID: OBTENER_DE_BASE_DE_DATOS
-- Envigado UUID: OBTENER_DE_BASE_DE_DATOS
-- Savia Salud UUID: OBTENER_DE_BASE_DE_DATOS

-- 1. Coca Cola saludable
INSERT INTO programas (
    cliente_id,
    nombre,
    tipo,
    activo
) VALUES (
    'f7dbcec1-9bab-4e9b-a83d-a96d26ae2f77', -- Coca-Cola (UUID conocido)
    'Coca Cola saludable',
    'riesgo cardiovascular y salud mental',
    true
);

-- 2. Sabaneta saludable
INSERT INTO programas (
    cliente_id,
    nombre,
    tipo,
    activo
) VALUES (
    'REEMPLAZAR_CON_UUID_SABANETA', -- ⚠️ Reemplazar
    'Sabaneta saludable',
    'riesgo cardiovascular y salud mental',
    true
);

-- 3. Mi barrio Envigado
INSERT INTO programas (
    cliente_id,
    nombre,
    tipo,
    activo
) VALUES (
    'REEMPLAZAR_CON_UUID_ENVIGADO', -- ⚠️ Reemplazar
    'Mi barrio Envigado',
    'salud sexual y riesgo cardiovascular',
    true
);

-- 4. Savia me cuida
INSERT INTO programas (
    cliente_id,
    nombre,
    tipo,
    activo
) VALUES (
    'REEMPLAZAR_CON_UUID_SAVIA', -- ⚠️ Reemplazar
    'Savia me cuida',
    'riesgo cardiovascular y atención en general',
    true
);

-- ============================================================================
-- 3. VERIFICACIÓN
-- ============================================================================

-- Verificar programas creados con información del cliente
SELECT 
    p.id,
    p.nombre AS programa,
    p.tipo,
    c.nombre_comercial AS cliente,
    c.color_hex,
    p.activo
FROM programas p
INNER JOIN clientes c ON p.cliente_id = c.id
ORDER BY c.nombre_comercial, p.nombre;

-- Debería retornar 4 programas

-- Contar programas por cliente
SELECT 
    c.nombre_comercial AS cliente,
    COUNT(p.id) AS total_programas
FROM clientes c
LEFT JOIN programas p ON c.id = p.cliente_id
WHERE c.nombre IN ('coca-cola', 'sabaneta', 'envigado', 'savia-salud')
GROUP BY c.nombre_comercial
ORDER BY c.nombre_comercial;

-- ============================================================================
-- 4. OBTENER UUIDs DE PROGRAMAS PARA SIGUIENTE PASO
-- ============================================================================

-- Ejecutar para obtener los UUIDs de programas (para usar en jornadas)
SELECT 
    id,
    nombre,
    tipo
FROM programas
ORDER BY nombre;
