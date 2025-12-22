# 📘 Documentación Completa - Sistema de Gestión de Citas Inmobiliarias

## 📋 Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Base de Datos](#base-de-datos)
4. [Edge Functions (Endpoints Externos)](#edge-functions-endpoints-externos)
5. [Servicios Internos](#servicios-internos)
6. [Autenticación y Seguridad](#autenticación-y-seguridad)
7. [Integración con Backend de IA](#integración-con-backend-de-ia)
8. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🎯 Resumen Ejecutivo

### ¿Qué es?
Sistema completo de gestión de citas inmobiliarias que permite:
- Agendar y gestionar citas para ver propiedades
- Administrar vendedores y clientes
- Calcular y seguir comisiones
- Integrar con servicios externos (Google Calendar, WASI)
- Sistema de permisos basado en roles

### Tecnologías
- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Autenticación**: Supabase Auth
- **APIs**: Google Calendar, Email (SendGrid/Resend)

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │  Citas   │  │ Usuarios │  │  Config  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE (Backend as a Service)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           PostgreSQL Database + RLS                   │  │
│  │  • appointments_system  • users  • commissions       │  │
│  │  • roles  • permissions  • api_integrations          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Edge Functions (Deno)                    │  │
│  │  • send-email           • google-calendar-oauth      │  │
│  │  • request-password-reset • generate-calendar-event  │  │
│  │  • sync-calendar-event  • create-admin-user          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  SERVICIOS EXTERNOS                          │
│  • Google Calendar API  • SendGrid/Resend  • WASI          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Base de Datos

### Esquema Principal

#### 1. **appointments_system** (Tabla Central)
```sql
CREATE TABLE appointments_system (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Estado y control
  estado TEXT NOT NULL, -- 'pendiente', 'confirmada', 'cancelada_cliente', etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Datos del cliente
  cliente_nombre TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  cliente_celular TEXT NOT NULL,
  notas_cliente TEXT,

  -- Datos del vendedor
  vendedor_id UUID REFERENCES users(id),
  vendedor_nombre TEXT,
  vendedor_email TEXT,
  vendedor_celular TEXT,
  notas_vendedor TEXT,

  -- Datos del inmueble
  inmueble_titulo TEXT NOT NULL,
  inmueble_direccion TEXT NOT NULL,
  inmueble_codigo TEXT,
  inmueble_url TEXT,
  inmueble_precio DECIMAL,

  -- Fecha y hora
  fecha_cita DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME,
  duracion_minutos INTEGER DEFAULT 60,

  -- Metadata
  metadata JSONB,
  google_event_id TEXT,

  -- Timestamps de estados
  confirmada_at TIMESTAMPTZ,
  cancelada_at TIMESTAMPTZ,
  completada_at TIMESTAMPTZ
);
```

**Estados posibles:**
- `pendiente`: Cita creada, esperando confirmación
- `confirmada`: Vendedor confirmó la cita
- `en_camino`: Vendedor está en camino
- `en_curso`: Cita en progreso
- `completada`: Cita finalizada exitosamente
- `cancelada_cliente`: Cliente canceló
- `cancelada_vendedor`: Vendedor canceló
- `no_asistio`: Cliente no se presentó

#### 2. **users** (Usuarios del Sistema)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  celular TEXT,
  role_id UUID REFERENCES roles(id),
  estado TEXT DEFAULT 'activo', -- 'activo', 'inactivo', 'suspendido'
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3. **roles** (Roles del Sistema)
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT UNIQUE NOT NULL,
  codigo TEXT UNIQUE NOT NULL, -- 'admin', 'vendedor', 'cliente'
  descripcion TEXT,
  permisos JSONB, -- { "appointments": ["read", "write"], ... }
  es_sistema BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Roles predefinidos:**
- `admin`: Acceso total al sistema
- `vendedor`: Gestiona sus citas y clientes
- `cliente`: Ve sus propias citas

#### 4. **commissions** (Comisiones)
```sql
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID REFERENCES users(id) NOT NULL,
  monto DECIMAL NOT NULL,
  estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'pagada', 'en_disputa'
  tipo_operacion TEXT, -- 'venta', 'arriendo', 'permuta'
  descripcion TEXT,
  fecha_operacion DATE,
  fecha_pago DATE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 5. **api_integrations** (Integraciones)
```sql
CREATE TABLE api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT UNIQUE NOT NULL, -- 'wasi', 'google_calendar', 'sendgrid'
  tipo TEXT NOT NULL, -- 'crm', 'calendar', 'email'
  configuracion JSONB NOT NULL, -- { "api_key": "...", "api_url": "..." }
  activo BOOLEAN DEFAULT true,
  ultima_sincronizacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 6. **audit_logs** (Auditoría)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES users(id),
  accion TEXT NOT NULL, -- 'create', 'update', 'delete'
  entidad TEXT NOT NULL, -- 'appointment', 'user', 'commission'
  entidad_id UUID,
  detalles JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🚀 Edge Functions (Endpoints Externos)

### Variables de Entorno Disponibles
Todas las Edge Functions tienen acceso automático a:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (admin access)
```

---

### 1. 📧 **send-email**

**Propósito**: Enviar emails transaccionales (notificaciones de citas, recordatorios, etc.)

**Endpoint**:
```
POST https://your-project.supabase.co/functions/v1/send-email
```

**Headers**:
```http
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

**Request Body**:
```json
{
  "to": "cliente@example.com",
  "subject": "Confirmación de Cita",
  "html": "<h1>Tu cita ha sido confirmada</h1><p>Detalles...</p>",
  "text": "Tu cita ha sido confirmada. Detalles..."
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "abc123...",
  "message": "Email sent successfully"
}
```

**Ejemplo con cURL**:
```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "cliente@example.com",
    "subject": "Confirmación de Cita",
    "html": "<h1>Cita Confirmada</h1>"
  }'
```

**Ejemplo con JavaScript**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: 'cliente@example.com',
    subject: 'Confirmación de Cita',
    html: '<h1>Tu cita ha sido confirmada</h1>'
  })
});

