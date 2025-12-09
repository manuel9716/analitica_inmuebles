import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { VoiceProvider } from '@/contexts/VoiceContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { View, ActivityIndicator } from 'react-native';
import { getColors, BRAND_COLORS } from '@/constants/theme';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const colors = getColors(isDark);

  useEffect(() => {
    if (loading) return;

    const inMainGroup = segments[0] === '(main)';
    const isModalRoute = ['property-details', 'schedule-visit', 'compare-properties', 'whatsapp-contacts', 'shared-property', 'edit-profile', 'appointments', 'appointment-detail', 'settings', 'help-center', 'recently-viewed', 'saved-searches'].includes(segments[0] as string);

    console.log('[RootLayout] Navigation check - segments:', segments, 'inMainGroup:', inMainGroup, 'isModalRoute:', isModalRoute);

    if (!inMainGroup && !isModalRoute) {
      console.log('[RootLayout] Redirecting to /(main)');
      router.replace('/(main)');
    }
  }, [segments, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: '#08509C',
          },
          headerTintColor: BRAND_COLORS.white,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerBackTitle: '',
        }}
      >
        <Stack.Screen name="(main)" />
        <Stack.Screen
          name="profile/settings"
          options={{
            headerShown: true,
            title: 'Configuración',
          }}
        />
        <Stack.Screen
          name="profile/edit"
          options={{
            headerShown: true,
            title: 'Editar Perfil',
          }}
        />
        <Stack.Screen
          name="profile/appointments"
          options={{
            headerShown: true,
            title: 'Mis Citas',
          }}
        />
        <Stack.Screen
          name="profile/recently-viewed"
          options={{
            headerShown: true,
            title: 'Vistas Recientes',
          }}
        />
        <Stack.Screen
          name="profile/saved-searches"
          options={{
            headerShown: true,
            title: 'Búsquedas Guardadas',
          }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{
            headerShown: true,
            title: 'Editar Perfil',
            presentation: 'card'
          }}
        />
        <Stack.Screen
          name="appointments"
          options={{
            headerShown: true,
            title: 'Mis Citas',
            presentation: 'card'
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: 'Configuración',
            presentation: 'card'
          }}
        />
        <Stack.Screen
          name="help-center"
          options={{
            headerShown: true,
            title: 'Ayuda y Soporte',
            presentation: 'card'
          }}
        />
        <Stack.Screen
          name="recently-viewed"
          options={{
            headerShown: true,
            title: 'Vistas Recientes',
            presentation: 'card'
          }}
        />
        <Stack.Screen
          name="saved-searches"
          options={{
            headerShown: true,
            title: 'Búsquedas Guardadas',
            presentation: 'card'
          }}
        />
        <Stack.Screen name="property-details" options={{ presentation: 'modal' }} />
        <Stack.Screen name="schedule-visit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="compare-properties" options={{ presentation: 'modal' }} />
        <Stack.Screen name="whatsapp-contacts" options={{ presentation: 'modal' }} />
        <Stack.Screen name="shared-property" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="appointment-detail"
          options={{
            headerShown: true,
            title: 'Detalle de Cita',
            presentation: 'card'
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ThemeProvider>
      <AuthProvider>
        <VoiceProvider>
          <FavoritesProvider>
            <RootLayoutNav />
          </FavoritesProvider>
        </VoiceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
