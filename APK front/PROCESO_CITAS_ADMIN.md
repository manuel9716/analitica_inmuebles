# 📋 Sistema de Gestión de Citas - Guía para Panel de Administración

## 🎯 Descripción General

Este documento describe el **flujo completo del sistema de citas** entre la aplicación móvil BuscoFácil y el panel de administración, para que puedas adaptar correctamente tu panel admin.

---

## 🔄 Flujo Completo del Sistema

### 1. **Cliente Solicita una Cita (App Móvil)**

Cuando un cliente interesado en un inmueble solicita agendar una visita desde la app móvil:

**Datos que ingresa el cliente:**
- Fecha preferida para la visita
- Hora preferida (selector de hora)
- Notas adicionales (opcional)

**Datos que se capturan automáticamente:**
- Información del cliente (nombre, email, teléfono)
- Información completa del inmueble
- Información del vendedor asignado

---

### 2. **Se Crea el Registro en Base de Datos**

La cita se guarda en la tabla `appointments_system` con los siguientes datos:

#### **Información del Cliente**
```json
{
  "cliente_id": "uuid",           // ID del usuario en auth.users (puede ser null para invitados)
  "cliente_nombre": "string",     // Nombre completo
  "cliente_email": "string",      // Email de contacto
  "cliente_celular": "string"     // Número de celular con código país
}
```

#### **Información del Vendedor**
```json
{
  "vendedor_id": "uuid",          // ID del vendedor (opcional)
  "vendedor_nombre": "string",    // Nombre del vendedor
  "vendedor_email": "string",     // Email del vendedor
  "vendedor_celular": "string"    // Celular del vendedor
}
```

#### **Información Completa del Inmueble**
```json
{
  "inmueble_id": "string",              // ID único del inmueble
  "inmueble_titulo": "string",          // Ej: "Casa en Chapinero"
  "inmueble_tipo": "string",            // casa, apartamento, lote, etc.
  "inmueble_direccion": "string",       // Dirección completa
  "inmueble_ciudad": "string",          // Ciudad
  "inmueble_departamento": "string",    // Departamento/Estado
  "inmueble_barrio": "string",          // Barrio/Sector
  "inmueble_coordenadas": {             // JSONB con lat/lng
    "lat": number,
    "lng": number
  },
  "inmueble_precio": number,            // Precio en números
  "inmueble_imagen_url": "string",      // URL de imagen principal
  "inmueble_imagenes": ["urls"],        // Array JSONB con todas las imágenes
  "inmueble_url": "string",             // URL al detalle del inmueble
  "inmueble_habitaciones": number,      // Número de habitaciones
  "inmueble_banos": number,             // Número de baños
  "inmueble_area": number,              // Área en m²
  "inmueble_parqueaderos": number,      // Número de parqueaderos
  "inmueble_estrato": number,           // Estrato (1-6)
  "inmueble_tipo_negocio": "string",    // "venta" o "arriendo"
  "inmueble_descripcion": "string",     // Descripción completa
  "inmueble_caracteristicas": ["items"] // Array JSONB de características
}
```

#### **Información de la Cita**
```json
{
  "fecha_cita": "timestamp",      // Fecha de la cita
  "hora_inicio": "time",          // Hora de inicio (ej: 10:00:00)
  "hora_cita": "string",          // Hora legible (ej: "10:00 AM")
  "duracion_minutos": number,     // Duración en minutos (default: 60)
  "notas_cliente": "string"       // Notas del cliente (opcional)
}
```

#### **Estado y Confirmaciones**
```json
{
  "estado": "string",                          // Estado actual de la cita
  "confirmada_cliente": boolean,               // Si el cliente confirmó
  "confirmada_vendedor": boolean,              // Si el vendedor confirmó
  "fecha_confirmacion_cliente": "timestamp",   // Cuándo confirmó el cliente
  "fecha_confirmacion_vendedor": "timestamp",  // Cuándo confirmó el vendedor
  "notas_vendedor": "string",                  // Notas del vendedor
  "notas_internas": "string",                  // Notas internas del sistema
  "canal_comunicacion": "string",              // "app", "whatsapp", "llamada"
  "origen_cita": "string"                      // "app" (siempre desde app móvil)
}
```