const data = await response.json();
console.log(data);
```

---

### 2. 🔑 **request-password-reset**

**Propósito**: Solicitar restablecimiento de contraseña

**Endpoint**:
```
POST https://your-project.supabase.co/functions/v1/request-password-reset
```

**Headers**:
```http
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "usuario@example.com"
}
```

**Response**:
```json
{
  "message": "Si el email existe, recibirás instrucciones para restablecer tu contraseña"
}
```

**Ejemplo con JavaScript**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/request-password-reset`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'usuario@example.com'
  })
});

const data = await response.json();
```

---

### 3. 🔐 **reset-password**

**Propósito**: Restablecer contraseña con token

**Endpoint**:
```
POST https://your-project.supabase.co/functions/v1/reset-password
```

**Headers**:
```http
Content-Type: application/json
```

**Request Body**:
```json
{
  "token": "abc123...",
  "newPassword": "NuevaContraseña123!"
}
```

**Response**:
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

---

### 4. 📅 **generate-calendar-event**

**Propósito**: Crear evento en Google Calendar para una cita

**Endpoint**:
```
POST https://your-project.supabase.co/functions/v1/generate-calendar-event
```

**Headers**:
```http
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

**Request Body**:
```json
{
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
  "summary": "Visita a propiedad en Av. Principal 123",
  "description": "Cliente: Juan Pérez\nPropiedad: Casa 3 habitaciones",
  "startTime": "2024-12-20T10:00:00-05:00",
  "endTime": "2024-12-20T11:00:00-05:00",
  "attendees": ["cliente@example.com", "vendedor@example.com"],
  "location": "Av. Principal 123, Bogotá"
}
```

**Response**:
```json
{
  "success": true,
  "eventId": "google_calendar_event_id",
  "htmlLink": "https://calendar.google.com/event?eid=..."
}
```

**Ejemplo con JavaScript**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-calendar-event`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    appointmentId: '550e8400-e29b-41d4-a716-446655440000',
    summary: 'Visita a propiedad',
    startTime: '2024-12-20T10:00:00-05:00',
    endTime: '2024-12-20T11:00:00-05:00',
    attendees: ['cliente@example.com']
  })
});

const data = await response.json();
```

---

### 5. 🔄 **sync-calendar-event**

