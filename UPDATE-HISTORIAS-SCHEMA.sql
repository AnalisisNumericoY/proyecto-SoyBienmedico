-- Script SQL para actualizar la tabla historias_clinicas
-- Ejecutar en Supabase Dashboard → SQL Editor

-- 1. Primero, verificar columnas existentes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'historias_clinicas'
ORDER BY ordinal_position;

-- 2. Agregar las nuevas columnas que coinciden con el formulario de videoconsulta
-- (Si ya existen algunas, ignorar los errores de "column already exists")

ALTER TABLE historias_clinicas 
ADD COLUMN IF NOT EXISTS objeto_teleorientacion TEXT,
ADD COLUMN IF NOT EXISTS antecedentes TEXT,
ADD COLUMN IF NOT EXISTS tabaquismo VARCHAR(20),
ADD COLUMN IF NOT EXISTS presion_sistolica INTEGER,
ADD COLUMN IF NOT EXISTS presion_diastolica INTEGER,
ADD COLUMN IF NOT EXISTS peso DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS talla INTEGER,
ADD COLUMN IF NOT EXISTS actividad_fisica VARCHAR(100),
ADD COLUMN IF NOT EXISTS oximetria DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS glucometria DECIMAL(5,1),
ADD COLUMN IF NOT EXISTS descripcion_general TEXT,
ADD COLUMN IF NOT EXISTS conducta TEXT,
ADD COLUMN IF NOT EXISTS especialidad_requerida VARCHAR(100);

-- 3. Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'historias_clinicas'
ORDER BY ordinal_position;

-- 4. (OPCIONAL) Si quieres eliminar columnas antiguas que ya no se usan:
-- CUIDADO: Esto eliminará datos existentes. Solo ejecutar si estás seguro.
-- Descomentar solo las que NO necesites:

-- ALTER TABLE historias_clinicas DROP COLUMN IF EXISTS sintomas_actuales;
-- ALTER TABLE historias_clinicas DROP COLUMN IF EXISTS tiempo_evolucion;
-- ALTER TABLE historias_clinicas DROP COLUMN IF EXISTS intensidad_dolor;
-- ALTER TABLE historias_clinicas DROP COLUMN IF EXISTS presion_arterial;
-- ALTER TABLE historias_clinicas DROP COLUMN IF EXISTS temperatura;
-- ALTER TABLE historias_clinicas DROP COLUMN IF EXISTS saturacion_oxigeno;
-- ALTER TABLE historias_clinicas DROP COLUMN IF EXISTS examen_fisico;
-- ALTER TABLE historias_clinicas DROP COLUMN IF EXISTS diagnostico_principal;
-- ALTER TABLE historias_clinicas DROP COLUMN IF EXISTS diagnostico_secundario;
-- ALTER TABLE historias_clinicas DROP COLUMN IF EXISTS medicamentos;
-- ALTER TABLE historias_clinicas DROP COLUMN IF EXISTS recomendaciones;
-- ALTER TABLE historias_clinicas DROP COLUMN IF EXISTS proxima_consulta;
-- ALTER TABLE historias_clinicas DROP COLUMN IF EXISTS examenes;

-- 5. Verificar estructura final
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'historias_clinicas'
ORDER BY ordinal_position;
