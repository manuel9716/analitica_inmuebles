import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Linking,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getColors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { analyticsService } from '@/services/analyticsService';
import { Listing } from '@/types';
import { MessageCircle, MapPin, Bed, Bath, Home } from 'lucide-react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function WhatsAppContactsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [properties, setProperties] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadProperties();
    }
  }, [user]);

  const loadProperties = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await analyticsService.getSharedProperties(user.id);
      setProperties(data);
    } catch (error) {
      console.error('Error loading WhatsApp contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleContactAgain = (listing: Listing) => {
    const message = encodeURIComponent(
      `Hola, me sigue interesando esta propiedad: ${listing.title} - ${formatPrice(listing.price)}`
    );
    Linking.openURL(`whatsapp://send?text=${message}`);
  };

  const handleViewDetails = (listing: Listing) => {
    router.push({
      pathname: '/property-details',
      params: { listing: JSON.stringify(listing) },
    });
  };

  const renderItem = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleViewDetails(item)}
      activeOpacity={0.7}
    >
      {item.images && item.images[0] && (
        <Image source={{ uri: item.images[0] }} style={styles.image} />
      )}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.price}>{formatPrice(item.price)}</Text>

        <View style={styles.locationRow}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={styles.location} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Home size={14} color={colors.textSecondary} />
            <Text style={styles.featureText}>{item.propertyType}</Text>
          </View>
          <View style={styles.feature}>
            <Bed size={14} color={colors.textSecondary} />
            <Text style={styles.featureText}>{item.bedrooms}</Text>
          </View>
          <View style={styles.feature}>
            <Bath size={14} color={colors.textSecondary} />
            <Text style={styles.featureText}>{item.bathrooms}</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureText}>{item.area}m²</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => handleContactAgain(item)}
        >
          <MessageCircle size={16} color={colors.surface} />
          <Text style={styles.contactButtonText}>Contactar nuevamente</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Propiedades Contactadas',
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
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Inicia sesión para ver tus contactos</Text>
        </View>
      </>
    );
  }

  if (properties.length === 0 && !loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Propiedades Contactadas',
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
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No has contactado propiedades por WhatsApp</Text>
          <Text style={styles.emptySubtext}>
            Las propiedades que contactes aparecerán aquí
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Propiedades Contactadas',
          headerShown: true,
        }}
      />
      <View style={styles.container}>
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
    marginBottom: spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#25D366',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  contactButtonText: {
    fontSize: typography.fontSize.sm,
    
    fontWeight: '600',
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
