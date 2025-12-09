import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getColors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { recentlyViewedService } from '@/services/recentlyViewedService';
import { Listing } from '@/types';
import { PropertyCardSkeleton } from '@/components/Skeleton';
import { Clock, MapPin, Bed, Bath, Home, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RecentlyViewedScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [properties, setProperties] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProperties();
  }, [user]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const sessionId = await AsyncStorage.getItem('session_id');
      const data = await recentlyViewedService.getRecentlyViewed(
        user?.id,
        sessionId,
        20
      );
      setProperties(data);
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  };

  const handleClearHistory = () => {
    if (!user) return;

    Alert.alert(
      'Limpiar historial',
      '¿Estás seguro que deseas eliminar todas las propiedades vistas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await recentlyViewedService.clearHistory(user.id);
              setProperties([]);
              Alert.alert('Éxito', 'Historial eliminado');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el historial');
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleViewDetails = (listing: Listing) => {
    router.push({
      pathname: '/property-details',
      params: { listing: JSON.stringify(listing) },
    });
  };

  const renderItem = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => handleViewDetails(item)}
      activeOpacity={0.7}
    >
      {item.images && item.images[0] && (
        <Image source={{ uri: item.images[0] }} style={[styles.image, { backgroundColor: colors.border }]} />
      )}

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={[styles.price, { color: isDark ? '#FFFFFF' : colors.primary }]}>{formatPrice(item.price)}</Text>

        <View style={styles.locationRow}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Home size={14} color={colors.textSecondary} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{item.propertyType}</Text>
          </View>
          <View style={styles.feature}>
            <Bed size={14} color={colors.textSecondary} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{item.bedrooms}</Text>
          </View>
          <View style={styles.feature}>
            <Bath size={14} color={colors.textSecondary} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{item.bathrooms}</Text>
          </View>
          <View style={styles.feature}>
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{item.area}m²</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Vistas Recientemente',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#08509C',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.list}>
            {[1, 2, 3].map(i => (
              <PropertyCardSkeleton key={i} />
            ))}
          </View>
        </View>
      </>
    );
  }

  if (properties.length === 0 && !loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Vistas Recientemente',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#08509C',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        />
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
          <Clock size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No has visto propiedades aún</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Las propiedades que veas aparecerán aquí
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Vistas Recientemente',
          headerShown: true,
          headerRight: () =>
            user && properties.length > 0 ? (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearHistory}
              >
                <Trash2 size={20} color={colors.error} />
              </TouchableOpacity>
            ) : null,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.infoBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Clock size={16} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {properties.length} propiedad{properties.length !== 1 ? 'es' : ''} vista
            {properties.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <FlatList
          data={properties}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  location: {
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  features: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
  },
  clearButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
