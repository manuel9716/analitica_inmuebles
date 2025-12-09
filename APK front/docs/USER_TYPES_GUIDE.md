# Guía de Tipos de Usuario - Busco Fácil Inmuebles

## Descripción General

El sistema de Busco Fácil Inmuebles implementa un sistema de tipos de usuario que permite diferenciar entre usuarios finales (quienes se registran a través de la app) y usuarios con funciones administrativas u operativas.

## Tipos de Usuario

### 1. `end_user` - Usuario Final (Por Defecto)
**Asignación:** Automáticamente cuando alguien se registra desde la app.

**Permisos:**
- Ver propiedades
- Guardar favoritos
- Agendar citas para ver propiedades
- Ver su propio historial de búsquedas
- Ver sus propias citas
- Compartir propiedades por WhatsApp

**Restricciones:**
- No puede acceder al panel administrativo
- No puede gestionar propiedades de otros
- No puede ver todas las citas del sistema
- No puede gestionar comisiones

### 2. `admin` - Administrador del Sistema
**Asignación:** Manual (requiere acceso a base de datos).

**Permisos:**
- Todos los permisos del sistema
- Gestionar usuarios
- Gestionar propiedades
- Ver y gestionar todas las citas
- Gestionar comisiones
- Ver analíticas
- Acceso completo al panel administrativo

### 3. `broker` - Broker Inmobiliario
**Asignación:** Manual por un administrador.

**Permisos:**
- Gestionar sus propias propiedades
- Crear y gestionar citas
- Ver sus propias comisiones
- Contactar compradores

**Restricciones:**
- No puede ver citas de otros brokers
- No puede gestionar comisiones globalmente
- No accede al panel administrativo

### 4. `propietario` - Propietario de Inmuebles
**Asignación:** Manual por un administrador.

**Permisos:**
- Gestionar sus propias propiedades
- Ver citas relacionadas con sus propiedades
- Recibir notificaciones de interesados

**Restricciones:**
- No puede ver propiedades de otros propietarios
- No puede gestionar comisiones
- No accede al panel administrativo

### 5. `trabajador_facil` - Trabajador de Fácil Inmobiliaria
**Asignación:** Manual por un administrador.

**Permisos:**
- Gestionar propiedades
- Ver y gestionar todas las citas
- Gestionar comisiones
- Ver analíticas
- Acceso al panel administrativo

**Restricciones:**
- No puede gestionar usuarios (solo admin)

### 6. `asesor` - Asesor Independiente
**Asignación:** Manual por un administrador.

**Permisos:**
- Gestionar sus propias propiedades
- Crear y gestionar citas
- Contactar compradores

**Restricciones:**
- No puede ver citas de otros asesores
- No puede gestionar comisiones
- No accede al panel administrativo

## Implementación Técnica

### 1. Base de Datos

El campo `user_type` se encuentra en la tabla `profiles`:

```sql
ALTER TABLE profiles ADD COLUMN user_type TEXT DEFAULT 'end_user'
  CHECK (user_type IN ('end_user', 'admin', 'broker', 'propietario', 'trabajador_facil', 'asesor'));
```

### 2. Registro de Usuarios

Cuando un usuario se registra desde la app, automáticamente se le asigna `user_type = 'end_user'`:

```typescript
// En authService.ts
await supabase.from('profiles').upsert({
  id: data.user.id,
  full_name: metadata.full_name,
  phone: metadata.phone,
  user_type: 'end_user', // Asignación automática
  // ... otros campos
});
```

### 3. AuthContext

El `AuthContext` expone información sobre el tipo de usuario:

```typescript
const {
  userType,      // 'end_user' | 'admin' | 'broker' | etc.
  isEndUser,     // true si es usuario final
  isAdmin,       // true si es administrador
  isBroker,      // true si es broker
  profile,       // Perfil completo del usuario
} = useAuth();
```

### 4. Hook de Permisos

El hook `useUserPermissions` permite verificar permisos específicos:

```typescript
import { useUserPermissions } from '@/hooks/useUserPermissions';

const permissions = useUserPermissions();

if (permissions.canAccessAdminPanel) {
  // Mostrar enlace al panel admin
}

if (permissions.canManageAppointments) {
  // Mostrar botón de crear cita
}
```

### 5. Componente de Protección

El componente `PermissionGuard` permite proteger secciones de la UI:

