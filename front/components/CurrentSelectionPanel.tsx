import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { X, Home } from 'lucide-react-native';
import { Listing } from '@/types';
import { getColors, spacing, typography, borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface CurrentSelectionPanelProps {
  selectedListings: string[];
  listings: Listing[];
  onRemove: (listingId: string) => void;
}

export default function CurrentSelectionPanel({
  selectedListings,
  listings,
  onRemove,
}: CurrentSelectionPanelProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  if (selectedListings.length === 0) {
    return null;
  }

  const selectedItems = listings.filter(listing =>
    selectedListings.includes(listing.id)
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3B82F6' }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' }]}>
          <Home size={20} color="#FFFFFF" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {selectedItems.length} {selectedItems.length === 1 ? 'inmueble seleccionado' : 'inmuebles seleccionados'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            La próxima búsqueda refinará sobre esta selección
          </Text>
        </View>
      </View>

      <ScrollView style={styles.listContainer}>
        {selectedItems.map((listing) => (
          <View
            key={listing.id}
            style={[styles.listingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.listingInfo}>
              <Text style={[styles.listingTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {listing.title}
              </Text>
              <Text style={[styles.listingLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                {listing.location}
              </Text>
              <Text style={[styles.listingPrice, { color: '#3B82F6' }]}>
                {formatPrice(listing.price)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemove(listing.id)}
            >
              <X size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
  },
  listContainer: {
    maxHeight: 300,
  },
  listingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  listingLocation: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
  },
  listingPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  removeButton: {
    padding: spacing.sm,
  },
});
