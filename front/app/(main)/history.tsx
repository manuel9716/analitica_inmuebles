import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getColors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { searchHistoryService } from '@/services/searchHistoryService';
import { SearchHistory } from '@/types';
import { Clock, Search, Trash2, ArrowLeft } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const history = await searchHistoryService.getSearchHistory();
      setSearchHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleSearchClick = (item: SearchHistory) => {
    router.push({
      pathname: '/(main)',
      params: {
        historyItem: JSON.stringify(item),
      },
    });
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Eliminar búsqueda',
      '¿Estás seguro de que deseas eliminar esta búsqueda del historial?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(id);
            try {
              await searchHistoryService.deleteSearchItem(id);
              setSearchHistory((prev) => prev.filter((item) => item.id !== id));
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la búsqueda');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: SearchHistory }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}
      onPress={() => handleSearchClick(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Search size={20} color={colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.query, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.query}
          </Text>
          <View style={styles.metadata}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {formatDistanceToNow(new Date(item.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </Text>
            {item.results_count !== undefined && (
              <Text style={[styles.count, { color: colors.textSecondary }]}>
                • {item.results_count} resultado{item.results_count !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
          disabled={deleting === item.id}
        >
          <Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Clock size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No hay búsquedas recientes
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Tus búsquedas aparecerán aquí
      </Text>
      <TouchableOpacity
        style={[styles.searchButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(main)')}
      >
        <Text style={[styles.searchButtonText, { color: '#FFFFFF' }]}>
          Buscar Inmuebles
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Historial de Búsquedas',
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
        <FlatList
          data={searchHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={!loading ? renderEmpty : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
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
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  card: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(21, 101, 192, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  query: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timestamp: {
    fontSize: typography.fontSize.sm,
  },
  count: {
    fontSize: typography.fontSize.sm,
  },
  deleteButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  searchButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  searchButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
});
