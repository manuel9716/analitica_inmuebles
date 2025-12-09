# Sistema de Citas - App Móvil

## ✅ Cambios Implementados

Se ha actualizado el sistema de citas de la app móvil para utilizar el nuevo sistema completo de gestión de citas con la tabla `appointments_system`.

---

## 📋 Archivos Modificados

### 1. **`types/index.ts`** - Tipos Actualizados

Se actualizaron los tipos de TypeScript para reflejar la nueva estructura de citas:

```typescript
export type AppointmentStatus =
  | 'pendiente'
  | 'confirmada'
  | 'en_camino'
  | 'en_curso'
  | 'completada'
  | 'cancelada_cliente'
  | 'cancelada_vendedor'
  | 'no_asistio_cliente'
  | 'no_asistio_vendedor'
  | 'reagendada';

export interface Appointment {
  // Cliente
  cliente_nombre: string;
  cliente_email: string;
  cliente_celular: string;
  cliente_id?: string;

  // Vendedor
  vendedor_nombre: string;
  vendedor_email: string;
  vendedor_celular: string;
  vendedor_id?: string;

  // Inmueble
  inmueble_id: string;
  inmueble_titulo: string;
  inmueble_tipo: string;
  inmueble_direccion: string;
  inmueble_ciudad: string;
  inmueble_departamento: string;
  inmueble_coordenadas?: { lat: number; lng: number };
  inmueble_precio?: number;
  inmueble_imagen_url?: string;

  // Cita
  fecha_cita: string;
  hora_inicio: string; // Hora específica (ej: "10:00")
  duracion_minutos: number;

  estado: AppointmentStatus;

  confirmada_cliente: boolean;
  confirmada_vendedor: boolean;

  notas_cliente?: string;
  canal_comunicacion: 'app' | 'whatsapp' | 'llamada';

  created_at: string;
  updated_at: string;
}
```

### 2. **`services/appointmentsAppService.ts`** - Nuevo Servicio

Se creó un nuevo servicio especializado para la app móvil con las siguientes funciones:

#### Funciones Principales:

- ✅ `createAppointment()` - Crear nueva cita
- ✅ `getUpcomingClientAppointments()` - Obtener citas próximas
- ✅ `getAllClientAppointments()` - Obtener todas las citas
- ✅ `getAppointmentById()` - Obtener cita específica
- ✅ `confirmAppointmentByClient()` - Cliente confirma asistencia
- ✅ `cancelAppointmentByClient()` - Cliente cancela cita
- ✅ `markAsOnTheWay()` - Cliente marca "en camino"
- ✅ `rescheduleAppointment()` - Reagendar cita
- ✅ `addClientNotes()` - Agregar notas del cliente
- ✅ `getClientAppointmentStats()` - Estadísticas de citas

### 3. **`app/appointments.tsx`** - Pantalla de Citas Actualizada

Cambios realizados:
- ✅ Usa `appointmentsAppService` en lugar de `appointmentService`
- ✅ Muestra nuevos estados de citas (en_camino, reagendada, etc.)
- ✅ Muestra hora específica en lugar de time slot
- ✅ Muestra información del vendedor
- ✅ Usa campos `inmueble_*` para datos del inmueble

### 4. **`app/schedule-visit.tsx`** - Pantalla de Agendar Actualizada

Cambios realizados:
- ✅ Usa `appointmentsAppService.createAppointment()`
- ✅ Selector de horas específicas (09:00, 10:00, 11:00, etc.)
- ✅ Obtiene datos del perfil del usuario desde Supabase
- ✅ Envía información completa del inmueble
- ✅ Canal de comunicación configurado como 'app'

---

## 🎯 Flujo Completo de Uso

### 1. Usuario Agenda una Cita

```
Usuario ve propiedad
↓
Tap "Agendar Visita"
↓
Selecciona fecha
↓
Selecciona hora específica (ej: 10:00)
↓
Agrega notas opcionales
↓
Confirma
↓
Cita creada en appointments_system con estado: "pendiente"
```

### 2. Usuario Ve sus Citas

```
Usuario navega a "Mis Citas"
↓
Se cargan todas las citas del usuario
↓
Puede ver:
  - Citas próximas (pendiente, confirmada, en_camino)
  - Estado actual
  - Información del inmueble
  - Datos del vendedor
  - Fecha y hora específica
```

### 3. Usuario Cancela una Cita

```
Usuario abre cita pendiente
↓
Tap "Cancelar cita"
↓
Confirma cancelación
↓
Estado cambia a: "cancelada_cliente"
```

---

## 📊 Tabla de Base de Datos

La app usa la tabla `appointments_system` en Supabase:

