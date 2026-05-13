-- ============================================================================
-- CLIENTES ADICIONALES
-- Agregar 3 nuevos clientes corporativos a la tabla clientes
-- Fecha: Mayo 13, 2026
-- ============================================================================

-- NOTA: Ejecutar DESPUÉS de dashclientes-schema-v1.sql

-- 1. ALCALDÍA DE SABANETA
INSERT INTO clientes (
    nombre,
    nombre_comercial,
    nit,
    color_hex,
    logo_url,
    contacto_nombre,
    contacto_cargo,
    contacto_email,
    contacto_telefono,
    industria,
    objetivo_colaboradores,
    activo,
    es_cliente_prueba
) VALUES (
    'sabaneta',
    'Alcaldía de Sabaneta',
    '000.000.000-0',
    '#28a745',
    NULL,
    'Por definir',
    'Coordinador de Salud',
    'salud@sabaneta.gov.co',
    '(604) 000-0000',
    'Gobierno',
    1000,
    true,
    false
);

-- 2. ALCALDÍA DE ENVIGADO
INSERT INTO clientes (
    nombre,
    nombre_comercial,
    nit,
    color_hex,
    logo_url,
    contacto_nombre,
    contacto_cargo,
    contacto_email,
    contacto_telefono,
    industria,
    objetivo_colaboradores,
    activo,
    es_cliente_prueba
) VALUES (
    'envigado',
    'Alcaldía de Envigado',
    '000.000.000-0',
    '#17a2b8',
    NULL,
    'Por definir',
    'Coordinador de Salud',
    'salud@envigado.gov.co',
    '(604) 000-0000',
    'Gobierno',
    1000,
    true,
    false
);

-- 3. SAVIA SALUD EPS
INSERT INTO clientes (
    nombre,
    nombre_comercial,
    nit,
    color_hex,
    logo_url,
    contacto_nombre,
    contacto_cargo,
    contacto_email,
    contacto_telefono,
    industria,
    objetivo_colaboradores,
    activo,
    es_cliente_prueba
) VALUES (
    'savia-salud',
    'Savia Salud EPS',
    '000.000.000-0',
    '#20c997',
    NULL,
    'Por definir',
    'Director de Promoción y Prevención',
    'prevencion@saviasalud.com',
    '(601) 000-0000',
    'Salud',
    1000,
    true,
    false
);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que se insertaron correctamente
SELECT 
    nombre,
    nombre_comercial,
    color_hex,
    industria,
    objetivo_colaboradores
FROM clientes
WHERE nombre IN ('sabaneta', 'envigado', 'savia-salud')
ORDER BY nombre;

-- Debería retornar 3 registros

-- ============================================================================
-- OBTENER UUIDs PARA PROGRAMAS
-- ============================================================================

-- Ejecutar esto para obtener los UUIDs que necesitarás en programas-schema.sql
SELECT 
    id,
    nombre,
    nombre_comercial
FROM clientes
WHERE nombre IN ('coca-cola', 'sabaneta', 'envigado', 'savia-salud')
ORDER BY nombre;
