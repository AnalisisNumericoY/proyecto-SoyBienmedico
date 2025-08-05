// config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Database schema for Supabase
const createTables = async () => {
  try {
    // Users table
    await supabase.rpc('create_users_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) CHECK (role IN ('admin', 'medico', 'paciente')),
          email VARCHAR(100) UNIQUE NOT NULL,
          medico_id VARCHAR(50),
          paciente_id VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          active BOOLEAN DEFAULT true
        );
      `
    });

    // Medicos table
    await supabase.rpc('create_medicos_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS medicos (
          id VARCHAR(50) PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          identificacion VARCHAR(50) UNIQUE NOT NULL,
          registro_medico VARCHAR(50) UNIQUE NOT NULL,
          correo_electronico VARCHAR(100) NOT NULL,
          telefono VARCHAR(20),
          especialidad VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          active BOOLEAN DEFAULT true
        );
      `
    });

    // Pacientes table
    await supabase.rpc('create_pacientes_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS pacientes (
          id VARCHAR(50) PRIMARY KEY,
          fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          tipo_documento VARCHAR(50) CHECK (tipo_documento IN ('Cédula de ciudadanía', 'Pasaporte', 'cedula de extranjería', 'Permiso de trabajo')),
          numero_documento VARCHAR(50) UNIQUE NOT NULL,
          nombre VARCHAR(100) NOT NULL,
          apellidos VARCHAR(100) NOT NULL,
          sexo VARCHAR(20) CHECK (sexo IN ('hombre', 'mujer', 'No Responde')),
          fecha_nacimiento DATE NOT NULL,
          ocupacion VARCHAR(50) CHECK (ocupacion IN ('empleado', 'desemplado', 'jubilado', 'independiente')),
          telefono VARCHAR(20),
          estado_civil VARCHAR(20) CHECK (estado_civil IN ('casado(a)', 'soltero(a)', 'viudo(a)', 'divorciado(a)')),
          email VARCHAR(100),
          eps VARCHAR(100),
          regimen_salud VARCHAR(100),
          direccion TEXT,
          barrio VARCHAR(100),
          rh VARCHAR(10) CHECK (rh IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
        );
      `
    });

    // Citas table
    await supabase.rpc('create_citas_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS citas (
          id VARCHAR(50) PRIMARY KEY,
          paciente_id VARCHAR(50) REFERENCES pacientes(id),
          medico_id VARCHAR(50) REFERENCES medicos(id),
          fecha DATE NOT NULL,
          hora TIME NOT NULL,
          estado VARCHAR(20) CHECK (estado IN ('programada', 'en_curso', 'completada', 'cancelada')) DEFAULT 'programada',
          motivo TEXT,
          room_id VARCHAR(100) UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Historias clinicas table
    await supabase.rpc('create_historias_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS historias_clinicas (
          id VARCHAR(50) PRIMARY KEY,
          cita_id VARCHAR(50) REFERENCES citas(id),
          paciente_id VARCHAR(50) REFERENCES pacientes(id),
          medico_id VARCHAR(50) REFERENCES medicos(id),
          fecha_consulta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          registro_medico_doctor VARCHAR(50),
          motivo_consulta TEXT,
          objeto_tele_orientacion TEXT,
          antecedentes TEXT,
          tabaquismo VARCHAR(5) CHECK (tabaquismo IN ('Si', 'NO')),
          presion_sistolica INTEGER,
          presion_diastolica INTEGER,
          peso_kg DECIMAL(5,2),
          talla_cm INTEGER,
          actividad_fisica TEXT,
          conducta TEXT,
          especialidad_requiere VARCHAR(200),
          canalizaciones VARCHAR(100) CHECK (canalizaciones IN ('juventud', 'niños', '6 Atención en salud a la Adultez (29 a 59 años)', '7 Atención en salud Vejez (60 años y mas)', '35 Programa de Enfermedades Cronicas PIC HTA,DM,EPOC,Obesidad)')),
          pdf_path VARCHAR(500),
          firma_medico TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    console.log('Tablas creadas exitosamente en Supabase');
  } catch (error) {
    console.error('Error creando tablas:', error);
  }
};

module.exports = { supabase, createTables };

// .env.example
/*
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-jwt-secret
NODE_ENV=development
PORT=3000
*/