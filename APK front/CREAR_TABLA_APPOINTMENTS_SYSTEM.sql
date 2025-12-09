-- ============================================================================
-- INSTRUCCIONES: Ejecutar este SQL en Supabase SQL Editor
-- ============================================================================
-- 1. Ir a: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- 2. Copiar y pegar este script completo
-- 3. Hacer clic en "Run" o presionar Ctrl+Enter
-- ============================================================================

-- Sistema Completo de Citas para App Móvil

-- Crear tabla appointments_system
CREATE TABLE IF NOT EXISTS appointments_system (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cliente
  cliente_nombre TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  cliente_celular TEXT NOT NULL,
  cliente_id UUID,

  -- Vendedor
  vendedor_nombre TEXT NOT NULL,
  vendedor_email TEXT NOT NULL,
  vendedor_celular TEXT NOT NULL,
  vendedor_id UUID,

  -- Inmueble
  inmueble_id TEXT NOT NULL,
  inmueble_titulo TEXT NOT NULL,
  inmueble_tipo TEXT NOT NULL,
  inmueble_direccion TEXT NOT NULL,
  inmueble_ciudad TEXT NOT NULL,
  inmueble_departamento TEXT NOT NULL,
  inmueble_coordenadas JSONB,
  inmueble_precio NUMERIC,
  inmueble_imagen_url TEXT,
  inmueble_url TEXT,

  -- Cita
  fecha_cita DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  duracion_minutos INTEGER DEFAULT 60,

  -- Estado
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (
    estado IN (
      'pendiente',
      'confirmada',
      'en_camino',
      'en_curso',
      'completada',
      'cancelada_cliente',
      'cancelada_vendedor',
      'no_asistio_cliente',
      'no_asistio_vendedor',
      'reagendada'
    )
  ),

  -- Confirmaciones
  confirmada_cliente BOOLEAN DEFAULT FALSE,
  confirmada_vendedor BOOLEAN DEFAULT FALSE,

  -- Notas
  notas_cliente TEXT,
  notas_vendedor TEXT,
  notas_sistema TEXT,

  -- Comunicación
  canal_comunicacion TEXT DEFAULT 'app' CHECK (
    canal_comunicacion IN ('app', 'whatsapp', 'llamada')
  ),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE appointments_system ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can create appointments" ON appointments_system;
DROP POLICY IF EXISTS "Users can view own appointments as client" ON appointments_system;
DROP POLICY IF EXISTS "Users can update own appointments as client" ON appointments_system;
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments_system;
DROP POLICY IF EXISTS "Admins can update all appointments" ON appointments_system;

-- Política: Usuarios autenticados pueden crear citas
CREATE POLICY "Users can create appointments"
  ON appointments_system
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: Usuarios pueden ver sus propias citas (como cliente)
CREATE POLICY "Users can view own appointments as client"
  ON appointments_system
  FOR SELECT
  TO authenticated
  USING (
    cliente_id = auth.uid()
  );

-- Política: Usuarios pueden actualizar sus propias citas (como cliente)
CREATE POLICY "Users can update own appointments as client"
  ON appointments_system
  FOR UPDATE
  TO authenticated
  USING (cliente_id = auth.uid())
  WITH CHECK (cliente_id = auth.uid());

-- Política: Admins pueden ver todas las citas
CREATE POLICY "Admins can view all appointments"
  ON appointments_system
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Política: Admins pueden actualizar todas las citas
CREATE POLICY "Admins can update all appointments"
  ON appointments_system
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_appointments_system_cliente_id
  ON appointments_system(cliente_id);

CREATE INDEX IF NOT EXISTS idx_appointments_system_vendedor_id
  ON appointments_system(vendedor_id);

CREATE INDEX IF NOT EXISTS idx_appointments_system_fecha_cita
  ON appointments_system(fecha_cita DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_system_estado
  ON appointments_system(estado);

CREATE INDEX IF NOT EXISTS idx_appointments_system_created_at
  ON appointments_system(created_at DESC);

-- Índice compuesto para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_appointments_system_cliente_fecha
  ON appointments_system(cliente_id, fecha_cita DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_appointments_system_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_appointments_system_updated_at_trigger ON appointments_system;

CREATE TRIGGER update_appointments_system_updated_at_trigger
  BEFORE UPDATE ON appointments_system
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_system_updated_at();

-- Comentarios de documentación
COMMENT ON TABLE appointments_system IS 'Sistema completo de gestión de citas para visitas a inmuebles';
COMMENT ON COLUMN appointments_system.cliente_id IS 'UUID del usuario cliente (opcional, permite citas sin cuenta)';
COMMENT ON COLUMN appointments_system.vendedor_id IS 'UUID del usuario vendedor (opcional, se asigna después)';
COMMENT ON COLUMN appointments_system.estado IS 'Estado actual de la cita';
COMMENT ON COLUMN appointments_system.confirmada_cliente IS 'Si el cliente confirmó su asistencia';
COMMENT ON COLUMN appointments_system.confirmada_vendedor IS 'Si el vendedor confirmó la cita';

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- Si todo fue ejecutado correctamente, deberías ver:
-- ✅ Tabla "appointments_system" creada
-- ✅ Políticas RLS configuradas
-- ✅ Índices creados
-- ✅ Trigger de updated_at activo
-- ============================================================================
