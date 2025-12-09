import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getColors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { appointmentsAppService, AppointmentFilters, SortOption, FilterStatus } from '@/services/appointmentsAppService';
import { Appointment } from '@/types';
import { AppointmentCardSkeleton } from '@/components/Skeleton';
import { Calendar, Clock, MapPin, Phone, Mail, X, Search, Filter, Navigation, CalendarDays, SlidersHorizontal, DollarSign, ChevronRight } from 'lucide-react-native';
import { format } from 'date-fns';
import * as Location from 'expo-location';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AppointmentFilters>({
    status: 'todas',
    sortBy: 'fecha_asc',
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (user) {
      loadAppointments();
      loadUserLocation();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [searchQuery, filters]);

  const loadUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      }
    } catch (error) {
      console.log('[Appointments] Error getting location:', error);
    }
  };

  const loadAppointments = async () => {
    if (!user) {
      console.log('[Appointments] No user found');
      return;
    }

    console.log('[Appointments] Loading appointments for user:', user.id);
    setLoading(true);
    setError(null);
    try {
      const appliedFilters: AppointmentFilters = {
        ...filters,
        searchQuery,
        userLocation: filters.sortBy === 'distancia' ? userLocation || undefined : undefined,
      };
      const data = await appointmentsAppService.getAllClientAppointments(undefined, appliedFilters);
      console.log('[Appointments] Loaded appointments:', data.length);
      setAppointments(data);
    } catch (error) {
      console.error('[Appointments] Error loading appointments:', error);
      setError('Error al cargar las citas. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const handleConfirmAppointment = async (id: string) => {
    try {
      await appointmentsAppService.confirmAppointmentByClient(id);
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === id ? { ...apt, confirmada_cliente: true } : apt
        )
      );
      Alert.alert('Confirmado', 'Has confirmado tu asistencia a la cita');
    } catch (error) {
      Alert.alert('Error', 'No se pudo confirmar la cita');
    }
  };

  const handleCancelAppointment = (id: string) => {
    Alert.alert(
      'Cancelar cita',
      '¿Estás seguro que deseas cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentsAppService.cancelAppointmentByClient(id, 'Cancelada por el usuario');
              setAppointments(prev =>
                prev.map(apt =>
                  apt.id === id ? { ...apt, estado: 'cancelada_cliente' } : apt
                )
              );
              Alert.alert('Éxito', 'Cita cancelada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar la cita');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente':
        return colors.accent;
      case 'confirmada':
        return colors.success;
      case 'en_camino':
        return '#2196F3';
      case 'en_curso':
        return '#2196F3';
      case 'completada':
        return colors.textSecondary;
      case 'cancelada_cliente':
      case 'cancelada_vendedor':
        return colors.error;
      case 'no_asistio_cliente':
      case 'no_asistio_vendedor':
        return colors.error;
      case 'reagendada':
        return '#9C27B0';
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'confirmada':
        return 'Confirmada';
      case 'en_camino':
        return 'En Camino';
      case 'en_curso':
        return 'En Curso';
      case 'completada':
        return 'Completada';
      case 'cancelada_cliente':
        return 'Cancelada';
      case 'cancelada_vendedor':
        return 'Cancelada por Vendedor';
      case 'no_asistio_cliente':
        return 'No Asistió';
      case 'no_asistio_vendedor':
        return 'Vendedor No Asistió';
      case 'reagendada':
        return 'Reagendada';
      default:
        return status;
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'todas',
      sortBy: 'fecha_asc',
    });
    setSearchQuery('');
  };

  const applyFilters = (newFilters: Partial<AppointmentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setShowFilters(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status && filters.status !== 'todas') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (searchQuery) count++;
    return count;
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) {
        return 'Fecha no disponible';
      }

      console.log('[Appointments] Formatting date:', dateString);

      // Parse date as local time to avoid timezone issues
      // Handle both 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:MM:SS' formats
      const dateOnly = dateString.split('T')[0];
      const parts = dateOnly.split('-');

      if (parts.length !== 3) {
        console.warn('[Appointments] Invalid date format:', dateString);
        return dateString;
      }

      const [year, month, day] = parts.map(Number);

      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        console.warn('[Appointments] Invalid date parts:', { year, month, day });
        return dateString;
      }

      const date = new Date(year, month - 1, day);

      if (isNaN(date.getTime())) {
        console.warn('[Appointments] Invalid date created:', date);
        return dateString;
      }

      const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];

      const formatted = `${date.getDate()} de ${months[date.getMonth()]}, ${date.getFullYear()}`;
      console.log('[Appointments] Formatted date:', formatted);
      return formatted;
    } catch (error) {
      console.error('[Appointments] Error formatting date:', error);
      return dateString || 'Fecha no disponible';
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const navigateToDetail = (appointmentId: string) => {
    router.push(`/appointment-detail?id=${appointmentId}`);
  };

  const renderItem = ({ item }: { item: Appointment }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => navigateToDetail(item.id)}
      activeOpacity={0.7}
    >
      {item.inmueble_imagen_url && (
        <Image
          source={{ uri: item.inmueble_imagen_url }}
          style={styles.propertyImage}
        />
      )}

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.propertyTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.inmueble_titulo || 'Propiedad'}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.estado) + '20' },
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(item.estado) }]}>
              {getStatusText(item.estado)}
            </Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textPrimary }]}>
              {item.fecha_cita ? formatDate(item.fecha_cita) : 'Fecha no disponible'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textPrimary }]}>
              {item.hora_inicio || 'Hora no disponible'} ({item.duracion_minutos || 0} min)
            </Text>
          </View>

          {item.inmueble_direccion && (
            <View style={styles.detailRow}>
              <MapPin size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.inmueble_direccion}, {item.inmueble_ciudad}
                {item.distance && item.distance !== Infinity && (
                  <Text style={{ color: colors.textSecondary }}>
                    {' '}• {item.distance.toFixed(1)} km
                  </Text>
                )}
              </Text>
            </View>
          )}

          {item.inmueble_precio && (
            <View style={styles.detailRow}>
              <DollarSign size={16} color={colors.primary} />
              <Text style={[styles.priceText, { color: colors.primary }]}>
                {formatPrice(item.inmueble_precio)}
              </Text>
            </View>
          )}
        </View>

        {!item.confirmada_vendedor && item.estado === 'pendiente' && (
          <View style={[styles.warningBadge, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
            <Clock size={16} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.warning }]}>En espera de aceptación</Text>
          </View>
        )}

        {item.confirmada_vendedor && item.confirmada_cliente && (
          <View style={[styles.confirmedBadge, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.confirmedText, { color: colors.success }]}>✓ Confirmaste tu asistencia</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.detailButton, { backgroundColor: colors.primary }]}
          onPress={() => navigateToDetail(item.id)}
        >
          <Text style={styles.detailButtonText}>Ver Detalle</Text>
          <ChevronRight size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (!user) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
          <Calendar size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>Inicia sesión para ver tus citas</Text>
        </View>
      );
    }

    if (error && !loading) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
          <Calendar size={64} color={colors.error} />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadAppointments}
          >
            <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.list}>
            {[1, 2, 3].map(i => (
              <AppointmentCardSkeleton key={i} />
            ))}
          </View>
        </View>
      );
    }

    if (appointments.length === 0) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
          <Calendar size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No tienes citas agendadas</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Agenda una visita desde los detalles de una propiedad
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList
          data={appointments}
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
    );
  };

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Filtros</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Estado</Text>
            <View style={styles.filterOptions}>
              {[
                { value: 'todas', label: 'Todas' },
                { value: 'pendiente', label: 'Pendientes' },
                { value: 'confirmada', label: 'Confirmadas' },
                { value: 'completada', label: 'Completadas' },
                { value: 'cancelada', label: 'Canceladas' },
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor:
                        filters.status === option.value ? colors.primary : colors.background,
                      borderColor: filters.status === option.value ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => applyFilters({ status: option.value as FilterStatus })}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      {
                        color:
                          filters.status === option.value ? '#FFFFFF' : colors.textPrimary,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Ordenar por</Text>
            <View style={styles.filterOptions}>
              {[
                { value: 'fecha_asc', label: 'Fecha más cercana', icon: CalendarDays },
                { value: 'fecha_desc', label: 'Fecha más lejana', icon: Calendar },
                { value: 'distancia', label: 'Distancia', icon: Navigation },
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor:
                        filters.sortBy === option.value ? colors.primary : colors.background,
                      borderColor: filters.sortBy === option.value ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => applyFilters({ sortBy: option.value as SortOption })}
                >
                  <option.icon
                    size={16}
                    color={filters.sortBy === option.value ? '#FFFFFF' : colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      {
                        color:
                          filters.sortBy === option.value ? '#FFFFFF' : colors.textPrimary,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filters.sortBy === 'distancia' && !userLocation && (
              <View style={[styles.warningBox, { backgroundColor: colors.accent + '20' }]}>
                <Text style={[styles.warningText, { color: colors.accent }]}>
                  Necesitas activar la ubicación para ordenar por distancia
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.clearButton, { borderColor: colors.border }]}
              onPress={clearFilters}
            >
              <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>
                Limpiar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Mis Citas',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitle: '',
        }}
      />
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Buscar por propiedad, dirección, ciudad..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowFilters(true)}
        >
          <SlidersHorizontal size={20} color="#FFFFFF" />
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      {renderFiltersModal()}
      {renderContent()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    paddingVertical: spacing.xs,
  },
  filterButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  modalBody: {
    padding: spacing.lg,
  },
  filterLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  filterOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  warningBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: '600',
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
  propertyImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  propertyTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  detailsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  priceText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    flex: 1,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  detailButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  confirmedBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  confirmedText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  warningText: {
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
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  retryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
});
