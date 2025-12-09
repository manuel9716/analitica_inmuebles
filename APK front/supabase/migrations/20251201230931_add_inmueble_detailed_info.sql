/*
  # Agregar información detallada del inmueble a appointments_system

  ## Resumen
  Agrega columnas adicionales para almacenar información completa del inmueble
  en la tabla appointments_system, permitiendo mostrar todos los detalles en
  la vista de detalle de la cita sin necesidad de consultar la API externa.

  ## Cambios
  1. Agregar columnas de características del inmueble:
     - `inmueble_barrio` - Barrio del inmueble
     - `inmueble_habitaciones` - Número de habitaciones
     - `inmueble_banos` - Número de baños
     - `inmueble_area` - Área en m²
     - `inmueble_parqueaderos` - Número de parqueaderos
     - `inmueble_estrato` - Estrato socioeconómico
     - `inmueble_tipo_negocio` - Tipo de transacción (venta/arriendo)
     - `inmueble_descripcion` - Descripción detallada
     - `inmueble_caracteristicas` - Array de características
     - `inmueble_imagenes` - Array de URLs de imágenes
     - `hora_cita` - Hora en formato de texto legible

  ## Notas
  - Todas las columnas son opcionales (NULL permitido)
  - Los arrays se almacenan como JSONB para flexibilidad
  - Se mantienen las columnas existentes sin cambios
*/

-- Agregar columnas de características básicas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments_system' AND column_name = 'inmueble_barrio'
  ) THEN
    ALTER TABLE appointments_system ADD COLUMN inmueble_barrio TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments_system' AND column_name = 'inmueble_habitaciones'
  ) THEN
    ALTER TABLE appointments_system ADD COLUMN inmueble_habitaciones INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments_system' AND column_name = 'inmueble_banos'
  ) THEN
    ALTER TABLE appointments_system ADD COLUMN inmueble_banos NUMERIC;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments_system' AND column_name = 'inmueble_area'
  ) THEN
    ALTER TABLE appointments_system ADD COLUMN inmueble_area NUMERIC;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments_system' AND column_name = 'inmueble_parqueaderos'
  ) THEN
    ALTER TABLE appointments_system ADD COLUMN inmueble_parqueaderos INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments_system' AND column_name = 'inmueble_estrato'
  ) THEN
    ALTER TABLE appointments_system ADD COLUMN inmueble_estrato INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments_system' AND column_name = 'inmueble_tipo_negocio'
  ) THEN
    ALTER TABLE appointments_system ADD COLUMN inmueble_tipo_negocio TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments_system' AND column_name = 'inmueble_descripcion'
  ) THEN
    ALTER TABLE appointments_system ADD COLUMN inmueble_descripcion TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments_system' AND column_name = 'inmueble_caracteristicas'
  ) THEN
    ALTER TABLE appointments_system ADD COLUMN inmueble_caracteristicas JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments_system' AND column_name = 'inmueble_imagenes'
  ) THEN
    ALTER TABLE appointments_system ADD COLUMN inmueble_imagenes JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments_system' AND column_name = 'hora_cita'
  ) THEN
    ALTER TABLE appointments_system ADD COLUMN hora_cita TEXT;
  END IF;
END $$;

-- Agregar comentarios para documentación
COMMENT ON COLUMN appointments_system.inmueble_barrio IS 'Barrio donde se ubica el inmueble';
COMMENT ON COLUMN appointments_system.inmueble_habitaciones IS 'Número de habitaciones del inmueble';
COMMENT ON COLUMN appointments_system.inmueble_banos IS 'Número de baños del inmueble';
COMMENT ON COLUMN appointments_system.inmueble_area IS 'Área del inmueble en metros cuadrados';
COMMENT ON COLUMN appointments_system.inmueble_parqueaderos IS 'Número de parqueaderos';
COMMENT ON COLUMN appointments_system.inmueble_estrato IS 'Estrato socioeconómico (1-6)';
COMMENT ON COLUMN appointments_system.inmueble_tipo_negocio IS 'Tipo de transacción: venta o arriendo';
COMMENT ON COLUMN appointments_system.inmueble_descripcion IS 'Descripción detallada del inmueble';
COMMENT ON COLUMN appointments_system.inmueble_caracteristicas IS 'Array JSON de características adicionales';
COMMENT ON COLUMN appointments_system.inmueble_imagenes IS 'Array JSON de URLs de imágenes del inmueble';
COMMENT ON COLUMN appointments_system.hora_cita IS 'Hora de la cita en formato legible (ej: 10:00 AM)';