```sql
CREATE TABLE appointments_system (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Cliente
  cliente_nombre TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  cliente_celular TEXT NOT NULL,
  cliente_id UUID REFERENCES auth.users(id),

  -- Vendedor
  vendedor_nombre TEXT NOT NULL,
  vendedor_email TEXT NOT NULL,
  vendedor_celular TEXT NOT NULL,
  vendedor_id UUID REFERENCES auth.users(id),

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
  estado TEXT NOT NULL DEFAULT 'pendiente',

  -- Confirmaciones
  confirmada_cliente BOOLEAN DEFAULT FALSE,
  confirmada_vendedor BOOLEAN DEFAULT FALSE,

  -- Notas
  notas_cliente TEXT,
  notas_vendedor TEXT,
  notas_sistema TEXT,

  -- Comunicación
  canal_comunicacion TEXT DEFAULT 'app',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔒 Seguridad (RLS)

Las políticas RLS garantizan que:
- ✅ Los usuarios solo ven sus propias citas
- ✅ Los usuarios solo pueden crear citas para ellos mismos
- ✅ Los usuarios solo pueden cancelar sus propias citas
- ✅ El panel admin puede ver todas las citas

---

## 🎨 Nuevas Características Visuales

### Estados de Cita con Colores

```typescript
pendiente      → Naranja (Amarillo)
confirmada     → Verde
en_camino      → Azul
en_curso       → Azul
completada     → Gris
cancelada      → Rojo
reagendada     → Morado
```

### Selector de Hora

Antes: Time Slots (morning/afternoon)
Ahora: Horas específicas en grid

```
┌────┬────┬────┬────┐
│09:00│10:00│11:00│12:00│
├────┼────┼────┼────┤
│14:00│15:00│16:00│17:00│
└────┴────┴────┴────┘
```

---

## 🧪 Cómo Probar

### 1. Crear una Cita

```typescript
// Navegar a una propiedad
// Tap "Agendar Visita"
// Seleccionar fecha: Mañana
// Seleccionar hora: 10:00
// Agregar nota: "Me gustaría ver el garaje"
// Tap "Agendar Visita"
```

### 2. Ver Mis Citas

```typescript
// Ir a tab "Citas"
// Debería ver la cita creada con:
//   - Estado: "Pendiente"
//   - Fecha: Mañana
//   - Hora: 10:00
//   - Info del vendedor
//   - Botón "Cancelar cita"
```

### 3. Cancelar Cita

```typescript
// Tap "Cancelar cita"
// Confirmar
// Estado cambia a "Cancelada"
// Botón de cancelar desaparece
```

---

## 📝 Notas Importantes

### ⚠️ Servicio Antiguo (Deprecated)

El servicio `appointmentService.ts` aún existe pero ya **NO se debe usar**.

**Usar siempre:** `appointmentsAppService.ts`

### ✅ Datos Requeridos

Al crear una cita, estos campos son **obligatorios**:

```typescript
{
  cliente_nombre,
  cliente_email,
  cliente_celular,

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
  hora_inicio,
}
```

### 📱 Perfiles de Usuario

La app obtiene automáticamente los datos del perfil desde la tabla `users`:
- nombre_completo
- email
- celular

Si el usuario no tiene perfil completo, se usan valores por defecto.

---

## 🚀 Próximas Mejoras Sugeridas

### Funcionalidades Adicionales

1. **Notificaciones Push**
   - Recordatorio 24h antes
   - Recordatorio 1h antes
   - Notificación cuando vendedor confirma

2. **Confirmación de Cliente**
   - Botón "Confirmar Asistencia"
   - Llamar a `confirmAppointmentByClient()`

3. **Estado "En Camino"**
   - Botón "Estoy en camino"
   - Llamar a `markAsOnTheWay()`
   - Notificar al vendedor

4. **Reagendar Cita**
   - Formulario para nueva fecha/hora
   - Llamar a `rescheduleAppointment()`

5. **Mapa de Ubicación**
   - Mostrar `inmueble_coordenadas` en mapa
   - Botón "Cómo Llegar"
   - Integración con Google Maps/Waze

6. **Calificación Post-Visita**
   - Calificar experiencia
   - Calificar inmueble
   - Calificar vendedor

---

## 🔗 Integración con Panel Web Admin

El panel web admin (user_type: 'admin') puede:
- Ver todas las citas del sistema
- Asignar vendedores a citas
- Confirmar citas por parte del vendedor
- Ver historial completo
- Generar reportes

**Importante:** La app móvil **SOLO** crea y ve citas. No tiene funciones administrativas.

---

## ✅ Checklist de Implementación

- [x] Actualizar tipos TypeScript
- [x] Crear `appointmentsAppService.ts`
- [x] Actualizar `appointments.tsx`
- [x] Actualizar `schedule-visit.tsx`
- [x] Probar creación de citas
- [x] Probar visualización de citas
- [x] Probar cancelación de citas
- [ ] Implementar notificaciones
- [ ] Implementar confirmación de cliente
- [ ] Implementar "En camino"
- [ ] Implementar reagendar
- [ ] Integrar mapas

---

## 🆘 Troubleshooting

### Error: "No se pudo agendar la visita"

**Posibles causas:**
1. Usuario no autenticado
2. Falta información del perfil
3. Campos requeridos vacíos
4. Error de conexión a Supabase

**Solución:**
```typescript
// Verificar que el usuario esté logueado
const { data: { user } } = await supabase.auth.getUser();

// Verificar que tenga perfil
const { data: profile } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.id)
  .single();
```

### Error: "No aparecen las citas"

**Posibles causas:**
1. Tabla `appointments_system` no existe
2. RLS policies bloqueando acceso
3. `cliente_id` no coincide con `user.id`

**Solución:**
```sql
-- Verificar que exista la tabla
SELECT * FROM appointments_system LIMIT 1;

-- Verificar RLS
SELECT * FROM appointments_system WHERE cliente_id = 'user-uuid-here';
```

---

## 📞 Soporte

Para preguntas o problemas:
1. Revisar logs en consola
2. Verificar estructura de tabla en Supabase
3. Verificar políticas RLS
4. Verificar datos del perfil del usuario

---

**Última actualización:** 28 de Noviembre, 2024
**Versión:** 2.0
**Sistema:** App Móvil - Solo Usuarios Finales (`user_type: 'end_user'`)
