# Cambios Implementados: Sistema de Tipos de Usuario

## Resumen

Se ha implementado un sistema de tipos de usuario (`user_type`) para diferenciar entre usuarios finales que se registran en la app y usuarios con funciones administrativas u operativas.

## Archivos Modificados

### 1. Base de Datos
- **Nueva migración:** Se agregó la migración para el campo `user_type` (aplicada automáticamente)
  - Campo: `profiles.user_type`
  - Valores posibles: `'end_user'`, `'admin'`, `'broker'`, `'propietario'`, `'trabajador_facil'`, `'asesor'`
  - Valor por defecto: `'end_user'`

### 2. Types (`types/index.ts`)
- ✅ Agregado tipo `UserType`
- ✅ Actualizada interfaz `UserProfile` con campo `user_type`

### 3. Auth Service (`services/authService.ts`)
- ✅ Modificado `signUp()` para asignar automáticamente `user_type: 'end_user'` cuando alguien se registra

### 4. Auth Context (`contexts/AuthContext.tsx`)
- ✅ Agregado campo `profile: UserProfile | null`
- ✅ Agregado campo `userType: UserType`
- ✅ Agregados helpers: `isEndUser`, `isAdmin`, `isBroker`
- ✅ Agregado método `refreshProfile()`
- ✅ Carga automática del perfil al iniciar sesión o registrarse

### 5. Profile Service (`services/profileService.ts`)
- Sin cambios (ya tenía los métodos necesarios)

### 6. Profile Screen (`app/(main)/profile.tsx`)
- ✅ Agregado badge visual que muestra el tipo de usuario (solo visible para usuarios no-finales)
- ✅ Usa el nuevo `userType` del AuthContext

## Archivos Nuevos

### 1. Hook de Permisos (`hooks/useUserPermissions.ts`)
Hook personalizado que retorna los permisos basados en el tipo de usuario:
- `canManageUsers`
- `canManageProperties`
- `canManageAppointments`
- `canViewAllAppointments`
- `canManageCommissions`
- `canViewAllCommissions`
- `canViewAnalytics`
- `canAccessAdminPanel`

También exporta `useCanAccessFeature(featureName)` para verificar permisos individuales.

### 2. Componente de Protección (`components/PermissionGuard.tsx`)
Componente que permite proteger secciones de la UI basándose en:
- Tipo de usuario requerido
- Permiso específico requerido
- Puede mostrar un mensaje de error o un fallback personalizado

### 3. Documentación (`docs/USER_TYPES_GUIDE.md`)
Guía completa que explica:
- Todos los tipos de usuario y sus permisos
- Implementación técnica
- Ejemplos de uso
- Cómo cambiar el tipo de usuario
- Mejores prácticas de seguridad
- FAQ

## Cómo Funciona

### Registro Normal (App)
```typescript
// Usuario se registra en la app
await signUp(email, password, sessionId, {
  full_name: "Juan Pérez",
  phone: "+573001234567"
});

// Automáticamente se crea con user_type = 'end_user'
```

### Verificación de Permisos
```typescript
// En cualquier componente
const { userType, isEndUser, isAdmin } = useAuth();
const permissions = useUserPermissions();

if (permissions.canAccessAdminPanel) {
  // Mostrar panel de administración
}
```

### Proteger UI
```typescript
import { PermissionGuard } from '@/components/PermissionGuard';

<PermissionGuard requiredPermission="canManageAppointments">
  <CreateAppointmentButton />
</PermissionGuard>
```

## Cambiar Tipo de Usuario

Para promover un usuario a admin, broker, etc., se debe ejecutar SQL directamente:

```sql
UPDATE profiles
SET user_type = 'admin'
WHERE id = 'user-uuid-here';
```

**NOTA:** En el futuro, esto se podrá hacer desde un panel administrativo web.

## Compatibilidad

- ✅ Usuarios existentes: Automáticamente se les asigna `user_type = 'end_user'`
- ✅ Backward compatible: El código existente sigue funcionando
- ✅ Type-safe: Todas las validaciones con TypeScript
- ✅ No breaking changes: La app funciona exactamente igual para usuarios finales

## Testing

Para probar diferentes tipos de usuario:

1. Registra un usuario normal (será `end_user`)
2. Ve al perfil, verás que NO aparece el badge de tipo de usuario
3. Para probar como admin:
   ```sql
   UPDATE profiles
   SET user_type = 'admin'
   WHERE email = 'tu-email@test.com';
   ```
4. Cierra sesión y vuelve a iniciar sesión
5. Ve al perfil, ahora verás el badge "Administrador"

## Próximos Pasos

1. Implementar panel administrativo web para gestionar usuarios
2. Agregar RLS policies específicas por tipo de usuario
3. Implementar logging de auditoría para cambios de tipo
4. Crear endpoints protegidos en Edge Functions que validen el tipo de usuario

## Soporte

Para más información, consulta la documentación completa en:
`docs/USER_TYPES_GUIDE.md`