```typescript
import { PermissionGuard } from '@/components/PermissionGuard';

// Proteger por tipo de usuario
<PermissionGuard requiredUserType="admin">
  <AdminButton />
</PermissionGuard>

// Proteger por permiso específico
<PermissionGuard requiredPermission="canManageAppointments">
  <CreateAppointmentButton />
</PermissionGuard>

// Proteger por múltiples tipos
<PermissionGuard requiredUserType={['admin', 'trabajador_facil']}>
  <ManageCommissionsButton />
</PermissionGuard>

// Con mensaje de error
<PermissionGuard
  requiredPermission="canViewAnalytics"
  showMessage={true}
>
  <AnalyticsChart />
</PermissionGuard>

// Con fallback personalizado
<PermissionGuard
  requiredPermission="canAccessAdminPanel"
  fallback={<Text>Acceso restringido</Text>}
>
  <AdminPanel />
</PermissionGuard>
```

## Ejemplos de Uso

### Ejemplo 1: Mostrar Badge de Tipo de Usuario

```typescript
// En profile.tsx
const { userType, isEndUser } = useAuth();

{!isEndUser && (
  <View style={styles.badge}>
    <Text>{getUserTypeLabel(userType)}</Text>
  </View>
)}
```

### Ejemplo 2: Condicionar Navegación

```typescript
// En _layout.tsx
const { userType } = useAuth();
const permissions = useUserPermissions();

<Tabs>
  <Tabs.Screen name="index" />
  <Tabs.Screen name="favorites" />

  {permissions.canAccessAdminPanel && (
    <Tabs.Screen name="admin" />
  )}
</Tabs>
```

### Ejemplo 3: Filtrar Datos por Tipo de Usuario

```typescript
const { userType, user } = useAuth();

const fetchAppointments = async () => {
  if (userType === 'end_user') {
    // Solo sus citas
    return await appointmentService.getUserAppointments(user.id);
  } else if (userType === 'admin' || userType === 'trabajador_facil') {
    // Todas las citas
    return await appointmentService.getAllAppointments();
  } else {
    // Citas relacionadas con sus propiedades
    return await appointmentService.getAppointmentsByBroker(user.id);
  }
};
```

## Cambiar el Tipo de Usuario

Para cambiar el tipo de usuario de una persona, un administrador debe ejecutar:

```sql
-- Cambiar a broker
UPDATE profiles
SET user_type = 'broker'
WHERE id = 'user-uuid-here';

-- Cambiar a admin
UPDATE profiles
SET user_type = 'admin'
WHERE id = 'user-uuid-here';
```

**IMPORTANTE:** Solo usuarios con acceso directo a la base de datos pueden cambiar el tipo de usuario. En una futura actualización, esto se podrá hacer desde un panel administrativo web.

## Seguridad

### Row Level Security (RLS)

Se recomienda implementar políticas RLS que respeten los tipos de usuario:

```sql
-- Solo admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'admin'
    OR id = auth.uid()
  );

-- Solo admins y trabajadores pueden ver todas las citas
CREATE POLICY "Admins and workers can view all appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    (SELECT user_type FROM profiles WHERE id = auth.uid()) IN ('admin', 'trabajador_facil')
    OR user_id = auth.uid()
  );
```

## Mejores Prácticas

1. **Siempre validar en el backend:** No confíes solo en validaciones del frontend. Los Edge Functions deben verificar el `user_type` desde la base de datos.

2. **Usar el hook de permisos:** En lugar de verificar el `userType` directamente, usa `useUserPermissions()` para mantener consistencia.

3. **Documentar cambios de permisos:** Si cambias los permisos de un tipo de usuario, actualiza este documento.

4. **Logging:** Registra cambios de tipo de usuario en una tabla de auditoría.

5. **Testing:** Prueba cada flujo con diferentes tipos de usuario para asegurar que los permisos funcionan correctamente.

## FAQ

### ¿Cómo puedo crear un usuario admin inicial?

Debes registrarte normalmente en la app y luego ejecutar:

```sql
UPDATE profiles
SET user_type = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'tu-email@example.com');
```

### ¿Los usuarios pueden cambiar su propio tipo?

No. El `user_type` solo puede ser modificado por administradores con acceso directo a la base de datos o mediante un panel administrativo autorizado.

### ¿Qué pasa si un usuario no tiene perfil?

El `AuthContext` asigna por defecto `user_type = 'end_user'` si no encuentra un perfil, garantizando que siempre haya un tipo de usuario válido.

### ¿Puedo agregar nuevos tipos de usuario?

Sí, pero debes:
1. Agregar el nuevo tipo al CHECK constraint de la tabla
2. Actualizar el tipo TypeScript `UserType`
3. Agregar los permisos en `PERMISSIONS_BY_USER_TYPE`
4. Actualizar la función `getUserTypeLabel()`
5. Documentar en este archivo

## Changelog

### 2024-11-28
- Implementación inicial del sistema de tipos de usuario
- Creación de migración para campo `user_type`
- Implementación de `useUserPermissions` hook
- Creación de componente `PermissionGuard`
- Integración con `AuthContext`