**Propósito**: Sincronizar cambios de una cita con Google Calendar

**Endpoint**:
```
POST https://your-project.supabase.co/functions/v1/sync-calendar-event
```

**Headers**:
```http
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

**Request Body**:
```json
{
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
  "action": "update" // o "delete"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Event synchronized successfully"
}
```

---

### 6. 🔗 **google-calendar-oauth**

**Propósito**: Manejar autenticación OAuth2 con Google Calendar

**Endpoint**:
```
GET https://your-project.supabase.co/functions/v1/google-calendar-oauth?code=AUTH_CODE
```

**Query Parameters**:
- `code`: Código de autorización de Google

**Response**:
```json
{
  "success": true,
  "message": "OAuth configured successfully"
}
```

---

### 7. 👤 **create-admin-user**

**Propósito**: Crear usuario administrador (uso interno)

**Endpoint**:
```
POST https://your-project.supabase.co/functions/v1/create-admin-user
```

**Headers**:
```http
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123!",
  "nombre_completo": "Administrador Principal"
}
```

**Response**:
```json
{
  "success": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@example.com"
}
```

---

### 8. 🗑️ **delete-user**

**Propósito**: Eliminar usuario del sistema (borra de auth.users)

**Endpoint**:
```
POST https://your-project.supabase.co/functions/v1/delete-user
```

**Headers**:
```http
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 📦 Servicios Internos

Estos servicios se usan desde el frontend (React) usando Supabase Client.

### Inicialización del Cliente

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);
```

---

### 1. 📅 **Appointments Service** (Gestión de Citas)

#### **Crear Cita**
```javascript
// appointmentsAppService.createAppointment()

const { data, error } = await supabase
  .from('appointments_system')
  .insert({
    cliente_nombre: 'Juan Pérez',
    cliente_email: 'juan@example.com',
    cliente_celular: '+57 300 123 4567',
    inmueble_titulo: 'Casa en Chapinero',
    inmueble_direccion: 'Calle 60 #10-20',
    inmueble_codigo: 'PROP-001',
    fecha_cita: '2024-12-20',
    hora_inicio: '10:00',
    duracion_minutos: 60,
    estado: 'pendiente',
    notas_cliente: 'Interesado en 3 habitaciones'
  })
  .select()
  .single();
```

#### **Consultar Citas**
```javascript
// Obtener todas las citas
const { data: appointments } = await supabase
  .from('appointments_system')
  .select('*')
  .order('fecha_cita', { ascending: true });

// Filtrar por estado
const { data: pending } = await supabase
  .from('appointments_system')
  .select('*')
  .eq('estado', 'pendiente');

// Filtrar por vendedor
const { data: myAppointments } = await supabase
  .from('appointments_system')
  .select('*')
  .eq('vendedor_id', 'user-id-here');

// Filtrar por rango de fechas
const { data: rangeAppointments } = await supabase
  .from('appointments_system')
  .select('*')
  .gte('fecha_cita', '2024-12-01')
  .lte('fecha_cita', '2024-12-31');
```

#### **Actualizar Estado de Cita**
```javascript
// Confirmar cita
const { data } = await supabase
  .from('appointments_system')
  .update({
    estado: 'confirmada',
    confirmada_at: new Date().toISOString(),
    vendedor_id: 'vendor-id',
    vendedor_nombre: 'María García'
  })
  .eq('id', appointmentId)
  .select()
  .single();

// Cancelar cita
const { data } = await supabase
  .from('appointments_system')
  .update({
    estado: 'cancelada_cliente',
    cancelada_at: new Date().toISOString()
  })
  .eq('id', appointmentId)
  .select()
  .single();

// Marcar como completada
const { data } = await supabase
  .from('appointments_system')
  .update({
    estado: 'completada',
    completada_at: new Date().toISOString(),
    notas_vendedor: 'Cliente muy interesado'
  })
  .eq('id', appointmentId)
  .select()
  .single();
```

#### **Reprogramar Cita**
```javascript
const { data } = await supabase
  .from('appointments_system')
  .update({
    fecha_cita: '2024-12-25',
    hora_inicio: '15:00'
  })
  .eq('id', appointmentId)
  .select()
  .single();
