-- ============================================================================
-- TABLA JORNADAS
-- Registro de jornadas de salud en sedes con programas específicos
-- Fecha: Mayo 13, 2026
-- ============================================================================

-- PREREQUISITO: Ejecutar programas-schema.sql PRIMERO

-- ============================================================================
-- 1. CREAR TABLA JORNADAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS jornadas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    programa_id uuid NOT NULL,
    sede_id uuid,
    fecha date NOT NULL,
    responsable_jornada text,
    descripcion text,
    activa boolean DEFAULT true,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW(),
    
    -- Foreign Keys
    CONSTRAINT fk_jornadas_programa FOREIGN KEY (programa_id) 
        REFERENCES programas(id) ON DELETE CASCADE,
    CONSTRAINT fk_jornadas_sede FOREIGN KEY (sede_id) 
        REFERENCES sedes(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_jornadas_programa_id ON jornadas(programa_id);
CREATE INDEX idx_jornadas_sede_id ON jornadas(sede_id);
CREATE INDEX idx_jornadas_fecha ON jornadas(fecha);
CREATE INDEX idx_jornadas_activa ON jornadas(activa);

-- Índice compuesto para búsquedas frecuentes
CREATE INDEX idx_jornadas_programa_fecha ON jornadas(programa_id, fecha);
CREATE INDEX idx_jornadas_sede_fecha ON jornadas(sede_id, fecha);

-- Comentarios
COMMENT ON TABLE jornadas IS 'Jornadas de salud realizadas en sedes con programas específicos';
COMMENT ON COLUMN jornadas.programa_id IS 'Programa de salud ejecutado en la jornada';
COMMENT ON COLUMN jornadas.sede_id IS 'Sede donde se realizó la jornada (nullable para jornadas virtuales)';
COMMENT ON COLUMN jornadas.fecha IS 'Fecha de realización de la jornada';
COMMENT ON COLUMN jornadas.responsable_jornada IS 'Nombre del responsable/coordinador de la jornada';
COMMENT ON COLUMN jornadas.descripcion IS 'Descripción o notas adicionales de la jornada';
COMMENT ON COLUMN jornadas.activa IS 'Estado de la jornada (activa/inactiva)';

-- ============================================================================
-- 2. VERIFICACIÓN
-- ============================================================================

-- Verificar estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'jornadas'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. EJEMPLO DE JORNADAS DEMO (Opcional)
-- ============================================================================

/*
-- Crear jornada de ejemplo para Coca-Cola en Bogotá Norte
-- NOTA: Reemplazar UUIDs con valores reales

INSERT INTO jornadas (
    programa_id,
    sede_id,
    fecha,
    responsable_jornada,
    descripcion,
    activa
) VALUES (
    'UUID_PROGRAMA_COCA_COLA', -- Reemplazar
    'UUID_SEDE_BOGOTA_NORTE',  -- Reemplazar
    '2026-05-12',
    'Dra. María González',
    'Jornada de tamizaje cardiovascular y salud mental',
    true
);
*/

-- ============================================================================
-- 4. QUERIES ÚTILES PARA JORNADAS
-- ============================================================================

-- Ver jornadas con información completa
/*
SELECT 
    j.id,
    j.fecha,
    p.nombre AS programa,
    c.nombre_comercial AS cliente,
    s.nombre AS sede,
    s.ciudad,
    j.responsable_jornada,
    j.descripcion,
    j.activa
FROM jornadas j
INNER JOIN programas p ON j.programa_id = p.id
INNER JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN sedes s ON j.sede_id = s.id
ORDER BY j.fecha DESC;
*/

-- Contar jornadas por programa
/*
SELECT 
    p.nombre AS programa,
    COUNT(j.id) AS total_jornadas
FROM programas p
LEFT JOIN jornadas j ON p.id = j.programa_id
GROUP BY p.nombre
ORDER BY total_jornadas DESC;
*/

-- Jornadas por sede
/*
SELECT 
    s.nombre AS sede,
    s.ciudad,
    COUNT(j.id) AS total_jornadas
FROM sedes s
LEFT JOIN jornadas j ON s.id = j.sede_id
GROUP BY s.nombre, s.ciudad
ORDER BY total_jornadas DESC;
*/
