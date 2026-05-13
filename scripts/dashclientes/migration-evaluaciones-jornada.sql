-- ============================================================================
-- MIGRACIÓN: Agregar jornada_id a tabla EVALUACIONES
-- Asociar evaluaciones a jornadas específicas
-- Fecha: Mayo 13, 2026
-- ============================================================================

-- PREREQUISITO: Ejecutar jornadas-schema.sql PRIMERO

-- ============================================================================
-- 1. AGREGAR COLUMNA jornada_id
-- ============================================================================

-- Agregar nueva columna (nullable porque evaluaciones existentes no tienen jornada)
ALTER TABLE evaluaciones 
ADD COLUMN IF NOT EXISTS jornada_id uuid;

-- Agregar foreign key constraint
ALTER TABLE evaluaciones
ADD CONSTRAINT fk_evaluaciones_jornada 
FOREIGN KEY (jornada_id) REFERENCES jornadas(id) ON DELETE SET NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_evaluaciones_jornada_id ON evaluaciones(jornada_id);

-- Índice compuesto para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_evaluaciones_jornada_tipo ON evaluaciones(jornada_id, tipo);

-- Comentarios
COMMENT ON COLUMN evaluaciones.jornada_id IS 'Jornada en la que se realizó la evaluación (null si es evaluación individual)';

-- ============================================================================
-- 2. VERIFICACIÓN
-- ============================================================================

-- Ver estructura actualizada
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'evaluaciones'
  AND column_name IN ('id', 'tipo', 'paciente_id', 'jornada_id', 'fecha')
ORDER BY ordinal_position;

-- Contar evaluaciones existentes SIN jornada
SELECT 
    tipo,
    COUNT(*) AS total_sin_jornada
FROM evaluaciones
WHERE jornada_id IS NULL
GROUP BY tipo
ORDER BY total_sin_jornada DESC;

-- ============================================================================
-- 3. MIGRACIÓN MANUAL (Post-creación de jornadas)
-- ============================================================================

-- NOTA: Las evaluaciones existentes quedarán con jornada_id = NULL
-- porque NO sabemos a qué jornada pertenecen retroactivamente.

-- OPCIÓN A: Crear jornadas retroactivas genéricas por fecha
-- Ejemplo: Crear una jornada "Histórica" por cada día que tiene evaluaciones

/*
-- Paso 1: Ver fechas con evaluaciones
SELECT DISTINCT DATE(fecha) AS fecha_evaluacion, COUNT(*) AS total
FROM evaluaciones
WHERE jornada_id IS NULL
GROUP BY DATE(fecha)
ORDER BY fecha_evaluacion DESC;

-- Paso 2: Crear jornada histórica para una fecha específica
-- (Reemplazar UUIDs y fecha)
INSERT INTO jornadas (
    programa_id,
    sede_id,
    fecha,
    responsable_jornada,
    descripcion,
    activa
) VALUES (
    'UUID_PROGRAMA_COCA_COLA', -- Reemplazar
    NULL, -- Sin sede (evaluaciones históricas)
    '2026-05-12', -- Fecha específica
    'Sistema',
    'Jornada histórica - Migración de datos',
    true
);

-- Paso 3: Asociar evaluaciones de esa fecha a la jornada creada
UPDATE evaluaciones
SET jornada_id = 'UUID_JORNADA_CREADA' -- UUID de la jornada recién creada
WHERE DATE(fecha) = '2026-05-12'
  AND jornada_id IS NULL;
*/

-- OPCIÓN B: Dejar evaluaciones históricas sin jornada
-- Las nuevas evaluaciones SÍ tendrán jornada_id asignada desde el formulario

-- ============================================================================
-- 4. QUERIES ÚTILES CON JORNADAS
-- ============================================================================

-- KPIs por jornada
/*
SELECT 
    j.fecha,
    j.descripcion,
    p.nombre AS programa,
    s.nombre AS sede,
    s.ciudad,
    COUNT(e.id) AS total_evaluaciones,
    COUNT(CASE WHEN e.tipo = 'riesgo_cardiovascular' THEN 1 END) AS eval_cv,
    COUNT(CASE WHEN e.tipo = 'hads' THEN 1 END) AS eval_hads
FROM jornadas j
INNER JOIN programas p ON j.programa_id = p.id
LEFT JOIN sedes s ON j.sede_id = s.id
LEFT JOIN evaluaciones e ON j.id = e.jornada_id
GROUP BY j.fecha, j.descripcion, p.nombre, s.nombre, s.ciudad
ORDER BY j.fecha DESC;
*/

-- Evaluaciones de una jornada específica
/*
SELECT 
    e.id,
    e.tipo,
    e.fecha,
    pac.nombre || ' ' || pac.apellidos AS paciente,
    e.resultado->>'categoria' AS resultado_categoria
FROM evaluaciones e
INNER JOIN pacientes pac ON e.paciente_id = pac.id
WHERE e.jornada_id = 'UUID_JORNADA'
ORDER BY e.fecha DESC;
*/

-- KPIs por sede (a través de jornadas)
/*
SELECT 
    s.nombre AS sede,
    s.ciudad,
    COUNT(DISTINCT j.id) AS total_jornadas,
    COUNT(e.id) AS total_evaluaciones,
    COUNT(CASE WHEN e.tipo = 'riesgo_cardiovascular' THEN 1 END) AS eval_cv,
    COUNT(CASE WHEN e.tipo = 'hads' THEN 1 END) AS eval_hads
FROM sedes s
LEFT JOIN jornadas j ON s.id = j.sede_id
LEFT JOIN evaluaciones e ON j.id = e.jornada_id
WHERE s.activa = true
GROUP BY s.nombre, s.ciudad
ORDER BY total_evaluaciones DESC;
*/

-- KPIs por programa (a través de jornadas)
/*
SELECT 
    p.nombre AS programa,
    c.nombre_comercial AS cliente,
    COUNT(DISTINCT j.id) AS total_jornadas,
    COUNT(e.id) AS total_evaluaciones,
    COUNT(CASE WHEN e.tipo = 'riesgo_cardiovascular' THEN 1 END) AS eval_cv,
    COUNT(CASE WHEN e.tipo = 'hads' THEN 1 END) AS eval_hads
FROM programas p
INNER JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN jornadas j ON p.id = j.programa_id
LEFT JOIN evaluaciones e ON j.id = e.jornada_id
GROUP BY p.nombre, c.nombre_comercial
ORDER BY total_evaluaciones DESC;
*/

-- ============================================================================
-- 5. VALIDACIÓN DE INTEGRIDAD
-- ============================================================================

-- Verificar que todas las jornadas_id existen
SELECT 
    e.id AS evaluacion_id,
    e.jornada_id,
    e.fecha
FROM evaluaciones e
WHERE e.jornada_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM jornadas j WHERE j.id = e.jornada_id
  );
-- Debería retornar 0 registros

-- Evaluaciones huérfanas (paciente no existe)
SELECT 
    e.id,
    e.paciente_id,
    e.tipo,
    e.fecha
FROM evaluaciones e
WHERE NOT EXISTS (
    SELECT 1 FROM pacientes p WHERE p.id = e.paciente_id
);
-- Debería retornar 0 registros
