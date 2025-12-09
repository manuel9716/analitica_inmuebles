# Integración de Datos del Vendedor con WASI

## 📋 Resumen

Se implementó un sistema para usar los datos de contacto de la integración WASI como fallback cuando un inmueble no tiene información del vendedor.

## 🔄 Flujo de Datos del Vendedor

### Prioridad de Datos (en orden):

1. **Datos del Vendedor del Inmueble** (`listing.seller`)
   - Nombre: `listing.seller.name`
   - Email: `listing.seller.email`
   - Teléfono: `listing.seller.phone`

2. **Datos de Contacto de WASI** (tabla `api_integration`)
   - Nombre: `contact_name`
   - Email: `contact_email`
   - Teléfono: `contact_phone`

3. **Valores por Defecto** (última opción)
   - Nombre: `"Por Asignar"`
   - Email: `"contacto@buscofacil.com"`
   - Teléfono: `"+573000000000"`

## 🗄️ Nueva Tabla: `api_integration`

### Estructura

```sql
CREATE TABLE api_integration (
  id UUID PRIMARY KEY,
  provider TEXT UNIQUE NOT NULL,      -- 'wasi', 'properati', etc.
  api_key TEXT,                        -- API key (opcional)
  api_url TEXT,                        -- URL base del API (opcional)
  is_active BOOLEAN DEFAULT true,      -- Si está activa
  settings JSONB DEFAULT '{}',         -- Configuración JSON con datos de contacto
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Datos por Defecto

Se inserta automáticamente un registro para WASI con los datos de contacto en el campo `settings`:

```json
{
  "provider": "wasi",
  "is_active": true,
  "settings": {
    "contact_name": "BuscoFacil - Equipo WASI",
    "contact_email": "wasi@buscofacil.com",
    "contact_phone": "+573001234567"
  }
}
```

## 💻 Implementación en Código

### Archivo: `app/schedule-visit.tsx`

```typescript
// 1. Obtener datos del usuario desde la tabla users
const { data: userData } = await supabase
  .from('users')
  .select('nombre_completo, email, celular')
  .eq('id', user?.id)
  .maybeSingle();

// 2. Obtener datos de contacto de WASI (campo settings)
const { data: wasiIntegration } = await supabase
  .from('api_integration')
  .select('settings')
  .eq('provider', 'wasi')
  .eq('is_active', true)
  .maybeSingle();

// 3. Extraer datos de contacto del campo settings
const wasiSettings = wasiIntegration?.settings || {};

// 4. Resolver datos del vendedor con prioridad
const vendedorNombre =
  listing?.seller?.name ||                // Prioridad 1: Vendedor del inmueble
  wasiSettings.contact_name ||            // Prioridad 2: Contacto WASI
  'Por Asignar';                          // Prioridad 3: Por defecto

const vendedorEmail =
  listing?.seller?.email ||
  wasiSettings.contact_email ||
  'contacto@buscofacil.com';

const vendedorCelular =
  listing?.seller?.phone ||
  wasiSettings.contact_phone ||
  '+573000000000';

// 5. Usar datos del usuario (NO del auth.user)
const input = {
  cliente_nombre: userData?.nombre_completo || 'Usuario',
  cliente_email: userData?.email || user?.email || 'email@example.com',
  cliente_celular: userData?.celular || '+573000000000',
  ...
};
```

## 🔐 Seguridad (RLS)

### Políticas Implementadas:

1. **Lectura para Usuarios Autenticados**
   - Cualquier usuario autenticado puede leer datos de integración
   - Necesario para obtener datos de contacto al agendar citas

2. **Escritura Solo para Admins**
   - Solo administradores pueden crear/actualizar integraciones
   - Protege API keys y configuraciones sensibles

## 📝 Casos de Uso

### Caso 1: Inmueble con Vendedor Completo
```
Inmueble: Casa en Bogotá
Vendedor: Juan Pérez (juan@example.com, +573001111111)
✅ Resultado: Se usan los datos de Juan Pérez
```

### Caso 2: Inmueble sin Vendedor
```
Inmueble: Apartamento en Medellín
Vendedor: (no disponible)
✅ Resultado: Se usan datos de WASI (wasi@buscofacil.com, +573001234567)
```

### Caso 3: Inmueble sin Vendedor + WASI Inactivo
```
Inmueble: Casa en Cali
Vendedor: (no disponible)
WASI: is_active = false
✅ Resultado: Se usan valores por defecto (contacto@buscofacil.com)
```

## 🚀 Cómo Ejecutar

### 1. Crear la Tabla

Ejecutar el script: `CREAR_TABLA_API_INTEGRATION.sql` en Supabase SQL Editor

### 2. Verificar Datos

```sql
-- Ver integraciones activas
SELECT * FROM api_integration WHERE is_active = true;
```

### 3. Actualizar Datos de Contacto (Opcional)

```sql
-- Actualizar datos de contacto de WASI en el campo settings
UPDATE api_integration
SET settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      settings,
      '{contact_name}',
      '"Tu Nombre"'
    ),
    '{contact_email}',
    '"tu.email@empresa.com"'
  ),
  '{contact_phone}',
  '"+573001234567"'
)
WHERE provider = 'wasi';

-- O reemplazar todo el objeto settings:
UPDATE api_integration
SET settings = '{
  "contact_name": "Tu Nombre",
  "contact_email": "tu.email@empresa.com",
  "contact_phone": "+573001234567"
}'::jsonb
WHERE provider = 'wasi';
```

## ✨ Beneficios

1. ✅ **Datos Consistentes**: Siempre hay información de contacto del vendedor
2. ✅ **Flexibilidad**: Prioriza datos del vendedor real cuando disponibles
3. ✅ **Escalabilidad**: Fácil agregar más proveedores (properati, etc.)
4. ✅ **Configurabilidad**: Los datos se pueden actualizar sin cambiar código
5. ✅ **Seguridad**: RLS protege datos sensibles como API keys

## 🔧 Mantenimiento

### Agregar Nuevo Proveedor

```sql
INSERT INTO api_integration (
  provider,
  is_active,
  settings
) VALUES (
  'properati',
  true,
  '{
    "contact_name": "BuscoFacil - Equipo Properati",
    "contact_email": "properati@buscofacil.com",
    "contact_phone": "+573002222222"
  }'::jsonb
);
```

### Desactivar Proveedor

```sql
UPDATE api_integration
SET is_active = false
WHERE provider = 'wasi';
```

## 📊 Logs de Debug

El código incluye logs para debugging:

```
[ScheduleVisit] Datos del usuario obtenidos: { nombre_completo, email, celular }
[ScheduleVisit] Datos WASI obtenidos: { settings: { contact_name, contact_email, contact_phone } }
[ScheduleVisit] Datos a enviar: { cliente_nombre, vendedor_nombre, ... }
```

Revisa la consola para verificar qué datos se están usando.

**IMPORTANTE:** Los datos del cliente ahora vienen ÚnicAMENTE de la tabla `users`, no de `auth.user`.

---

**Implementado por:** Sistema de Citas BuscoFacil
**Fecha:** 2025-11-28
**Versión:** 1.0