```

---

### 2. 👥 **Users Service** (Gestión de Usuarios)

#### **Crear Usuario**
```javascript
// 1. Crear en auth.users
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email: 'nuevo@example.com',
  password: 'SecurePassword123!',
  email_confirm: true
});

// 2. Crear en users table
const { data: userData } = await supabase
  .from('users')
  .insert({
    id: authData.user.id,
    email: 'nuevo@example.com',
    nombre_completo: 'Usuario Nuevo',
    celular: '+57 300 123 4567',
    role_id: 'role-id-here'
  })
  .select()
  .single();
```

#### **Consultar Usuarios**
```javascript
// Todos los usuarios
const { data: users } = await supabase
  .from('users')
  .select(`
    *,
    roles (
      nombre,
      codigo
    )
  `);

// Por rol
const { data: vendedores } = await supabase
  .from('users')
  .select(`
    *,
    roles!inner (
      nombre,
      codigo
    )
  `)
  .eq('roles.codigo', 'vendedor')
  .eq('estado', 'activo');
```

#### **Actualizar Usuario**
```javascript
const { data } = await supabase
  .from('users')
  .update({
    nombre_completo: 'Nuevo Nombre',
    celular: '+57 300 999 8888',
    estado: 'activo'
  })
  .eq('id', userId)
  .select()
  .single();
```

---

### 3. 💰 **Commissions Service** (Comisiones)

#### **Crear Comisión**
```javascript
const { data } = await supabase
  .from('commissions')
  .insert({
    vendedor_id: 'vendor-id',
    monto: 5000000,
    tipo_operacion: 'venta',
    descripcion: 'Venta de propiedad PROP-001',
    fecha_operacion: '2024-12-15',
    estado: 'pendiente'
  })
  .select()
  .single();
```

#### **Consultar Comisiones**
```javascript
// Por vendedor
const { data: commissions } = await supabase
  .from('commissions')
  .select(`
    *,
    users (
      nombre_completo,
      email
    )
  `)
  .eq('vendedor_id', vendorId);

// Reporte mensual
const { data: monthly } = await supabase
  .from('commissions')
  .select('*')
  .gte('fecha_operacion', '2024-12-01')
  .lt('fecha_operacion', '2025-01-01')
  .eq('estado', 'pagada');

// Total por vendedor
const { data: totals } = await supabase
  .rpc('get_commissions_summary', {
    start_date: '2024-01-01',
    end_date: '2024-12-31'
  });
```

#### **Actualizar Estado**
```javascript
// Marcar como pagada
const { data } = await supabase
  .from('commissions')
  .update({
    estado: 'pagada',
    fecha_pago: new Date().toISOString()
  })
  .eq('id', commissionId)
  .select()
  .single();
```

---

### 4. 🔐 **Roles & Permissions Service**

#### **Consultar Roles**
```javascript
const { data: roles } = await supabase
  .from('roles')
  .select('*')
  .eq('activo', true);
```

#### **Verificar Permisos**
```javascript
// Obtener permisos del usuario actual
const { data: user } = await supabase.auth.getUser();

const { data: userData } = await supabase
  .from('users')
  .select(`
    *,
    roles (
      nombre,
      codigo,
      permisos
    )
  `)
  .eq('id', user.user.id)
  .single();

const permissions = userData.roles.permisos;
// permissions = { "appointments": ["read", "write"], "users": ["read"] }

// Verificar si tiene permiso
const canEditAppointments = permissions.appointments?.includes('write');
```

---

### 5. 🔌 **Integrations Service**

#### **Configurar Integración**
```javascript
// Guardar configuración de WASI
const { data } = await supabase
  .from('api_integrations')
  .insert({
    nombre: 'wasi',
    tipo: 'crm',
    configuracion: {
      api_url: 'https://api.wasi.co/v1',
      api_key: 'your-wasi-key',
      id_usuario: '12345'
    },
    activo: true
  })
  .select()
  .single();
```

#### **Consultar Integraciones**
```javascript
const { data: integrations } = await supabase
  .from('api_integrations')
  .select('*')
  .eq('activo', true);
