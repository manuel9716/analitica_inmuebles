import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions, useCanAccessFeature } from '@/hooks/useUserPermissions';
import { UserType } from '@/types';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredUserType?: UserType | UserType[];
  requiredPermission?: keyof ReturnType<typeof useUserPermissions>;
  fallback?: React.ReactNode;
  showMessage?: boolean;
}

export function PermissionGuard({
  children,
  requiredUserType,
  requiredPermission,
  fallback,
  showMessage = false,
}: PermissionGuardProps) {
  const { userType } = useAuth();
  const permissions = useUserPermissions();

  let hasAccess = true;

  if (requiredUserType) {
    if (Array.isArray(requiredUserType)) {
      hasAccess = requiredUserType.includes(userType);
    } else {
      hasAccess = userType === requiredUserType;
    }
  }

  if (requiredPermission && hasAccess) {
    hasAccess = permissions[requiredPermission];
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showMessage) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            No tienes permisos para acceder a esta funcionalidad
          </Text>
        </View>
      );
    }

    return null;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  messageContainer: {
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  messageText: {
    color: '#92400E',
    textAlign: 'center',
    fontSize: 14,
  },
});
