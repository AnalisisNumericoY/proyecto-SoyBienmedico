-- ============================================
-- SCRIPT DE CREACIÓN DE TABLAS SUPABASE
-- Proyecto: SoyBienmedico
-- Fecha: Mayo 8, 2026
-- ============================================

-- 1. TABLA USERS (Autenticación)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'medico', 'paciente')),
  email TEXT,
  medico_id TEXT,
  paciente_id TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_medico_id ON users(medico_id);
CREATE INDEX idx_users_paciente_id ON users(paciente_id);

-- ============================================

-- 2. TABLA PACIENTES
CREATE TABLE IF NOT EXISTS pacientes (
  id TEXT PRIMARY KEY,
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  tipo_documento TEXT,
  numero_documento TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  sexo TEXT CHECK (sexo IN ('hombre', 'mujer', 'otro')),
  fecha_nacimiento DATE,
  ocupacion TEXT,
  telefono TEXT,
  estado_civil TEXT,
  email TEXT,
  eps TEXT,
  regimen_salud TEXT,
  direccion TEXT,
  barrio TEXT,
  rh TEXT,
  programa TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_pacientes_numero_documento ON pacientes(numero_documento);
CREATE INDEX idx_pacientes_programa ON pacientes(programa);
CREATE INDEX idx_pacientes_email ON pacientes(email);

-- ============================================

-- 3. TABLA MEDICOS
CREATE TABLE IF NOT EXISTS medicos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  identificacion TEXT UNIQUE NOT NULL,
  registro_medico TEXT,
  correo_electronico TEXT,
  telefono TEXT,
  especialidad TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_medicos_identificacion ON medicos(identificacion);
CREATE INDEX idx_medicos_especialidad ON medicos(especialidad);

-- ============================================

-- 4. TABLA CITAS
CREATE TABLE IF NOT EXISTS citas (
  id TEXT PRIMARY KEY,
  paciente_id TEXT NOT NULL,
  medico_id TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado TEXT CHECK (estado IN ('programada', 'completada', 'cancelada', 'en_curso')),
  motivo TEXT,
  room_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT fk_citas_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_citas_medico FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_citas_paciente_id ON citas(paciente_id);
CREATE INDEX idx_citas_medico_id ON citas(medico_id);
CREATE INDEX idx_citas_fecha ON citas(fecha);
CREATE INDEX idx_citas_estado ON citas(estado);

-- ============================================

-- 5. TABLA EVALUACIONES
CREATE TABLE IF NOT EXISTS evaluaciones (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('riesgo_cardiovascular', 'hads', 'burnout')),
  paciente_id TEXT NOT NULL,
  sesion_id TEXT,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  datos_entrada JSONB,
  resultado JSONB,
  pdf_path TEXT,
  creado_por TEXT,
  version_algoritmo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Key
  CONSTRAINT fk_evaluaciones_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_evaluaciones_paciente_id ON evaluaciones(paciente_id);
CREATE INDEX idx_evaluaciones_tipo ON evaluaciones(tipo);
CREATE INDEX idx_evaluaciones_fecha ON evaluaciones(fecha);

-- ============================================

-- 6. TABLA HISTORIAS_CLINICAS
CREATE TABLE IF NOT EXISTS historias_clinicas (
  id TEXT PRIMARY KEY,
  cita_id TEXT,
  paciente_id TEXT NOT NULL,
  medico_id TEXT NOT NULL,
  fecha_consulta TIMESTAMPTZ DEFAULT NOW(),
  
  -- Información clínica
  motivo_consulta TEXT,
  sintomas_actuales TEXT,
  tiempo_evolucion TEXT,
  intensidad_dolor TEXT,
  
  -- Signos vitales
  presion_arterial TEXT,
  frecuencia_cardiaca INTEGER,
  temperatura DECIMAL(4,2),
  saturacion_oxigeno INTEGER,
  
  -- Diagnóstico y tratamiento
  examen_fisico TEXT,
  diagnostico_principal TEXT,
  diagnostico_secundario TEXT,
  medicamentos TEXT,
  recomendaciones TEXT,
  
  -- Seguimiento
  proxima_consulta TEXT,
  examenes TEXT,
  
  -- Datos heredados (compatibilidad)
  registro_medico_doctor TEXT,
  datos_paciente JSONB,
  consulta JSONB,
  
  pdf_path TEXT,
  firma_medico TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT fk_historias_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_historias_medico FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE,
  CONSTRAINT fk_historias_cita FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_historias_paciente_id ON historias_clinicas(paciente_id);
CREATE INDEX idx_historias_medico_id ON historias_clinicas(medico_id);
CREATE INDEX idx_historias_cita_id ON historias_clinicas(cita_id);
CREATE INDEX idx_historias_fecha ON historias_clinicas(fecha_consulta);

-- ============================================

-- 7. TABLA CAPSULAS (IoT)
CREATE TABLE IF NOT EXISTS capsulas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  ubicacion TEXT,
  dispositivos TEXT[],
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_capsulas_activa ON capsulas(activa);

-- ============================================

-- 8. TABLA SESIONES_MEDICION (IoT)
CREATE TABLE IF NOT EXISTS sesiones_medicion (
  id TEXT PRIMARY KEY,
  capsula_id TEXT NOT NULL,
  paciente_id TEXT,
  numero_documento TEXT,
  tipo_sesion TEXT,
  estado TEXT CHECK (estado IN ('activa', 'finalizada', 'cancelada')),
  inicio TIMESTAMPTZ DEFAULT NOW(),
  fin TIMESTAMPTZ,
  mediciones_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT fk_sesiones_capsula FOREIGN KEY (capsula_id) REFERENCES capsulas(id) ON DELETE CASCADE,
  CONSTRAINT fk_sesiones_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_sesiones_capsula_id ON sesiones_medicion(capsula_id);
CREATE INDEX idx_sesiones_paciente_id ON sesiones_medicion(paciente_id);
CREATE INDEX idx_sesiones_estado ON sesiones_medicion(estado);
CREATE INDEX idx_sesiones_inicio ON sesiones_medicion(inicio);

-- ============================================

-- 9. TABLA MEDICIONES_TEMPORALES (IoT)
CREATE TABLE IF NOT EXISTS mediciones_temporales (
  id TEXT PRIMARY KEY,
  paciente_id TEXT,
  numero_documento TEXT,
  sesion_id TEXT,
  capsula_id TEXT,
  dispositivo TEXT,
  dispositivo_id TEXT,
  mediciones JSONB,
  datos_originales JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  procesado BOOLEAN DEFAULT false,
  origen TEXT,
  sin_sesion BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT fk_mediciones_sesion FOREIGN KEY (sesion_id) REFERENCES sesiones_medicion(id) ON DELETE CASCADE,
  CONSTRAINT fk_mediciones_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE SET NULL,
  CONSTRAINT fk_mediciones_capsula FOREIGN KEY (capsula_id) REFERENCES capsulas(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_mediciones_sesion_id ON mediciones_temporales(sesion_id);
CREATE INDEX idx_mediciones_paciente_id ON mediciones_temporales(paciente_id);
CREATE INDEX idx_mediciones_capsula_id ON mediciones_temporales(capsula_id);
CREATE INDEX idx_mediciones_timestamp ON mediciones_temporales(timestamp);
CREATE INDEX idx_mediciones_dispositivo ON mediciones_temporales(dispositivo);

-- ============================================

-- ROW LEVEL SECURITY (RLS) - Configuración básica
-- Habilitar RLS en todas las tablas

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE historias_clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE capsulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_medicion ENABLE ROW LEVEL SECURITY;
ALTER TABLE mediciones_temporales ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de acceso (por ahora permisivas para el service_role)
-- Nota: Estas políticas permiten acceso completo desde el backend con service_role key

CREATE POLICY "Enable all access for service role" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON pacientes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON medicos
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON citas
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON evaluaciones
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON historias_clinicas
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON capsulas
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON sesiones_medicion
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON mediciones_temporales
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================

-- VISTAS ÚTILES PARA CONSULTAS

-- Vista: Pacientes con sus usuarios
CREATE OR REPLACE VIEW vista_pacientes_completos AS
SELECT 
  p.*,
  u.username,
  u.email as email_login,
  u.active as login_activo
FROM pacientes p
LEFT JOIN users u ON u.paciente_id = p.id;

-- Vista: Médicos con sus usuarios
CREATE OR REPLACE VIEW vista_medicos_completos AS
SELECT 
  m.*,
  u.username,
  u.email as email_login,
  u.active as login_activo
FROM medicos m
LEFT JOIN users u ON u.medico_id = m.id;

-- Vista: Citas con información completa
CREATE OR REPLACE VIEW vista_citas_completas AS
SELECT 
  c.*,
  p.nombre || ' ' || p.apellidos as paciente_nombre,
  p.numero_documento as paciente_documento,
  m.nombre as medico_nombre,
  m.especialidad as medico_especialidad
FROM citas c
LEFT JOIN pacientes p ON p.id = c.paciente_id
LEFT JOIN medicos m ON m.id = c.medico_id;

-- ============================================

COMMENT ON TABLE users IS 'Usuarios del sistema con autenticación';
COMMENT ON TABLE pacientes IS 'Información de pacientes registrados';
COMMENT ON TABLE medicos IS 'Información de médicos';
COMMENT ON TABLE citas IS 'Programación de citas médicas';
COMMENT ON TABLE evaluaciones IS 'Evaluaciones médicas (HADS, Riesgo Cardiovascular)';
COMMENT ON TABLE historias_clinicas IS 'Historias clínicas de videoconsultas';
COMMENT ON TABLE capsulas IS 'Cápsulas de salud con dispositivos IoT';
COMMENT ON TABLE sesiones_medicion IS 'Sesiones de medición IoT';
COMMENT ON TABLE mediciones_temporales IS 'Mediciones temporales de dispositivos IoT';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