```

---

### 6. 📊 **Dashboard Service** (Estadísticas)

#### **Métricas del Dashboard**
```javascript
// Total de citas por estado
const { count: totalPending } = await supabase
  .from('appointments_system')
  .select('*', { count: 'exact', head: true })
  .eq('estado', 'pendiente');

const { count: totalCompleted } = await supabase
  .from('appointments_system')
  .select('*', { count: 'exact', head: true })
  .eq('estado', 'completada');

// Citas del mes actual
const { data: monthAppointments } = await supabase
  .from('appointments_system')
  .select('*')
  .gte('fecha_cita', '2024-12-01')
  .lt('fecha_cita', '2025-01-01');

// Comisiones pendientes
const { data: pendingCommissions, count } = await supabase
  .from('commissions')
  .select('monto', { count: 'exact' })
  .eq('estado', 'pendiente');

const totalPending = pendingCommissions.reduce((sum, c) => sum + c.monto, 0);
```

---

### 7. 📝 **Audit Logs Service**

#### **Registrar Acción**
```javascript
const { data } = await supabase
  .from('audit_logs')
  .insert({
    usuario_id: currentUserId,
    accion: 'update',
    entidad: 'appointment',
    entidad_id: appointmentId,
    detalles: {
      cambios: {
        estado: { old: 'pendiente', new: 'confirmada' }
      }
    },
    ip_address: '192.168.1.1',
    user_agent: navigator.userAgent
  });
```

#### **Consultar Logs**
```javascript
// Logs de un usuario
const { data: logs } = await supabase
  .from('audit_logs')
  .select(`
    *,
    users (
      nombre_completo,
      email
    )
  `)
  .eq('usuario_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);

// Logs de una entidad específica
const { data: appointmentLogs } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('entidad', 'appointment')
  .eq('entidad_id', appointmentId)
  .order('created_at', { ascending: false });
```

---

## 🔐 Autenticación y Seguridad

### Login
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@example.com',
  password: 'password123'
});

// Obtener sesión actual
const { data: { session } } = await supabase.auth.getSession();

// Obtener usuario actual
const { data: { user } } = await supabase.auth.getUser();
```

### Logout
```javascript
await supabase.auth.signOut();
```

### Registro
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'nuevo@example.com',
  password: 'SecurePassword123!',
  options: {
    data: {
      nombre_completo: 'Usuario Nuevo'
    }
  }
});
```

### Tokens
```javascript
// El token se incluye automáticamente en las peticiones
// Pero puedes obtenerlo así:
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Usar token en peticiones manuales
const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🤖 Integración con Backend de IA

### Caso de Uso 1: Asistente Virtual para Agendar Citas

**Flujo:**
1. Usuario habla con IA: "Quiero ver la casa en Chapinero mañana a las 3pm"
2. IA extrae información y llama a tu backend
3. Tu backend consulta disponibilidad y crea la cita

**Implementación:**

```javascript
// En tu backend de IA
async function procesarSolicitudCita(userMessage, userId) {
  // 1. Extraer información con IA
  const extracted = await tuIA.extract(userMessage);
  // extracted = {
  //   propiedad: "Casa en Chapinero",
  //   fecha: "2024-12-17",
  //   hora: "15:00"
  // }

  // 2. Consultar propiedad en Supabase
  const { data: propiedad } = await supabase
    .from('propiedades') // si tienes tabla de propiedades
    .select('*')
    .ilike('titulo', `%${extracted.propiedad}%`)
    .single();

  // 3. Verificar disponibilidad
  const { data: existingAppointments } = await supabase
    .from('appointments_system')
    .select('*')
    .eq('fecha_cita', extracted.fecha)
    .gte('hora_inicio', extracted.hora)
    .lt('hora_inicio', calcularHoraFin(extracted.hora));

  if (existingAppointments.length > 0) {
    return "Lo siento, ese horario no está disponible";
  }

  // 4. Crear cita
  const { data: appointment } = await supabase
    .from('appointments_system')
    .insert({
      cliente_nombre: 'Usuario desde IA',
      cliente_email: 'extraido@de.conversacion',
      inmueble_titulo: propiedad.titulo,
      inmueble_direccion: propiedad.direccion,
      fecha_cita: extracted.fecha,
      hora_inicio: extracted.hora,
      estado: 'pendiente',
      metadata: {
        created_by_ai: true,
        conversation_id: 'conv-123'
      }
    })
    .select()
    .single();

  // 5. Enviar confirmación por email
  await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: appointment.cliente_email,
      subject: 'Cita Agendada',
      html: `<h1>Tu cita ha sido agendada para ${appointment.fecha_cita} a las ${appointment.hora_inicio}</h1>`
    })
  });

  return `¡Listo! Tu cita está agendada para ${extracted.fecha} a las ${extracted.hora}`;
}
```

