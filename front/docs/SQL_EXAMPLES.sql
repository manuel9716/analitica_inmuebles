-- ============================================
-- SQL EXAMPLES: Gestión de Tipos de Usuario
-- Busco Fácil Inmuebles
-- ============================================

-- ============================================
-- 1. CONSULTAR USUARIOS POR TIPO
-- ============================================

-- Ver todos los usuarios con su tipo
SELECT
  id,
  full_name,
  email,
  user_type,
  created_at
FROM auth.users
JOIN profiles ON auth.users.id = profiles.id
ORDER BY created_at DESC;

-- Contar usuarios por tipo
SELECT
  user_type,
  COUNT(*) as total
FROM profiles
GROUP BY user_type
ORDER BY total DESC;

-- Ver solo usuarios finales
SELECT * FROM profiles WHERE user_type = 'end_user';

-- Ver solo administradores
SELECT * FROM profiles WHERE user_type = 'admin';

-- Ver usuarios con permisos administrativos
SELECT * FROM profiles
WHERE user_type IN ('admin', 'trabajador_facil');


-- ============================================
-- 2. CAMBIAR TIPO DE USUARIO
-- ============================================

-- Promover usuario a administrador (por email)
UPDATE profiles
SET user_type = 'admin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'admin@ejemplo.com'
);

-- Promover usuario a broker (por ID)
UPDATE profiles
SET user_type = 'broker'
WHERE id = 'uuid-del-usuario';

-- Promover múltiples usuarios a trabajadores
UPDATE profiles
SET user_type = 'trabajador_facil'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'trabajador1@facilinmobiliaria.com',
    'trabajador2@facilinmobiliaria.com'
  )
);

-- Cambiar broker a propietario
UPDATE profiles
SET user_type = 'propietario'
WHERE user_type = 'broker'
AND id = 'uuid-del-usuario';

-- Degradar admin a usuario final
UPDATE profiles
SET user_type = 'end_user'
WHERE user_type = 'admin'
AND id = 'uuid-del-usuario';


-- ============================================
-- 3. VALIDAR TIPOS DE USUARIO
-- ============================================

-- Verificar que todos los usuarios tienen un tipo válido
SELECT id, user_type
FROM profiles
WHERE user_type NOT IN ('end_user', 'admin', 'broker', 'propietario', 'trabajador_facil', 'asesor');

-- Usuarios sin tipo asignado (no debería haber)
SELECT * FROM profiles WHERE user_type IS NULL;

-- Usuarios registrados recientemente (últimos 7 días)
SELECT
  au.email,
  p.full_name,
  p.user_type,
  p.created_at
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC;


-- ============================================
-- 4. ESTADÍSTICAS
-- ============================================

-- Resumen completo de usuarios
SELECT
  user_type,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as nuevos_ultimo_mes,
  MIN(created_at) as primer_usuario,
  MAX(created_at) as ultimo_usuario
FROM profiles
GROUP BY user_type
ORDER BY total_usuarios DESC;

-- Usuarios activos por tipo (con citas en los últimos 30 días)
SELECT
  p.user_type,
  COUNT(DISTINCT p.id) as usuarios_activos
FROM profiles p
JOIN appointments a ON p.id = a.user_id
WHERE a.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.user_type;


-- ============================================
-- 5. AUDITORÍA (Preparación)
-- ============================================

-- Crear tabla de auditoría para cambios de tipo de usuario
CREATE TABLE IF NOT EXISTS user_type_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  old_type TEXT,
  new_type TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Agregar índice
CREATE INDEX IF NOT EXISTS idx_user_type_audit_user_id ON user_type_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_user_type_audit_changed_at ON user_type_audit(changed_at);

-- Función para registrar cambios (trigger)
CREATE OR REPLACE FUNCTION log_user_type_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_type IS DISTINCT FROM NEW.user_type THEN
    INSERT INTO user_type_audit (user_id, old_type, new_type, notes)
    VALUES (NEW.id, OLD.user_type, NEW.user_type, 'Cambio automático vía trigger');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS user_type_change_trigger ON profiles;
CREATE TRIGGER user_type_change_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_user_type_change();

