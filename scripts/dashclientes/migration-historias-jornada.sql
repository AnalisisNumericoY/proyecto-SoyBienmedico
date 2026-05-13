-- ============================================================================
-- MIGRACIÓN: Agregar jornada_id a tabla HISTORIAS_CLINICAS
-- Asociar historias clínicas a jornadas específicas
-- Fecha: Mayo 13, 2026
-- ============================================================================

-- PREREQUISITO: Ejecutar jornadas-schema.sql PRIMERO

-- ============================================================================
-- 1. AGREGAR COLUMNA jornada_id
-- ============================================================================

-- Agregar nueva columna (nullable porque historias existentes no tienen jornada)
ALTER TABLE historias_clinicas 
ADD COLUMN IF NOT EXISTS jornada_id uuid;

-- Agregar foreign key constraint
ALTER TABLE historias_clinicas
ADD CONSTRAINT fk_historias_jornada 
FOREIGN KEY (jornada_id) REFERENCES jornadas(id) ON DELETE SET NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_historias_jornada_id ON historias_clinicas(jornada_id);

-- Comentarios
COMMENT ON COLUMN historias_clinicas.jornada_id IS 'Jornada en la que se realizó la historia clínica (null si es consulta individual)';

-- ============================================================================
-- 2. VERIFICACIÓN
-- ============================================================================

-- Ver estructura actualizada
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'historias_clinicas'
  AND column_name IN ('id', 'paciente_id', 'medico_id', 'jornada_id', 'fecha_consulta')
ORDER BY ordinal_position;

-- Contar historias clínicas existentes SIN jornada
SELECT 
    COUNT(*) AS total_sin_jornada
FROM historias_clinicas
WHERE jornada_id IS NULL;

-- ============================================================================
-- 3. QUERIES ÚTILES
-- ============================================================================

-- KPIs por jornada (incluyendo historias clínicas)
/*
SELECT 
    j.fecha,
    p.nombre AS programa,
    s.nombre AS sede,
    COUNT(DISTINCT e.id) AS total_evaluaciones,
    COUNT(DISTINCT hc.id) AS total_historias_clinicas,
    COUNT(DISTINCT COALESCE(e.paciente_id, hc.paciente_id)) AS pacientes_atendidos
FROM jornadas j
INNER JOIN programas p ON j.programa_id = p.id
LEFT JOIN sedes s ON j.sede_id = s.id
LEFT JOIN evaluaciones e ON j.id = e.jornada_id
LEFT JOIN historias_clinicas hc ON j.id = hc.jornada_id
GROUP BY j.fecha, p.nombre, s.nombre
ORDER BY j.fecha DESC;
*/

-- Historias clínicas de una jornada específica
/*
SELECT 
    hc.id,
    hc.fecha_consulta,
    pac.nombre || ' ' || pac.apellidos AS paciente,
    med.nombre AS medico,
    hc.diagnostico_principal,
    hc.pdf_path
FROM historias_clinicas hc
INNER JOIN pacientes pac ON hc.paciente_id = pac.id
INNER JOIN medicos med ON hc.medico_id = med.id
WHERE hc.jornada_id = 'UUID_JORNADA'
ORDER BY hc.fecha_consulta DESC;
*/

-- NOTA: Las historias clínicas suelen ser consultas individuales,
-- NO necesariamente parte de jornadas de tamizaje.
-- Usar jornada_id solo cuando aplique (ej: brigadas de salud con médico)
