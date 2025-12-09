// ============================================
// EJEMPLOS DE CÓDIGO: Sistema de Tipos de Usuario
// Busco Fácil Inmuebles
// ============================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions, useCanAccessFeature } from '@/hooks/useUserPermissions';
import { PermissionGuard } from '@/components/PermissionGuard';

// ============================================
// EJEMPLO 1: Verificar tipo de usuario básico
// ============================================

export function Example1_BasicUserType() {
  const { userType, isEndUser, isAdmin, isBroker } = useAuth();

  return (
    <View>
      <Text>Tu tipo de usuario: {userType}</Text>

      {isEndUser && <Text>Eres un usuario final</Text>}
      {isAdmin && <Text>Eres administrador</Text>}
      {isBroker && <Text>Eres broker</Text>}
    </View>
  );
}

// ============================================
// EJEMPLO 2: Mostrar información del perfil
// ============================================

export function Example2_UserProfile() {
  const { user, profile, userType } = useAuth();

  if (!user || !profile) {
    return <Text>No has iniciado sesión</Text>;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Perfil de Usuario</Text>
      <Text>Email: {user.email}</Text>
      <Text>Nombre: {profile.full_name}</Text>
      <Text>Teléfono: {profile.phone}</Text>
      <Text>Tipo: {userType}</Text>
    </View>
  );
}

// ============================================
// EJEMPLO 3: Verificar permisos específicos
// ============================================

export function Example3_CheckPermissions() {
  const permissions = useUserPermissions();

  return (
    <View>
      <Text>Permisos disponibles:</Text>

      {permissions.canManageUsers && (
        <Text>✅ Puedes gestionar usuarios</Text>
      )}

      {permissions.canManageAppointments && (
        <Text>✅ Puedes gestionar citas</Text>
      )}

      {permissions.canViewAllCommissions && (
        <Text>✅ Puedes ver todas las comisiones</Text>
      )}

      {permissions.canAccessAdminPanel && (
        <Text>✅ Tienes acceso al panel admin</Text>
      )}
    </View>
  );
}

// ============================================
// EJEMPLO 4: Botón condicional según permisos
// ============================================

export function Example4_ConditionalButton() {
  const permissions = useUserPermissions();

  return (
    <View>
      {permissions.canManageAppointments && (
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Crear Nueva Cita</Text>
        </TouchableOpacity>
      )}

      {!permissions.canManageAppointments && (
        <Text>No tienes permisos para crear citas</Text>
      )}
    </View>
  );
}

// ============================================
// EJEMPLO 5: Usar PermissionGuard (Básico)
// ============================================

export function Example5_PermissionGuardBasic() {
  return (
    <View>
      <Text>Funcionalidades según tu rol:</Text>

      {/* Solo visible para admins */}
      <PermissionGuard requiredUserType="admin">
        <TouchableOpacity style={styles.adminButton}>
          <Text>Panel de Administración</Text>
        </TouchableOpacity>
      </PermissionGuard>

      {/* Solo visible para brokers */}
      <PermissionGuard requiredUserType="broker">
        <TouchableOpacity style={styles.button}>
          <Text>Gestionar Mis Propiedades</Text>
        </TouchableOpacity>
      </PermissionGuard>

      {/* Visible para todos menos end_user */}
      <PermissionGuard
        requiredUserType={['admin', 'broker', 'trabajador_facil', 'propietario', 'asesor']}
      >
        <TouchableOpacity style={styles.button}>
          <Text>Panel Profesional</Text>
        </TouchableOpacity>
      </PermissionGuard>
    </View>
  );
}

// ============================================
// EJEMPLO 6: PermissionGuard con fallback
// ============================================

export function Example6_PermissionGuardWithFallback() {
  return (
    <PermissionGuard
      requiredUserType="admin"
      fallback={
        <View style={styles.warningCard}>
          <Text>Esta función solo está disponible para administradores</Text>
        </View>
      }
    >
      <View style={styles.card}>
        <Text style={styles.title}>Panel de Administración</Text>
        <Text>Aquí puedes gestionar usuarios y configuraciones</Text>
      </View>
    </PermissionGuard>
  );
}