-- Ver historial de cambios de tipo de usuario
SELECT
  uta.changed_at,
  au.email as usuario_afectado,
  p.full_name,
  uta.old_type,
  uta.new_type,
  uta.notes
FROM user_type_audit uta
JOIN auth.users au ON uta.user_id = au.id
JOIN profiles p ON uta.user_id = p.id
ORDER BY uta.changed_at DESC
LIMIT 50;


-- ============================================
-- 6. CASOS DE USO ESPECÍFICOS
-- ============================================

-- Encontrar usuario para promover a admin
SELECT
  au.id,
  au.email,
  p.full_name,
  p.user_type,
  p.created_at
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE au.email LIKE '%@facilinmobiliaria.com'
AND p.user_type = 'end_user'
ORDER BY p.created_at;

-- Promover primer usuario registrado a admin
UPDATE profiles
SET user_type = 'admin'
WHERE id = (
  SELECT id FROM profiles
  WHERE user_type = 'end_user'
  ORDER BY created_at ASC
  LIMIT 1
);

-- Asignar permisos de broker a usuarios con propiedades
-- (Ejemplo: usuarios que han agregado propiedades deberían ser brokers)
UPDATE profiles
SET user_type = 'broker'
WHERE id IN (
  SELECT DISTINCT user_id
  FROM properties
  WHERE user_id IS NOT NULL
)
AND user_type = 'end_user';

-- Limpiar usuarios inactivos (sin actividad en 6 meses)
-- CUIDADO: Este comando elimina datos, usar con precaución
-- SELECT * FROM profiles WHERE ... -- Primero revisar
-- UPDATE profiles SET user_type = 'end_user' WHERE ...


-- ============================================
-- 7. SEGURIDAD: ROW LEVEL SECURITY
-- ============================================

-- Política: Solo admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'admin'
    OR id = auth.uid()
  );

-- Política: Solo el propio usuario puede actualizar su perfil básico
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    -- No pueden cambiar su propio user_type
    user_type = (SELECT user_type FROM profiles WHERE id = auth.uid())
  );

-- Política: Solo admins pueden cambiar user_type
-- NOTA: Esto requeriría una función personalizada o edge function

-- Ver políticas actuales
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';


-- ============================================
-- 8. MANTENIMIENTO
-- ============================================

-- Verificar integridad: usuarios sin perfil
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Crear perfiles faltantes con tipo end_user
INSERT INTO profiles (id, user_type)
SELECT au.id, 'end_user'
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Backup de tipos de usuario antes de cambios masivos
CREATE TABLE profiles_backup AS
SELECT * FROM profiles;

-- Restaurar desde backup
UPDATE profiles p
SET user_type = pb.user_type
FROM profiles_backup pb
WHERE p.id = pb.id;


-- ============================================
-- 9. REPORTES
-- ============================================

-- Reporte: Usuarios por tipo con actividad
SELECT
  p.user_type,
  COUNT(DISTINCT p.id) as total_usuarios,
  COUNT(DISTINCT a.id) as total_citas,
  COUNT(DISTINCT f.id) as total_favoritos
FROM profiles p
LEFT JOIN appointments a ON p.id = a.user_id
LEFT JOIN favorite_listings f ON p.id = f.user_id
GROUP BY p.user_type
ORDER BY total_usuarios DESC;

-- Reporte: Nuevos registros por semana
SELECT
  DATE_TRUNC('week', created_at) as semana,
  user_type,
  COUNT(*) as registros
FROM profiles
WHERE created_at > NOW() - INTERVAL '3 months'
GROUP BY semana, user_type
ORDER BY semana DESC, user_type;


-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

/*
PRECAUCIONES:
1. Siempre hacer backup antes de cambios masivos
2. Probar queries con SELECT antes de UPDATE
3. Usar transacciones para cambios múltiples
4. Documentar razones de cambios en tabla de auditoría
5. Notificar a usuarios cuando cambien sus permisos

PERMISOS RECOMENDADOS:
- Solo DBAs deberían poder ejecutar estos scripts
- Implementar panel administrativo web en el futuro
- Registrar todos los cambios de tipo en auditoría
- Revisar periódicamente usuarios con permisos elevados

CONTACTO:
Para cambios de tipo de usuario, contactar a:
- Administrador de Base de Datos
- CTO / Líder Técnico
*/