---

### 3. **Estados Posibles de una Cita**

La columna `estado` puede tener los siguientes valores:

| Estado | Descripción | Cuándo se usa |
|--------|-------------|---------------|
| `pendiente` | ⏳ Cita creada, esperando confirmación | Estado inicial al crear la cita |
| `confirmada` | ✅ Cita confirmada por el vendedor | Vendedor acepta la cita |
| `en_camino` | 🚗 Vendedor en camino al inmueble | Vendedor marca que va en camino |
| `en_curso` | 🏠 Visita en progreso | Durante la visita |
| `completada` | ✅ Visita finalizada exitosamente | Después de la visita |
| `cancelada_cliente` | ❌ Cancelada por el cliente | Cliente cancela |
| `cancelada_vendedor` | ❌ Cancelada por el vendedor | Vendedor cancela |
| `no_asistio_cliente` | 👤 Cliente no asistió | Cliente no llegó |
| `no_asistio_vendedor` | 👨‍💼 Vendedor no asistió | Vendedor no llegó |
| `reagendada` | 🔄 Cita reagendada | Se cambió la fecha/hora |

---

### 4. **Se Envía Email Automático al Vendedor**

Inmediatamente después de crear la cita, se envía un email al vendedor usando la **Edge Function** `send-appointment-email`.

**Contenido del Email:**
- 📧 **Asunto**: "Nueva Cita Solicitada: {título del inmueble}"
- 📋 Información completa del cliente
- 🏡 Detalles del inmueble con precio formateado
- 📅 Fecha y hora solicitada en español
- 📝 Notas del cliente (si las hay)
- 👤 Vendedor asignado
- 🔘 **Botón CTA**: "Revisar y Gestionar Cita"

**URL del Botón:**
```
{EXPO_PUBLIC_ADMIN_URL}/appointments/{id}
```

Ejemplo:
```
https://admin.buscofacil.com/appointments/123e4567-e89b-12d3-a456-426614174000
```

---

## 🖥️ Integraciones Requeridas en el Panel Admin

### 1. **Ruta para Gestionar Citas**

Tu panel de administración debe tener una ruta que reciba el ID de la cita:

```
/appointments/:id
```

o

```
/citas/:id
```

**Ejemplo completo:**
```
https://admin.buscofacil.com/appointments/123e4567-e89b-12d3-a456-426614174000
```

### 2. **Consultar Datos de la Cita**

Para obtener los datos completos de una cita, consulta la tabla `appointments_system`:

```sql
SELECT * FROM appointments_system WHERE id = '{appointment_id}';
```

**IMPORTANTE**: Usa la tabla `appointments_system`, no `appointments` (la tabla antigua).

### 3. **Acciones que Debe Permitir el Admin**

#### **Confirmar Cita**
```sql
UPDATE appointments_system
SET
  estado = 'confirmada',
  confirmada_vendedor = true,
  fecha_confirmacion_vendedor = NOW(),
  updated_at = NOW()
WHERE id = '{appointment_id}';
```

#### **Modificar Fecha/Hora**
```sql
UPDATE appointments_system
SET
  fecha_cita = '{nueva_fecha}',
  hora_inicio = '{nueva_hora}',
  hora_cita = '{nueva_hora_legible}',
  estado = 'reagendada',
  notas_vendedor = 'Fecha modificada por el vendedor',
  updated_at = NOW()
WHERE id = '{appointment_id}';
```

#### **Agregar Notas del Vendedor**
```sql
UPDATE appointments_system
SET
  notas_vendedor = '{notas}',
  updated_at = NOW()
WHERE id = '{appointment_id}';
```