---

### Caso de Uso 2: Análisis Predictivo

**Predecir probabilidad de cancelación:**

```javascript
async function analizarRiesgoCancelacion() {
  // 1. Obtener todas las citas históricas
  const { data: appointments } = await supabase
    .from('appointments_system')
    .select('*');

  // 2. Preparar datos para IA
  const features = appointments.map(apt => ({
    dia_semana: new Date(apt.fecha_cita).getDay(),
    hora: parseInt(apt.hora_inicio.split(':')[0]),
    tiene_notas: apt.notas_cliente ? 1 : 0,
    duracion: apt.duracion_minutos,
    precio_inmueble: apt.inmueble_precio || 0,
    fue_cancelada: apt.estado.includes('cancelada') ? 1 : 0
  }));

  // 3. Entrenar modelo o hacer predicción
  const predictions = await tuIA.predict(features);

  // 4. Actualizar metadata con predicciones
  for (let i = 0; i < appointments.length; i++) {
    if (!appointments[i].estado.includes('cancelada')) {
      await supabase
        .from('appointments_system')
        .update({
          metadata: {
            ...appointments[i].metadata,
            ai_predictions: {
              cancellation_risk: predictions[i].risk,
              confidence: predictions[i].confidence
            }
          }
        })
        .eq('id', appointments[i].id);
    }
  }

  return predictions;
}
```

---

### Caso de Uso 3: Recomendación de Vendedores

**Asignar el mejor vendedor para una cita:**

```javascript
async function recomendarVendedor(appointmentData) {
  // 1. Obtener todos los vendedores activos
  const { data: vendedores } = await supabase
    .from('users')
    .select(`
      *,
      roles!inner (codigo)
    `)
    .eq('roles.codigo', 'vendedor')
    .eq('estado', 'activo');

  // 2. Obtener historial de cada vendedor
  const vendedoresConStats = await Promise.all(
    vendedores.map(async (v) => {
      const { data: appointments } = await supabase
        .from('appointments_system')
        .select('*')
        .eq('vendedor_id', v.id);

      const completed = appointments.filter(a => a.estado === 'completada').length;
      const cancelled = appointments.filter(a => a.estado.includes('cancelada')).length;
      const total = appointments.length;

      return {
        ...v,
        stats: {
          total,
          completed,
          cancelled,
          success_rate: total > 0 ? completed / total : 0
        }
      };
    })
  );

  // 3. Consultar IA para recomendación
  const recommendation = await tuIA.recommendSeller({
    sellers: vendedoresConStats,
    appointment: appointmentData,
    criteria: ['success_rate', 'availability', 'location']
  });

  return recommendation.best_seller;
}
```

---

### Caso de Uso 4: Chatbot de Soporte

**Edge Function para Chatbot:**

```typescript
// supabase/functions/ai-chatbot/index.ts

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, context } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Determinar intención
    const intent = await detectIntent(message); // Tu función de IA

    // 2. Ejecutar acción según intención
    let response;

    switch (intent.type) {
      case 'consultar_cita':
        const { data: appointments } = await supabase
          .from('appointments_system')
          .select('*')
          .eq('cliente_email', context.userEmail)
          .order('fecha_cita', { ascending: false })
          .limit(5);

        response = formatAppointments(appointments);
        break;

      case 'cancelar_cita':
        const appointmentId = intent.entities.appointmentId;
        await supabase
          .from('appointments_system')
          .update({
            estado: 'cancelada_cliente',
            cancelada_at: new Date().toISOString()
          })
          .eq('id', appointmentId);

        response = "Tu cita ha sido cancelada exitosamente";
        break;

      case 'reagendar_cita':
        // Lógica de reagendamiento
        break;

      default:
        response = await tuIA.generateResponse(message, context);
    }

    // 3. Registrar en audit log
    await supabase.from('audit_logs').insert({
      usuario_id: userId,
      accion: 'chatbot_interaction',
      entidad: 'chatbot',
      detalles: {
        message,
        intent: intent.type,
        response
      }
    });

    return new Response(
      JSON.stringify({ response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 📊 Ejemplos de Consultas Útiles para IA

### Análisis de Patrones

```javascript
// 1. Horarios más populares
const { data } = await supabase.rpc('get_popular_hours');
// Custom SQL function que agrupa por hora

