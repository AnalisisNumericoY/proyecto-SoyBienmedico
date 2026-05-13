-- ============================================================================
-- DASHBOARD CLIENTES - SCHEMA V1
-- Fecha: 2026-05-12
-- Descripción: Tabla de clientes corporativos para dashboard empresarial
-- ============================================================================

-- Tabla: clientes
-- Almacena empresas/organizaciones que contratan servicios de SoyBienmedico
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  nombre text NOT NULL UNIQUE,                    -- nombre-clave: 'coca-cola', 'ecopetrol'
  nombre_comercial text NOT NULL,                 -- Coca-Cola FEMSA Colombia
  nit text,                                       -- NIT sin puntos: 860009578
  
  -- Branding
  color_hex text DEFAULT '#667eea',               -- Color para gráficas y UI
  logo_url text,                                  -- URL del logo en Supabase Storage
  
  -- Contacto principal
  contacto_nombre text,                           -- Juan Pérez
  contacto_cargo text,                            -- Director HSEQ
  contacto_email text,                            -- juan.perez@coca-cola.com
  contacto_telefono text,                         -- +57 300 123 4567
  
  -- Configuración
  industria text,                                 -- 'alimentos-bebidas', 'petroleo', 'salud'
  objetivo_colaboradores integer,                 -- Meta de trabajadores a tamizar
  
  -- Estado
  activo boolean DEFAULT true,
  es_cliente_prueba boolean DEFAULT false,        -- Cliente demo para testing
  
  -- Auditoría
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);

-- Comentarios
COMMENT ON TABLE clientes IS 'Empresas clientes que usan el dashboard corporativo';
COMMENT ON COLUMN clientes.nombre IS 'Nombre slug único (lowercase, sin espacios)';
COMMENT ON COLUMN clientes.color_hex IS 'Color principal para visualizaciones (formato #RRGGBB)';