#### **Cancelar Cita**
```sql
UPDATE appointments_system
SET
  estado = 'cancelada_vendedor',
  cancelada_at = NOW(),
  notas_vendedor = '{motivo_cancelacion}',
  updated_at = NOW()
WHERE id = '{appointment_id}';
```

#### **Cambiar Estado Durante la Visita**
```sql
-- Marcar como "en camino"
UPDATE appointments_system
SET estado = 'en_camino', updated_at = NOW()
WHERE id = '{appointment_id}';

-- Marcar como "en curso"
UPDATE appointments_system
SET estado = 'en_curso', updated_at = NOW()
WHERE id = '{appointment_id}';

-- Marcar como "completada"
UPDATE appointments_system
SET
  estado = 'completada',
  completada_at = NOW(),
  updated_at = NOW()
WHERE id = '{appointment_id}';
```

---

## 📊 Vista Sugerida en el Admin

### **Panel Principal de la Cita**

```
┌─────────────────────────────────────────────────────────┐
│  📋 Cita #12345                    Estado: ⏳ Pendiente │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  👤 CLIENTE                                             │
│  Nombre: Juan Pérez                                     │
│  Email: juan@example.com                                │
│  Teléfono: +57 300 123 4567                            │
│                                                          │
│  🏡 INMUEBLE                                            │
│  Título: Casa en Chapinero                              │
│  Tipo: Casa • Venta                                     │
│  Precio: $450.000.000                                   │
│  Dirección: Calle 60 #10-20, Chapinero, Bogotá        │
│  Características:                                       │
│    • 3 habitaciones                                     │
│    • 2 baños                                           │
│    • 120 m²                                            │
│    • 1 parqueadero                                     │
│    • Estrato 4                                         │
│                                                          │
│  📅 FECHA Y HORA                                        │
│  Fecha: Viernes, 15 de diciembre de 2023              │
│  Hora: 10:00 AM                                        │
│  Duración: 60 minutos                                  │
│                                                          │
│  📝 NOTAS DEL CLIENTE                                   │
│  "Prefiero visitar por la mañana, estoy interesado    │
│   en conocer el barrio y las zonas comunes."          │
│                                                          │
│  👨‍💼 VENDEDOR ASIGNADO                                │
│  Nombre: María García                                   │
│  Email: maria@example.com                              │
│  Teléfono: +57 301 234 5678                           │
│                                                          │
│  ⚙️ ACCIONES                                           │
│  [✅ Confirmar Cita]  [📅 Modificar Fecha]             │
│  [✏️ Agregar Notas]  [❌ Cancelar Cita]               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### **Listado de Todas las Citas**

```sql
-- Obtener todas las citas con filtros
SELECT
  id,
  cliente_nombre,
  cliente_email,
  cliente_celular,
  inmueble_titulo,
  inmueble_direccion,
  inmueble_precio,
  fecha_cita,
  hora_cita,
  estado,
  confirmada_vendedor,
  vendedor_nombre,
  created_at
FROM appointments_system
WHERE
  estado IN ('pendiente', 'confirmada', 'en_camino', 'en_curso')
  AND fecha_cita >= CURRENT_DATE
ORDER BY fecha_cita ASC, hora_inicio ASC;
```

---

## 🔔 Notificaciones Sugeridas

### **Email al Cliente cuando el Vendedor Confirma**

Cuando cambies el estado a `confirmada`, podrías enviar un email al cliente:

```
Para: {cliente_email}
Asunto: Tu cita ha sido confirmada - {inmueble_titulo}

¡Buenas noticias! Tu visita ha sido confirmada.

📅 Fecha: {fecha_cita}
⏰ Hora: {hora_cita}
📍 Dirección: {inmueble_direccion}

Vendedor: {vendedor_nombre}
Teléfono: {vendedor_celular}

¡Te esperamos!
```

### **Email al Cliente cuando se Modifica la Fecha**

Cuando cambies `fecha_cita` o `hora_inicio`:

```
Para: {cliente_email}
Asunto: Tu cita ha sido reagendada - {inmueble_titulo}

