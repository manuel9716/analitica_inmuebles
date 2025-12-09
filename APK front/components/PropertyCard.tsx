import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Listing } from '@/types';
import { getColors, typography, spacing, borderRadius, shadows } from '@/constants/theme';
import { Home, Bed, Bath, MapPin, CheckSquare, Square, Heart } from 'lucide-react-native';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useTheme } from '@/contexts/ThemeContext';

interface PropertyCardProps {
  listing: Listing;
  onToggleSelect?: (listing: Listing) => void;
  isSelected?: boolean;
  onPress?: () => void;
  showFavorite?: boolean;
  fullWidth?: boolean;
  isActive?: boolean;
  isFrozen?: boolean;
  onAuthRequired?: () => void;
}

export default function PropertyCard({ listing, onToggleSelect, isSelected, onPress, showFavorite = true, fullWidth = false, isActive = true, isFrozen = false, onAuthRequired }: PropertyCardProps) {
  const router = useRouter();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const isListingFavorite = isFavorite(listing.id);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/property-details',
        params: { listing: JSON.stringify(listing) },
      });
    }
  };

  const handleToggleFavorite = async () => {
    if (isListingFavorite) {
      await removeFavorite(listing.id);
    } else {
      const success = await addFavorite(listing);
      if (!success && onAuthRequired) {
        onAuthRequired();
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        fullWidth && styles.cardFullWidth,
        isSelected && {
          borderWidth: 2,
          borderColor: '#1E90FF',
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: listing.images[0] || 'https://via.placeholder.com/300x200' }}
        style={[styles.image, fullWidth && styles.imageFullWidth]}
        resizeMode="cover"
      />

      {onToggleSelect && (
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => {
            if (!isFrozen) {
              onToggleSelect(listing);
            }
          }}
          activeOpacity={0.7}
          disabled={isFrozen}
        >
          {isSelected ? (
            <CheckSquare size={24} color="#1E90FF" strokeWidth={2.5} />
          ) : (
            <Square size={24} color="#666666" strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      )}

      {showFavorite && (
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleToggleFavorite}
        >
          <Heart
            size={24}
            color={isListingFavorite ? colors.error : colors.surface}
            fill={isListingFavorite ? colors.error : 'transparent'}
          />
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <Text style={[styles.price, { color: isDark ? '#FFFFFF' : colors.primary }]}>{formatPrice(listing.price)}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>{listing.title}</Text>

        <View style={styles.locationRow}>
          <MapPin size={16} color={colors.textSecondary} />
          <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>{listing.location}</Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Bed size={16} color={colors.textSecondary} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{listing.bedrooms}</Text>
          </View>

          <View style={styles.feature}>
            <Bath size={16} color={colors.textSecondary} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{listing.bathrooms}</Text>
          </View>

          <View style={styles.feature}>
            <Home size={16} color={colors.textSecondary} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{listing.area}m²</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    ...shadows.md,
  },
  cardFullWidth: {
    width: '100%',
    marginRight: 0,
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  imageFullWidth: {
    height: 220,
  },
  checkbox: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  content: {
    padding: spacing.md,
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  location: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.xs,
    flex: 1,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
});
