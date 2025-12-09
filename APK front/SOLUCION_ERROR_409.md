# 🔧 Solución al Error 409 - Foreign Key Constraint

## ❌ Error que estás experimentando:

```
Failed to load resource: the server responded with a status of 409
[appointmentsAppService] Error: insert or update on table "appointments_system"
violates foreign key constraint "appointments_system_cliente_id_fkey"
```

## 🔍 Causa del Problema

El código de la app móvil intenta insertar datos en la tabla `appointments_system`, pero **esta tabla NO EXISTE en tu base de datos Supabase**.

La migración que creaste solo creó la tabla `appointments` (la vieja), pero el nuevo sistema usa `appointments_system`.

## ✅ Solución

Necesitas crear la tabla `appointments_system` en tu base de datos Supabase. Sigue estos pasos:

### Paso 1: Ir al SQL Editor de Supabase

1. Abre tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú lateral, clic en **"SQL Editor"**

### Paso 2: Ejecutar el Script SQL

1. Abre el archivo `CREAR_TABLA_APPOINTMENTS_SYSTEM.sql` que está en la raíz del proyecto
2. **Copia TODO el contenido** del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **"Run"** (o presiona `Ctrl + Enter`)

### Paso 3: Verificar que se Creó Correctamente

Ejecuta este query para verificar:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'appointments_system';
```

Deberías ver:
```
appointments_system
```

### Paso 4: Verificar Políticas RLS

Ejecuta:

```sql
SELECT policyname
FROM pg_policies
WHERE tablename = 'appointments_system';
```

Deberías ver 5 políticas:
```
Users can create appointments
Users can view own appointments as client
Users can update own appointments as client
Admins can view all appointments
Admins can update all appointments
```

### Paso 5: Probar en la App

Ahora vuelve a la app y prueba agendar una visita. El error 409 debería desaparecer.

---

## 📊 Estructura de la Tabla Creada

La tabla `appointments_system` tiene esta estructura:

```sql
appointments_system
├── id (UUID)
├── cliente_nombre, cliente_email, cliente_celular, cliente_id
├── vendedor_nombre, vendedor_email, vendedor_celular, vendedor_id
├── inmueble_* (id, titulo, tipo, direccion, ciudad, etc.)
├── fecha_cita (DATE)
├── hora_inicio (TIME)
├── duracion_minutos (INTEGER)
├── estado (TEXT)
├── confirmada_cliente (BOOLEAN)
├── confirmada_vendedor (BOOLEAN)
├── notas_cliente, notas_vendedor, notas_sistema
├── canal_comunicacion (TEXT)
├── created_at, updated_at (TIMESTAMPTZ)
```

## 🔒 Seguridad (RLS)

Las políticas configuradas garantizan:

✅ Solo usuarios autenticados pueden crear citas
✅ Los usuarios solo ven sus propias citas (donde `cliente_id = auth.uid()`)
✅ Los usuarios solo pueden actualizar sus propias citas
✅ Los admins (`user_type = 'admin'`) pueden ver y actualizar todas las citas

---

## 🧪 Prueba de Validación

Después de crear la tabla, ejecuta este query para insertar una cita de prueba:

```sql
INSERT INTO appointments_system (
  cliente_nombre,
  cliente_email,
  cliente_celular,
  cliente_id,
  vendedor_nombre,
  vendedor_email,
  vendedor_celular,
  inmueble_id,
  inmueble_titulo,
  inmueble_tipo,
  inmueble_direccion,
  inmueble_ciudad,
  inmueble_departamento,
  fecha_cita,
  hora_inicio
) VALUES (
  'Juan Test',
  'juan@test.com',
  '+573001234567',
  auth.uid(), -- Tu ID de usuario actual
  'María Vendedor',
  'maria@buscofacil.com',
  '+573007654321',
  'TEST-001',
  'Casa de Prueba',
  'casa',
  'Calle 123 #45-67',
  'Bogotá',
  'Cundinamarca',
  '2025-12-15',
  '10:00'
);
```

Si se inserta correctamente, el problema está resuelto ✅

---

## ⚠️ Notas Importantes

### Sobre `cliente_id`

El campo `cliente_id` es **opcional** (puede ser `NULL`), pero en la app móvil **siempre se envía** el `auth.uid()` del usuario autenticado.

Si ves el error de foreign key, significa que:
1. La tabla no existe (caso actual) ✅
2. El usuario no está autenticado correctamente ⚠️
3. El `cliente_id` es inválido ⚠️

### Verificar Usuario Autenticado

En la app, asegúrate de que el usuario esté logueado:

```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('Usuario:', user?.id); // Debe mostrar un UUID válido
```

Si es `null`, el usuario no está autenticado y el error ocurrirá.

---

## 🆘 Si el Error Persiste

Si después de crear la tabla el error continúa, verifica:

### 1. Usuario Autenticado
```typescript
// En schedule-visit.tsx
console.log('[DEBUG] Usuario ID:', user?.id);
```

Debe mostrar algo como: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### 2. Datos que se Envían
```typescript
// En appointmentsAppService.ts, línea ~23
console.log('[DEBUG] Input data:', JSON.stringify(appointmentData, null, 2));
```

Verifica que `cliente_id` tenga un UUID válido.

### 3. Tabla Existe
```sql
SELECT COUNT(*) FROM appointments_system;
```

Debe retornar `0` (si no hay citas) sin errores.

### 4. RLS Activo
```sql
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'appointments_system';
```

Debe mostrar `relrowsecurity = true`

---

## 📞 Soporte Adicional

Si necesitas ayuda adicional:

1. Verifica el archivo `SISTEMA_CITAS_APP_MOVIL.md`
2. Revisa `VALIDACION_CASOS_USO.md`
3. Consulta la sección de Troubleshooting

---

## ✅ Checklist de Solución

- [ ] Abrir SQL Editor en Supabase
- [ ] Ejecutar script `CREAR_TABLA_APPOINTMENTS_SYSTEM.sql`
- [ ] Verificar que la tabla existe
- [ ] Verificar que las políticas RLS están activas
- [ ] Verificar que el usuario está autenticado en la app
- [ ] Probar agendar una visita
- [ ] Verificar que se crea la cita sin errores

---

**Resumen:** El error 409 ocurre porque la tabla `appointments_system` no existe. Ejecuta el script SQL proporcionado y el problema se resolverá.
