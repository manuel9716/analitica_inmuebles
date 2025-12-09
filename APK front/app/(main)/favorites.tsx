import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getColors, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { favoritesService } from '@/services/favoritesService';
import { Listing } from '@/types';
import PropertyCard from '@/components/PropertyCard';
import { PropertyCardSkeleton } from '@/components/Skeleton';
import { Heart } from 'lucide-react-native';

export default function FavoritesScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { refreshFavorites } = useFavorites();

  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await favoritesService.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyPress = (listing: Listing) => {
    router.push({
      pathname: '/property-details',
      params: {
        listing: JSON.stringify(listing),
      },
    });
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Favoritos', headerStyle: { backgroundColor: '#08509C' }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontWeight: '600' }, headerBackTitle: '' }} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.listContent}>
            {[1, 2, 3].map(i => (
              <PropertyCardSkeleton key={i} />
            ))}
          </View>
        </View>
      </>
    );
  }

  if (favorites.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Favoritos', headerStyle: { backgroundColor: '#08509C' }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontWeight: '600' }, headerBackTitle: '' }} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.centerContent}>
            <Heart size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No tienes propiedades favoritas
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Agrega propiedades a tus favoritos para verlas aquí
            </Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Favoritos', headerStyle: { backgroundColor: '#08509C' }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontWeight: '600' } }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PropertyCard
              listing={item}
              onPress={() => handlePropertyPress(item)}
              fullWidth={true}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
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
  listContent: {
    padding: spacing.md,
  },
});
