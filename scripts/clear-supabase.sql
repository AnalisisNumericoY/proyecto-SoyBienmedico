-- ============================================
-- LIMPIEZA COMPLETA DE SUPABASE
-- Ejecuta esto antes de re-migrar
-- ============================================

-- Eliminar en orden inverso a las Foreign Keys

DELETE FROM mediciones_temporales;
DELETE FROM sesiones_medicion;
DELETE FROM historias_clinicas;
DELETE FROM evaluaciones;
DELETE FROM citas;
DELETE FROM users;
DELETE FROM pacientes;
DELETE FROM medicos;
DELETE FROM capsulas;

-- Verificar que todas las tablas están vacías
SELECT 'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'pacientes', COUNT(*) FROM pacientes
UNION ALL
SELECT 'medicos', COUNT(*) FROM medicos
UNION ALL
SELECT 'citas', COUNT(*) FROM citas
UNION ALL
SELECT 'evaluaciones', COUNT(*) FROM evaluaciones
UNION ALL
SELECT 'historias_clinicas', COUNT(*) FROM historias_clinicas
UNION ALL
SELECT 'capsulas', COUNT(*) FROM capsulas
UNION ALL
SELECT 'sesiones_medicion', COUNT(*) FROM sesiones_medicion
UNION ALL
SELECT 'mediciones_temporales', COUNT(*) FROM mediciones_temporales;

-- Todos deberían mostrar 0 registros
