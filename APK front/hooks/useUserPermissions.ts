import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types';

interface UserPermissions {
  canManageUsers: boolean;
  canManageProperties: boolean;
  canManageAppointments: boolean;
  canViewAllAppointments: boolean;
  canManageCommissions: boolean;
  canViewAllCommissions: boolean;
  canViewAnalytics: boolean;
  canAccessAdminPanel: boolean;
}

const PERMISSIONS_BY_USER_TYPE: Record<UserType, UserPermissions> = {
  end_user: {
    canManageUsers: false,
    canManageProperties: false,
    canManageAppointments: false,
    canViewAllAppointments: false,
    canManageCommissions: false,
    canViewAllCommissions: false,
    canViewAnalytics: false,
    canAccessAdminPanel: false,
  },
  admin: {
    canManageUsers: true,
    canManageProperties: true,
    canManageAppointments: true,
    canViewAllAppointments: true,
    canManageCommissions: true,
    canViewAllCommissions: true,
    canViewAnalytics: true,
    canAccessAdminPanel: true,
  },
  broker: {
    canManageUsers: false,
    canManageProperties: true,
    canManageAppointments: true,
    canViewAllAppointments: false,
    canManageCommissions: false,
    canViewAllCommissions: false,
    canViewAnalytics: false,
    canAccessAdminPanel: false,
  },
  propietario: {
    canManageUsers: false,
    canManageProperties: true,
    canManageAppointments: true,
    canViewAllAppointments: false,
    canManageCommissions: false,
    canViewAllCommissions: false,
    canViewAnalytics: false,
    canAccessAdminPanel: false,
  },
  trabajador_facil: {
    canManageUsers: false,
    canManageProperties: true,
    canManageAppointments: true,
    canViewAllAppointments: true,
    canManageCommissions: true,
    canViewAllCommissions: true,
    canViewAnalytics: true,
    canAccessAdminPanel: true,
  },
  asesor: {
    canManageUsers: false,
    canManageProperties: true,
    canManageAppointments: true,
    canViewAllAppointments: false,
    canManageCommissions: false,
    canViewAllCommissions: false,
    canViewAnalytics: false,
    canAccessAdminPanel: false,
  },
};

export function useUserPermissions(): UserPermissions {
  const { userType } = useAuth();
  return PERMISSIONS_BY_USER_TYPE[userType];
}

export function useCanAccessFeature(featureName: keyof UserPermissions): boolean {
  const permissions = useUserPermissions();
  return permissions[featureName];
}
