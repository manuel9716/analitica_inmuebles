import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { getColors, spacing, typography, borderRadius } from '@/constants/theme';
import { Listing } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { shareService } from '@/services/shareService';
import { X, Calendar, Bed, Bath, Home as HomeIcon, MapPin } from 'lucide-react-native';
import MapView from '@/components/MapView';

const { width } = Dimensions.get('window');

export default function SharedPropertyScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedProperty();
  }, []);

  const loadSharedProperty = async () => {
    try {
      const token = params.token as string;
      if (!token) {
        setLoading(false);
        return;
      }

      const property = await shareService.getSharedProperty(token);
      if (property) {
        setListing(property);
      }
    } catch (error) {
      console.error('Error loading shared property:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Cargando propiedad...
        </Text>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
          Propiedad no encontrada
        </Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          El enlace que intentas acceder no es válido o ha expirado.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/')}
        >
          <Text style={styles.buttonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={colors.surface} />
        </TouchableOpacity>

        <ScrollView>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: listing.images[0] }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>

          <View style={styles.content}>
            <Text style={[styles.price, { color: isDark ? '#FFFFFF' : colors.primary }]}>
              {formatPrice(listing.price)}
            </Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{listing.title}</Text>

            <View style={styles.locationRow}>
              <MapPin size={20} color={colors.textSecondary} />
              <Text style={[styles.location, { color: colors.textSecondary }]}>
                {listing.location}
              </Text>
            </View>

            <View style={styles.features}>
              <View style={styles.featureItem}>
                <Bed size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                  {listing.bedrooms} hab.
                </Text>
              </View>

              <View style={styles.featureItem}>
                <Bath size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                  {listing.bathrooms} baños
                </Text>
              </View>

              <View style={styles.featureItem}>
                <HomeIcon size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                  {listing.area} m²
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Descripción
              </Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {listing.description}
              </Text>
            </View>

            {listing.coordinates && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Ubicación</Text>
                <View style={styles.locationInfo}>
                  <MapPin size={20} color={colors.textSecondary} />
                  <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                    {listing.location}
                  </Text>
                </View>
                <View style={styles.mapContainer}>
                  <MapView
                    latitude={listing.coordinates.lat}
                    longitude={listing.coordinates.lng}
                    title={listing.title}
                  />
                </View>
              </View>
            )}

            <View style={styles.ctaButtons}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push({
                  pathname: '/schedule-visit',
                  params: { listing: JSON.stringify(listing) },
                })}
              >
                <Calendar size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Pre Agendar Visita</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: spacing.md,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.full,
    padding: spacing.sm,
  },
  imageContainer: {
    width,
    height: 300,
  },
  image: {
    width,
    height: 300,
  },
  content: {
    padding: spacing.lg,
  },
  price: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  location: {
    fontSize: typography.fontSize.base,
  },
  features: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  locationText: {
    fontSize: typography.fontSize.base,
  },
  mapContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  ctaButtons: {
    gap: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
  },
});
