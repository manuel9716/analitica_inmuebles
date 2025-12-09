import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { getColors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { Listing } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { comparisonService } from '@/services/comparisonService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, Check, MapPin, Bed, Bath, Home, DollarSign } from 'lucide-react-native';

export default function ComparePropertiesScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const listings: Listing[] = params.listings
    ? JSON.parse(params.listings as string)
    : [];

  const [saving, setSaving] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatPricePerSqm = (price: number, area: number) => {
    const pricePerSqm = price / area;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(pricePerSqm);
  };

  const handleSaveComparison = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para guardar comparaciones');
      return;
    }
    setSaving(true);
    try {
      await comparisonService.saveComparison(
        listings.map(l => l.id),
        listings
      );
      Alert.alert('Éxito', 'Comparación guardada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la comparación');
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetails = (listing: Listing) => {
    router.push({
      pathname: '/property-details',
      params: { listing: JSON.stringify(listing) },
    });
  };

  if (listings.length < 2) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Comparar Propiedades',
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
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
            Selecciona al menos 2 propiedades para comparar
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Comparar ${listings.length} Propiedades`,
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableContainer}>
            <View style={styles.imagesRow}>
              <View style={styles.labelCell} />
              {listings.map((listing) => (
                <TouchableOpacity
                  key={listing.id}
                  style={styles.imageCell}
                  onPress={() => handleViewDetails(listing)}
                  activeOpacity={0.8}
                >
                  {listing.images && listing.images[0] && (
                    <Image
                      source={{ uri: listing.images[0] }}
                      style={styles.propertyImage}
                    />
                  )}
                  <View style={styles.imageOverlay}>
                    <Text style={styles.imageTitleText} numberOfLines={2}>
                      {listing.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.labelCell}>
                <DollarSign size={16} color={colors.textSecondary} />
                <Text style={styles.labelText}>Precio</Text>
              </View>
              {listings.map((listing) => (
                <View key={listing.id} style={styles.valueCell}>
                  <Text style={styles.priceText}>{formatPrice(listing.price)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.labelCell}>
                <DollarSign size={16} color={colors.textSecondary} />
                <Text style={styles.labelText}>Precio/m²</Text>
              </View>
              {listings.map((listing) => (
                <View key={listing.id} style={styles.valueCell}>
                  <Text style={styles.valueText}>
                    {formatPricePerSqm(listing.price, listing.area)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.labelCell}>
                <MapPin size={16} color={colors.textSecondary} />
                <Text style={styles.labelText}>Ubicación</Text>
              </View>
              {listings.map((listing) => (
                <View key={listing.id} style={styles.valueCell}>
                  <Text style={styles.valueText} numberOfLines={2}>
                    {listing.location}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.labelCell}>
                <Home size={16} color={colors.textSecondary} />
                <Text style={styles.labelText}>Tipo</Text>
              </View>
              {listings.map((listing) => (
                <View key={listing.id} style={styles.valueCell}>
                  <Text style={styles.valueText}>{listing.propertyType}</Text>
                </View>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.labelCell}>
                <Text style={styles.labelText}>Área</Text>
              </View>
              {listings.map((listing) => (
                <View key={listing.id} style={styles.valueCell}>
                  <Text style={styles.valueText}>{listing.area} m²</Text>
                </View>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.labelCell}>
                <Bed size={16} color={colors.textSecondary} />
                <Text style={styles.labelText}>Habitaciones</Text>
              </View>
              {listings.map((listing) => (
                <View key={listing.id} style={styles.valueCell}>
                  <Text style={styles.valueText}>{listing.bedrooms}</Text>
                </View>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.labelCell}>
                <Bath size={16} color={colors.textSecondary} />
                <Text style={styles.labelText}>Baños</Text>
              </View>
              {listings.map((listing) => (
                <View key={listing.id} style={styles.valueCell}>
                  <Text style={styles.valueText}>{listing.bathrooms}</Text>
                </View>
              ))}
            </View>

            {listings[0].estrato && (
              <View style={styles.row}>
                <View style={styles.labelCell}>
                  <Text style={styles.labelText}>Estrato</Text>
                </View>
                {listings.map((listing) => (
                  <View key={listing.id} style={styles.valueCell}>
                    <Text style={styles.valueText}>
                      {listing.estrato || 'N/A'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {listings[0].parking && (
              <View style={styles.row}>
                <View style={styles.labelCell}>
                  <Text style={styles.labelText}>Parqueaderos</Text>
                </View>
                {listings.map((listing) => (
                  <View key={listing.id} style={styles.valueCell}>
                    <Text style={styles.valueText}>
                      {listing.parking || '0'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.row}>
              <View style={styles.labelCell}>
                <Text style={styles.labelText}>Características</Text>
              </View>
              {listings.map((listing) => (
                <View key={listing.id} style={styles.valueCell}>
                  <View style={styles.featuresContainer}>
                    {listing.features?.slice(0, 4).map((feature, idx) => (
                      <View key={idx} style={styles.featureChip}>
                        <Check size={12} color={colors.success} />
                        <Text style={styles.featureText} numberOfLines={1}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveComparison}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Guardando...' : 'Guardar Comparación'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tableContainer: {
    paddingVertical: spacing.md,
  },
  imagesRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
  },
  labelCell: {
    width: 120,
    padding: spacing.md,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  labelText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  imageCell: {
    width: 200,
    height: 150,
    marginLeft: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: spacing.sm,
  },
  imageTitleText: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  valueCell: {
    width: 200,
    padding: spacing.md,
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  priceText: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
  },
  valueText: {
    fontSize: typography.fontSize.base,
  },
  featuresContainer: {
    gap: spacing.xs,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  featureText: {
    fontSize: typography.fontSize.xs,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
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
    textAlign: 'center',
  },
});