Tu visita ha sido reagendada:

📅 Nueva Fecha: {fecha_cita}
⏰ Nueva Hora: {hora_cita}

Motivo: {notas_vendedor}
```

---

## 🔐 Seguridad y Permisos

### **Row Level Security (RLS)**

La tabla `appointments_system` tiene políticas RLS configuradas:

- ✅ Usuarios autenticados pueden crear citas
- ✅ Clientes solo ven sus propias citas (`cliente_id = auth.uid()`)
- ✅ Admins pueden ver y modificar todas las citas (requiere `user_type = 'admin'`)

### **Permisos del Admin**

Para que un usuario del admin pueda gestionar citas, debe tener:

```sql
-- En la tabla 'users'
user_type = 'admin'

-- O role_id correspondiente en la tabla 'roles'
```

---

## 📈 Reportes y Estadísticas Sugeridas

### **Citas por Estado**
```sql
SELECT
  estado,
  COUNT(*) as total
FROM appointments_system
GROUP BY estado
ORDER BY total DESC;
```

### **Citas por Vendedor**
```sql
SELECT
  vendedor_nombre,
  COUNT(*) as total_citas,
  SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas,
  SUM(CASE WHEN estado = 'cancelada_vendedor' THEN 1 ELSE 0 END) as canceladas
FROM appointments_system
GROUP BY vendedor_nombre
ORDER BY total_citas DESC;
```

### **Tasa de Conversión**
```sql
SELECT
  COUNT(*) as total_citas,
  SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas,
  ROUND(
    SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END)::numeric /
    COUNT(*)::numeric * 100,
    2
  ) as tasa_conversion
FROM appointments_system;
```

---

## 🔗 Conexión con Supabase

### **Desde tu Panel Admin**

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Usa service role para operaciones admin
);

// Obtener una cita
const { data: appointment, error } = await supabase
  .from('appointments_system')
  .select('*')
  .eq('id', appointmentId)
  .single();

// Actualizar estado
const { error } = await supabase
  .from('appointments_system')
  .update({
    estado: 'confirmada',
    confirmada_vendedor: true,
    fecha_confirmacion_vendedor: new Date().toISOString(),
  })
  .eq('id', appointmentId);
```

---

## 📱 Datos que Recibe desde la App

### **Campos que SIEMPRE vienen completos:**
- ✅ Toda la información del cliente
- ✅ Toda la información básica del inmueble (id, título, dirección, ciudad)
- ✅ Fecha y hora de la cita
- ✅ Vendedor asignado (nombre, email, celular)

### **Campos que pueden ser NULL:**
- ⚠️ `cliente_id` - Si es un usuario invitado
- ⚠️ `vendedor_id` - Si no está registrado en el sistema
- ⚠️ `notas_cliente` - Si el cliente no dejó notas
- ⚠️ Características del inmueble (barrio, habitaciones, etc.) - Depende de los datos disponibles

---

## ✅ Checklist de Implementación

Para integrar correctamente el sistema de citas en tu panel admin:

- [ ] Crear ruta `/appointments/:id` en tu admin
- [ ] Configurar conexión a Supabase con service role key
- [ ] Implementar vista de detalle de cita
- [ ] Agregar botones de acción (Confirmar, Modificar, Cancelar)
- [ ] Implementar actualización de estado
- [ ] Agregar listado de todas las citas
- [ ] Implementar filtros por estado y fecha
- [ ] Configurar notificaciones al cliente (opcional)
- [ ] Agregar dashboard con estadísticas (opcional)

---

## 🆘 Soporte

Si necesitas ayuda para implementar alguna funcionalidad específica en tu panel de administración, contacta al equipo de desarrollo de BuscoFácil.

---

**Versión:** 1.0
**Última actualización:** Diciembre 2024
**Tabla de BD:** `appointments_system`
**Edge Function:** `send-appointment-email`
