import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Switch,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getColors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { savedSearchesService, SavedSearch } from '@/services/savedSearchesService';
import { SavedSearchItemSkeleton } from '@/components/Skeleton';
import { Search, Trash2, Bell, BellOff, Play, Bookmark } from 'lucide-react-native';

export default function SavedSearchesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadSearches();
    }
  }, [user]);

  const loadSearches = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await savedSearchesService.getSavedSearches(user.id);
      setSearches(data);
    } catch (error) {
      console.error('Error loading saved searches:', error);
      Alert.alert('Error', 'No se pudieron cargar las búsquedas guardadas');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSearches();
    setRefreshing(false);
  };

  const handleExecuteSearch = (search: SavedSearch) => {
    router.push({
      pathname: '/(tabs)',
      params: {
        query: search.query,
        filters: JSON.stringify(search.filters || {}),
      },
    });
  };

  const handleToggleNotifications = async (search: SavedSearch) => {
    try {
      await savedSearchesService.toggleNotifications(
        search.id,
        !search.notify_new_listings
      );
      setSearches(prev =>
        prev.map(s =>
          s.id === search.id
            ? { ...s, notify_new_listings: !s.notify_new_listings }
            : s
        )
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    }
  };

  const handleDelete = (search: SavedSearch) => {
    Alert.alert(
      'Eliminar búsqueda',
      `¿Estás seguro que deseas eliminar "${search.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await savedSearchesService.deleteSearch(search.id);
              setSearches(prev => prev.filter(s => s.id !== search.id));
              Alert.alert('Éxito', 'Búsqueda eliminada');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la búsqueda');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: SavedSearch }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Bookmark size={20} color={colors.primary} />
          <Text style={styles.searchName}>{item.name}</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={styles.deleteButton}
        >
          <Trash2 size={18} color={colors.error} />
        </TouchableOpacity>
      </View>

      <Text style={styles.query} numberOfLines={2}>
        {item.query}
      </Text>

      {item.filters && Object.keys(item.filters).length > 0 && (
        <View style={styles.filtersContainer}>
          {item.filters.propertyType && (
            <View style={styles.filterChip}>
              <Text style={styles.filterText}>{item.filters.propertyType}</Text>
            </View>
          )}
          {item.filters.transactionType && (
            <View style={styles.filterChip}>
              <Text style={styles.filterText}>{item.filters.transactionType}</Text>
            </View>
          )}
          {item.filters.location && (
            <View style={styles.filterChip}>
              <Text style={styles.filterText}>{item.filters.location}</Text>
            </View>
          )}
          {item.filters.bedrooms && (
            <View style={styles.filterChip}>
              <Text style={styles.filterText}>{item.filters.bedrooms} hab</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.executeButton}
          onPress={() => handleExecuteSearch(item)}
        >
          <Play size={16} color={colors.surface} />
          <Text style={styles.executeButtonText}>Ejecutar búsqueda</Text>
        </TouchableOpacity>

        <View style={styles.notificationToggle}>
          {item.notify_new_listings ? (
            <Bell size={16} color={colors.primary} />
          ) : (
            <BellOff size={16} color={colors.textSecondary} />
          )}
          <Switch
            value={item.notify_new_listings}
            onValueChange={() => handleToggleNotifications(item)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
      </View>

      <Text style={styles.timestamp}>
        Guardada: {new Date(item.created_at).toLocaleDateString('es-CO')}
      </Text>
    </View>
  );

  if (!user) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Búsquedas Guardadas',
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
          <Search size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Inicia sesión para ver tus búsquedas guardadas</Text>
        </View>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Búsquedas Guardadas',
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
              <SavedSearchItemSkeleton key={i} />
            ))}
          </View>
        </View>
      </>
    );
  }

  if (searches.length === 0 && !loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Búsquedas Guardadas',
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
          <Search size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No tienes búsquedas guardadas</Text>
          <Text style={styles.emptySubtext}>
            Guarda tus búsquedas favoritas para ejecutarlas rápidamente
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Búsquedas Guardadas',
          headerShown: true,
        }}
      />
      <View style={styles.container}>
        <View style={styles.infoBar}>
          <Bookmark size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            {searches.length} búsqueda{searches.length !== 1 ? 's' : ''} guardada{searches.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <FlatList
          data={searches}
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
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  searchName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    
    flex: 1,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  query: {
    fontSize: typography.fontSize.base,
    
    marginBottom: spacing.sm,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    
  },
  filterText: {
    fontSize: typography.fontSize.xs,
    
    textTransform: 'capitalize',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  executeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flex: 1,
    marginRight: spacing.md,
  },
  executeButtonText: {
    fontSize: typography.fontSize.sm,
    
    fontWeight: '600',
  },
  notificationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    
    marginTop: spacing.xs,
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
