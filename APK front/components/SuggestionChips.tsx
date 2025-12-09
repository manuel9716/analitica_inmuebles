import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { getColors, spacing, borderRadius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void;
}

const ALL_SUGGESTIONS = [
  'Apartamento de 3 habitaciones',
  'Casa con piscina',
  'Local comercial',
  'Apartamento nuevo con parqueadero',
  'Casa con jard\u00edn',
  'Lote para construir',
  'Apartamento estrato 5',
  'Casa de 4 habitaciones',
  'Oficina moderna',
  'Apartamento con gimnasio',
  'Casa campestre',
  'Local con bodega',
  'Apartamento con balc\u00f3n',
  'Casa con BBQ',
  'Penthouse de lujo',
];

function getRandomSuggestions(count: number = 6): string[] {
  const shuffled = [...ALL_SUGGESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    setSuggestions(getRandomSuggestions());
  }, []);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {suggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => onSelect(suggestion)}
        >
          <Text style={[styles.chipText, { color: colors.primary }]}>{suggestion}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  chip: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
});
