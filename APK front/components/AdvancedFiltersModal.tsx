import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { getColors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { PropertyFilters } from '@/types';
import { X, SlidersHorizontal } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface AdvancedFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: PropertyFilters) => void;
  initialFilters?: PropertyFilters;
}

export default function AdvancedFiltersModal({
  visible,
  onClose,
  onApply,
  initialFilters = {},
}: AdvancedFiltersModalProps) {
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  const propertyTypes = [
    { value: 'casa', label: 'Casa' },
    { value: 'apartamento', label: 'Apartamento' },
    { value: 'lote', label: 'Lote' },
    { value: 'oficina', label: 'Oficina' },
    { value: 'local', label: 'Local' },
  ];

  const transactionTypes = [
    { value: 'venta', label: 'Venta' },
    { value: 'arriendo', label: 'Arriendo' },
  ];

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <SlidersHorizontal size={24} color={colors.primary} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>Filtros Avanzados</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Transacción</Text>
            <View style={styles.chipContainer}>
              {transactionTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.chip,
                    filters.transactionType === type.value && styles.chipActive,
                  ]}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      transactionType: type.value as 'venta' | 'arriendo',
                    })
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      filters.transactionType === type.value && styles.chipTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Propiedad</Text>
            <View style={styles.chipContainer}>
              {propertyTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.chip,
                    filters.propertyType === type.value && styles.chipActive,
                  ]}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      propertyType: type.value as PropertyFilters['propertyType'],
                    })
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      filters.propertyType === type.value && styles.chipTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rango de Precio</Text>
              <Text style={styles.rangeValue}>
                {filters.minPrice ? formatPrice(filters.minPrice) : '$0'} -{' '}
                {filters.maxPrice ? formatPrice(filters.maxPrice) : '$5M+'}
              </Text>
            </View>
            <Text style={styles.sliderLabel}>Precio Mínimo</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={5000000}
              step={50000}
              value={filters.minPrice || 0}
              onValueChange={(value) =>
                setFilters({ ...filters, minPrice: value })
              }
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />

            <Text style={styles.sliderLabel}>Precio Máximo</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={5000000}
              step={50000}
              value={filters.maxPrice || 5000000}
              onValueChange={(value) =>
                setFilters({ ...filters, maxPrice: value })
              }
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Área (m²)</Text>
              <Text style={styles.rangeValue}>
                {filters.minArea || 0}m² - {filters.maxArea || 500}m²
              </Text>
            </View>
            <Text style={styles.sliderLabel}>Área Mínima</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={500}
              step={10}
              value={filters.minArea || 0}
              onValueChange={(value) =>
                setFilters({ ...filters, minArea: value })
              }
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />

            <Text style={styles.sliderLabel}>Área Máxima</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={500}
              step={10}
              value={filters.maxArea || 500}
              onValueChange={(value) =>
                setFilters({ ...filters, maxArea: value })
              }
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Habitaciones</Text>
            <View style={styles.chipContainer}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.chip,
                    styles.smallChip,
                    filters.bedrooms === num && styles.chipActive,
                  ]}
                  onPress={() => setFilters({ ...filters, bedrooms: num })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      filters.bedrooms === num && styles.chipTextActive,
                    ]}
                  >
                    {num}+
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Baños</Text>
            <View style={styles.chipContainer}>
              {[1, 2, 3, 4].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.chip,
                    styles.smallChip,
                    filters.bathrooms === num && styles.chipActive,
                  ]}
                  onPress={() => setFilters({ ...filters, bathrooms: num })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      filters.bathrooms === num && styles.chipTextActive,
                    ]}
                  >
                    {num}+
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estrato</Text>
            <View style={styles.chipContainer}>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.chip,
                    styles.smallChip,
                    filters.estrato === num && styles.chipActive,
                  ]}
                  onPress={() => setFilters({ ...filters, estrato: num })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      filters.estrato === num && styles.chipTextActive,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Limpiar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  rangeValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 2,
  },
  smallChip: {
    paddingHorizontal: spacing.md,
  },
  chipActive: {
  },
  chipText: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  chipTextActive: {
    fontWeight: '600',
  },
  sliderLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
  },
  resetButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.md,
  },
  applyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
  },
});
