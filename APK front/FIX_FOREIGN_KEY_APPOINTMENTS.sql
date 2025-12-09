-- ============================================================================
-- SCRIPT DE REPARACIÓN: Eliminar Foreign Keys de appointments_system
-- ============================================================================
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- ============================================================================

-- Paso 1: Ver qué foreign keys existen
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'appointments_system';

-- Paso 2: Eliminar la tabla appointments_system si existe
-- (para empezar desde cero)
DROP TABLE IF EXISTS appointments_system CASCADE;

-- Paso 3: Crear la tabla SIN foreign keys
CREATE TABLE appointments_system (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cliente (SIN foreign key a auth.users)
  cliente_nombre TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  cliente_celular TEXT NOT NULL,
  cliente_id UUID,  -- Solo referencia, NO foreign key

  -- Vendedor (SIN foreign key a auth.users)
  vendedor_nombre TEXT NOT NULL,
  vendedor_email TEXT NOT NULL,
  vendedor_celular TEXT NOT NULL,
  vendedor_id UUID,  -- Solo referencia, NO foreign key

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

-- Paso 4: Habilitar RLS
ALTER TABLE appointments_system ENABLE ROW LEVEL SECURITY;

-- Paso 5: Políticas RLS
CREATE POLICY "Users can create appointments"
  ON appointments_system
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own appointments as client"
  ON appointments_system
  FOR SELECT
  TO authenticated
  USING (cliente_id = auth.uid());

CREATE POLICY "Users can update own appointments as client"
  ON appointments_system
  FOR UPDATE
  TO authenticated
  USING (cliente_id = auth.uid())
  WITH CHECK (cliente_id = auth.uid());

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

-- Paso 6: Índices
CREATE INDEX idx_appointments_system_cliente_id
  ON appointments_system(cliente_id);

CREATE INDEX idx_appointments_system_vendedor_id
  ON appointments_system(vendedor_id);

CREATE INDEX idx_appointments_system_fecha_cita
  ON appointments_system(fecha_cita DESC);

CREATE INDEX idx_appointments_system_estado
  ON appointments_system(estado);

CREATE INDEX idx_appointments_system_created_at
  ON appointments_system(created_at DESC);

CREATE INDEX idx_appointments_system_cliente_fecha
  ON appointments_system(cliente_id, fecha_cita DESC);

-- Paso 7: Función y Trigger para updated_at
CREATE OR REPLACE FUNCTION update_appointments_system_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appointments_system_updated_at_trigger
  BEFORE UPDATE ON appointments_system
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_system_updated_at();

-- ============================================================================
-- VERIFICACIÓN: Ejecuta este query para confirmar que NO hay foreign keys
-- ============================================================================
SELECT
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'appointments_system'
AND constraint_type = 'FOREIGN KEY';

-- Si el query anterior retorna 0 filas, está correcto ✅
-- ============================================================================