// ============================================
// EJEMPLO 7: PermissionGuard con mensaje
// ============================================

export function Example7_PermissionGuardWithMessage() {
  return (
    <PermissionGuard
      requiredPermission="canViewAnalytics"
      showMessage={true}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Analíticas</Text>
        <Text>Gráficas y estadísticas del sistema</Text>
      </View>
    </PermissionGuard>
  );
}

// ============================================
// EJEMPLO 8: Navegación condicional
// ============================================

export function Example8_ConditionalNavigation() {
  const { userType } = useAuth();
  const permissions = useUserPermissions();

  const handleNavigate = () => {
    if (userType === 'end_user') {
      // Navegar a perfil de usuario
      console.log('Navegar a: /profile');
    } else if (permissions.canAccessAdminPanel) {
      // Navegar a panel admin
      console.log('Navegar a: /admin');
    } else {
      // Navegar a panel profesional
      console.log('Navegar a: /professional');
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleNavigate}>
      <Text style={styles.buttonText}>
        {userType === 'end_user' ? 'Mi Perfil' : 'Panel Profesional'}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================
// EJEMPLO 9: Filtrar datos según tipo de usuario
// ============================================

export function Example9_FilterDataByUserType() {
  const { userType, user } = useAuth();
  const [appointments, setAppointments] = React.useState([]);

  React.useEffect(() => {
    const fetchAppointments = async () => {
      let data;

      if (userType === 'end_user') {
        // Solo sus propias citas
        data = await fetchUserAppointments(user.id);
      } else if (userType === 'admin' || userType === 'trabajador_facil') {
        // Todas las citas
        data = await fetchAllAppointments();
      } else if (userType === 'broker' || userType === 'propietario') {
        // Citas relacionadas con sus propiedades
        data = await fetchBrokerAppointments(user.id);
      }

      setAppointments(data);
    };

    fetchAppointments();
  }, [userType, user]);

  return (
    <View>
      <Text>Mis Citas ({appointments.length})</Text>
      {/* Renderizar lista de citas */}
    </View>
  );
}

// ============================================
// EJEMPLO 10: Tabs condicionales en navegación
// ============================================

export function Example10_ConditionalTabs() {
  const permissions = useUserPermissions();

  return (
    <View style={styles.tabBar}>
      {/* Tab siempre visible */}
      <TouchableOpacity style={styles.tab}>
        <Text>Inicio</Text>
      </TouchableOpacity>

      {/* Tab solo para usuarios con permisos */}
      {permissions.canManageProperties && (
        <TouchableOpacity style={styles.tab}>
          <Text>Propiedades</Text>
        </TouchableOpacity>
      )}

      {/* Tab solo para admins y trabajadores */}
      {permissions.canAccessAdminPanel && (
        <TouchableOpacity style={styles.tab}>
          <Text>Admin</Text>
        </TouchableOpacity>
      )}

      {/* Tab solo para usuarios finales */}
      {!permissions.canAccessAdminPanel && (
        <TouchableOpacity style={styles.tab}>
          <Text>Favoritos</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================
// EJEMPLO 11: Badge de tipo de usuario
// ============================================

export function Example11_UserTypeBadge() {
  const { userType, isEndUser } = useAuth();

  if (isEndUser) {
    return null; // No mostrar badge para usuarios finales
  }

  const getUserTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      broker: 'Broker',
      propietario: 'Propietario',
      trabajador_facil: 'Trabajador',
      asesor: 'Asesor',
    };
    return labels[type] || type;
  };

  const getBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      admin: '#EF4444',
      broker: '#3B82F6',
      propietario: '#10B981',
      trabajador_facil: '#F59E0B',
      asesor: '#8B5CF6',
    };
    return colors[type] || '#6B7280';
  };

  return (
    <View style={[styles.badge, { backgroundColor: getBadgeColor(userType) }]}>
      <Text style={styles.badgeText}>{getUserTypeLabel(userType)}</Text>
    </View>
  );
}

// ============================================
// EJEMPLO 12: Formulario con campos condicionales
// ============================================

export function Example12_ConditionalForm() {
  const { userType } = useAuth();
  const permissions = useUserPermissions();

  return (
    <View style={styles.form}>
      {/* Campo visible para todos */}
      <Text>Nombre:</Text>
      <input placeholder="Tu nombre" />

      {/* Campo solo para brokers y propietarios */}
      {(userType === 'broker' || userType === 'propietario') && (
        <>
          <Text>Licencia profesional:</Text>
          <input placeholder="Número de licencia" />
        </>
      )}

      {/* Campo solo para admins */}
      {permissions.canManageUsers && (
        <>
          <Text>Asignar permisos especiales:</Text>
          <input type="checkbox" />
        </>
      )}
    </View>
  );
}

// ============================================
// EJEMPLO 13: API call con validación de permisos
// ============================================

export function Example13_ProtectedAPICall() {
  const { userType } = useAuth();
  const permissions = useUserPermissions();

  const deleteUser = async (userId: string) => {
    // Verificar permisos antes de hacer la llamada
    if (!permissions.canManageUsers) {
      alert('No tienes permisos para eliminar usuarios');
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // El backend también debe verificar el user_type
        },
      });

      if (response.ok) {
        alert('Usuario eliminado correctamente');
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
    }
  };

  return (
    <PermissionGuard requiredPermission="canManageUsers">
      <TouchableOpacity
        style={styles.dangerButton}
        onPress={() => deleteUser('user-id')}
      >
        <Text style={styles.buttonText}>Eliminar Usuario</Text>
      </TouchableOpacity>
    </PermissionGuard>
  );
}

