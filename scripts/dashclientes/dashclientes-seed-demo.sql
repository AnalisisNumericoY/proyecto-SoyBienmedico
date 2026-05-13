-- ============================================================================
-- DASHBOARD CLIENTES - SEED DATA (DEMO)
-- Fecha: 2026-05-12
-- Descripción: Datos de prueba - 3 clientes corporativos
-- ============================================================================

-- Insertar 3 clientes demo
INSERT INTO clientes (
  nombre,
  nombre_comercial,
  nit,
  color_hex,
  contacto_nombre,
  contacto_cargo,
  contacto_email,
  industria,
  objetivo_colaboradores,
  activo,
  es_cliente_prueba
) VALUES
  (
    'coca-cola',
    'Coca-Cola FEMSA Colombia',
    '860009578',
    '#E24B4A',
    'Juan Pérez Gómez',
    'Director Nacional HSEQ',
    'juan.perez@coca-cola.com',
    'alimentos-bebidas',
    9855,
    true,
    false
  ),
  (
    'ecopetrol',
    'Ecopetrol S.A.',
    '899999068',
    '#185FA5',
    'María González Castro',
    'Gerente Salud Ocupacional',
    'maria.gonzalez@ecopetrol.com.co',
    'petroleo-energia',
    15200,
    true,
    false
  ),
  (
    'postobon',
    'Postobón S.A.',
    '890903407',
    '#FAC775',
    'Carlos Ruiz Martínez',
    'Coordinador Bienestar Laboral',
    'carlos.ruiz@postobon.com',
    'alimentos-bebidas',
    6400,
    true,
    false
  )
ON CONFLICT (nombre) DO NOTHING;

-- Verificar inserción
SELECT 
  nombre,
  nombre_comercial,
  color_hex,
  contacto_nombre,
  activo
FROM clientes
ORDER BY created_at DESC;
