-- ============================================
-- SCRIPT DE CORRECCIONES POST-MIGRACIÓN
-- ============================================

-- 1. Agregar columna faltante en mediciones_temporales
ALTER TABLE mediciones_temporales 
ADD COLUMN IF NOT EXISTS recibido_en TIMESTAMPTZ;

-- 2. Limpiar tablas para re-intentar migración
-- (Mantener capsulas, pacientes, medicos que ya están bien)

DELETE FROM mediciones_temporales;
DELETE FROM sesiones_medicion;
DELETE FROM historias_clinicas;
DELETE FROM evaluaciones;
DELETE FROM citas;
DELETE FROM users;

-- ============================================
-- NOTA: Después de ejecutar esto, vuelve a ejecutar:
-- node scripts/migrate-to-supabase.js
-- ============================================