// ============================================
// EJEMPLO 14: Refresh del perfil
// ============================================

export function Example14_RefreshProfile() {
  const { refreshProfile, profile } = useAuth();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
      alert('Perfil actualizado');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View>
      <Text>Tipo actual: {profile?.user_type}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handleRefresh}
        disabled={isRefreshing}
      >
        <Text>{isRefreshing ? 'Actualizando...' : 'Actualizar Perfil'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// EJEMPLO 15: Hook personalizado para feature flag
// ============================================

function useFeatureFlag(featureName: string) {
  const permissions = useUserPermissions();
  const { userType } = useAuth();

  const featureAccess: Record<string, boolean> = {
    analytics: permissions.canViewAnalytics,
    bulkActions: userType === 'admin',
    advancedSearch: userType !== 'end_user',
    exportData: permissions.canAccessAdminPanel,
  };

  return featureAccess[featureName] || false;
}

export function Example15_FeatureFlag() {
  const hasAnalytics = useFeatureFlag('analytics');
  const hasBulkActions = useFeatureFlag('bulkActions');

  return (
    <View>
      {hasAnalytics && (
        <TouchableOpacity style={styles.button}>
          <Text>Ver Analíticas</Text>
        </TouchableOpacity>
      )}

      {hasBulkActions && (
        <TouchableOpacity style={styles.button}>
          <Text>Acciones en Lote</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================
// ESTILOS
// ============================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 4,
  },
  adminButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 4,
  },
  dangerButton: {
    backgroundColor: '#DC2626',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  form: {
    padding: 16,
  },
});

// ============================================
// FUNCIONES AUXILIARES (MOCK)
// ============================================

async function fetchUserAppointments(userId: string) {
  // Implementar llamada real a la API
  return [];
}

async function fetchAllAppointments() {
  // Implementar llamada real a la API
  return [];
}

async function fetchBrokerAppointments(brokerId: string) {
  // Implementar llamada real a la API
  return [];
}
