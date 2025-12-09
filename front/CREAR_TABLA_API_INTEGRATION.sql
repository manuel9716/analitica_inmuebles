-- ============================================================================
-- INSTRUCCIONES: Ejecutar este SQL en Supabase SQL Editor
-- ============================================================================
-- 1. Ir a: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- 2. Copiar y pegar este script completo
-- 3. Hacer clic en "Run" o presionar Ctrl+Enter
-- ============================================================================

/*
  Tabla de Integración API para almacenar configuraciones de APIs externas
  como WASI y sus datos de contacto
*/

-- Crear tabla api_integration
-- NOTA: Los datos de contacto (nombre, email, teléfono) se almacenan en el campo settings
CREATE TABLE IF NOT EXISTS api_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  api_key TEXT,
  api_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE api_integration ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Admins can read api_integration" ON api_integration;
DROP POLICY IF EXISTS "Admins can insert api_integration" ON api_integration;
DROP POLICY IF EXISTS "Admins can update api_integration" ON api_integration;
DROP POLICY IF EXISTS "Service role can read api_integration" ON api_integration;

-- Política: Solo admins pueden leer datos de integración API
CREATE POLICY "Admins can read api_integration"
  ON api_integration
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Política: Solo admins pueden insertar datos de integración API
CREATE POLICY "Admins can insert api_integration"
  ON api_integration
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Política: Solo admins pueden actualizar datos de integración API
CREATE POLICY "Admins can update api_integration"
  ON api_integration
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

-- Política: Usuarios autenticados pueden leer (para uso en la app)
CREATE POLICY "Service role can read api_integration"
  ON api_integration
  FOR SELECT
  TO authenticated
  USING (true);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_api_integration_provider
  ON api_integration(provider);

CREATE INDEX IF NOT EXISTS idx_api_integration_is_active
  ON api_integration(is_active);

-- Insertar integración WASI por defecto
-- Los datos de contacto van en el campo settings como JSON
INSERT INTO api_integration (
  provider,
  is_active,
  settings
) VALUES (
  'wasi',
  true,
  '{
    "contact_name": "BuscoFacil - Equipo WASI",
    "contact_email": "wasi@buscofacil.com",
    "contact_phone": "+573001234567"
  }'::jsonb
)
ON CONFLICT (provider) DO NOTHING;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_api_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_api_integration_updated_at_trigger ON api_integration;

CREATE TRIGGER update_api_integration_updated_at_trigger
  BEFORE UPDATE ON api_integration
  FOR EACH ROW
  EXECUTE FUNCTION update_api_integration_updated_at();

-- Comentarios de documentación
COMMENT ON TABLE api_integration IS 'Configuración de integraciones con APIs externas';
COMMENT ON COLUMN api_integration.provider IS 'Nombre del proveedor (ej: wasi, properati)';
COMMENT ON COLUMN api_integration.is_active IS 'Si la integración está activa';
COMMENT ON COLUMN api_integration.settings IS 'Configuración JSON con contact_name, contact_email, contact_phone y otros datos del proveedor';

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- Si todo fue ejecutado correctamente, deberías ver:
-- ✅ Tabla "api_integration" creada
-- ✅ Políticas RLS configuradas
-- ✅ Índices creados
-- ✅ Registro WASI insertado
-- ✅ Trigger de updated_at activo
-- ============================================================================