// 2. Tasa de conversión por vendedor
const { data: conversionRates } = await supabase
  .from('appointments_system')
  .select('vendedor_id, vendedor_nombre, estado')
  .not('vendedor_id', 'is', null);

// Procesar en JS
const stats = conversionRates.reduce((acc, apt) => {
  if (!acc[apt.vendedor_id]) {
    acc[apt.vendedor_id] = {
      nombre: apt.vendedor_nombre,
      total: 0,
      completadas: 0
    };
  }
  acc[apt.vendedor_id].total++;
  if (apt.estado === 'completada') {
    acc[apt.vendedor_id].completadas++;
  }
  return acc;
}, {});

// 3. Propiedades más visitadas
const { data: popularProps } = await supabase
  .from('appointments_system')
  .select('inmueble_codigo, inmueble_titulo')
  .not('inmueble_codigo', 'is', null);

const propCounts = popularProps.reduce((acc, apt) => {
  acc[apt.inmueble_codigo] = (acc[apt.inmueble_codigo] || 0) + 1;
  return acc;
}, {});

// 4. Tiempo promedio por cita
const { data: durations } = await supabase
  .from('appointments_system')
  .select('duracion_minutos')
  .eq('estado', 'completada');

const avgDuration = durations.reduce((sum, d) => sum + d.duracion_minutos, 0) / durations.length;
```

---

## 🔧 Configuración para tu Backend de IA

### Variables de Entorno Necesarias

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Tu API de IA
AI_API_URL=https://tu-backend-ia.com/api
AI_API_KEY=tu-api-key
```

### Estructura Recomendada para tu Backend

```
tu-backend-ia/
├── src/
│   ├── integrations/
│   │   ├── supabase.js          # Cliente de Supabase
│   │   └── appointments.js       # Funciones de citas
│   ├── ai/
│   │   ├── intent-detection.js  # Detectar intención
│   │   ├── entity-extraction.js # Extraer entidades
│   │   └── prediction.js        # Modelos predictivos
│   ├── services/
│   │   ├── chatbot.js           # Lógica del chatbot
│   │   └── recommendations.js   # Sistema de recomendaciones
│   └── index.js                 # API principal
├── package.json
└── .env
```

---

## 📝 Resumen de Endpoints

| Endpoint | Método | Propósito | Auth |
|----------|--------|-----------|------|
| `/functions/v1/send-email` | POST | Enviar emails | Anon Key |
| `/functions/v1/request-password-reset` | POST | Solicitar reset | Público |
| `/functions/v1/reset-password` | POST | Resetear password | Público |
| `/functions/v1/generate-calendar-event` | POST | Crear evento Google | Anon Key |
| `/functions/v1/sync-calendar-event` | POST | Sync evento Google | Anon Key |
| `/functions/v1/google-calendar-oauth` | GET | OAuth Google | Público |
| `/functions/v1/create-admin-user` | POST | Crear admin | Service Role |
| `/functions/v1/delete-user` | POST | Eliminar usuario | Anon Key |

---


1. **Configura tu cliente Supabase** en tu backend de IA
2. **Decide qué funcionalidad de IA** quieres implementar primero
3. **Crea un Edge Function** si necesitas un endpoint personalizado
4. **Prueba las integraciones** con los ejemplos de este documento
5. **Monitorea los logs** en `audit_logs` para debugging

---

## 📞 Contacto y Soporte

Para más información o ayuda con la integración, consulta:
- Documentación de Supabase: https://supabase.com/docs
- API Reference: Ver ejemplos en este documento
- Repositorio: [Tu repo aquí]

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0.0
