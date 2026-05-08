/**
 * ============================================
 * CONFIGURACIÓN DE SUPABASE
 * Cliente para conexión a PostgreSQL
 * ============================================
 */

const { createClient } = require('@supabase/supabase-js');

// Variables de entorno (Railway las configurará automáticamente)
const supabaseUrl = process.env.SUPABASE_URL || 'https://vljyrhrnwlzstqthydam.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsanlyaHJud2x6c3RxdGh5ZGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIwNjc0MCwiZXhwIjoyMDkzNzgyNzQwfQ.zbNaWZ6CYVLjvd7J5oQrptJjhMaeiMFzcb1aoD30nHM';

// Crear cliente con service_role key (acceso completo)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
