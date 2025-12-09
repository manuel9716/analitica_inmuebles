import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { getColors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { appointmentsAppService } from '@/services/appointmentsAppService';
import { Appointment } from '@/types';
import AppointmentMap from '@/components/AppointmentMap';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  X,
  Navigation,
  DollarSign,
  User,
  CheckCircle,
  Home,
  Bed,
  Bath,
  Car,
  Layers,
  Building2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (id && user) {
      loadAppointment();
    }
  }, [id, user]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const data = await appointmentsAppService.getAppointmentById(id);
      setAppointment(data);
    } catch (error) {
      console.error('[AppointmentDetail] Error loading appointment:', error);
      setToast({ visible: true, message: 'No se pudo cargar la cita', type: 'error' });
      setTimeout(() => router.back(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousImage = () => {
    if (!appointment || !appointment.inmueble_imagenes) return;
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      scrollViewRef.current?.scrollTo({ x: width * newIndex, animated: true });
    }
  };

  const handleNextImage = () => {
    if (!appointment || !appointment.inmueble_imagenes) return;
    if (currentImageIndex < appointment.inmueble_imagenes.length - 1) {
      const newIndex = currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      scrollViewRef.current?.scrollTo({ x: width * newIndex, animated: true });
    }
  };

  const handleCall = () => {
    if (appointment?.vendedor_celular) {
      Linking.openURL(`tel:${appointment.vendedor_celular}`);
    }
  };

  const handleEmail = () => {
    if (appointment?.vendedor_email) {
      Linking.openURL(`mailto:${appointment.vendedor_email}`);
    }
  };

  const openInGoogleMaps = () => {
    if (!appointment?.inmueble_coordenadas) {
      setToast({ visible: true, message: 'No hay coordenadas disponibles', type: 'error' });
      return;
    }

    const { lat, lng } = appointment.inmueble_coordenadas;
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
      web: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        Linking.openURL(fallbackUrl);
      });
    }
  };

  const openInWaze = () => {
    if (!appointment?.inmueble_coordenadas) {
      setToast({ visible: true, message: 'No hay coordenadas disponibles', type: 'error' });
      return;
    }

    const { lat, lng } = appointment.inmueble_coordenadas;
    const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

    Linking.openURL(url).catch(() => {
      setToast({ visible: true, message: 'No se pudo abrir Waze. Asegúrate de tener la aplicación instalada.', type: 'error' });
    });
  };

  const handleConfirmAppointment = async () => {
    if (!appointment) return;

    try {
      await appointmentsAppService.confirmAppointmentByClient(appointment.id);
      setAppointment({ ...appointment, confirmada_cliente: true });
      setToast({ visible: true, message: 'Has confirmado tu asistencia a la cita', type: 'success' });
    } catch (error) {
      setToast({ visible: true, message: 'No se pudo confirmar la cita', type: 'error' });
    }
  };

  const handleRescheduleAppointment = () => {
    if (!appointment) return;

    router.push({
      pathname: '/schedule-visit',
      params: {
        listingId: appointment.inmueble_id,
        listingTitle: appointment.inmueble_titulo,
        rescheduleId: appointment.id,
      },
    });
  };

  const handleCancelAppointment = () => {
    if (!appointment) return;
    setShowCancelModal(true);
  };

  const confirmCancelAppointment = async () => {
    if (!appointment) return;

    try {
      setCancellingAppointment(true);
      console.log('[AppointmentDetail] Cancelando cita:', appointment.id);
      await appointmentsAppService.cancelAppointmentByClient(
        appointment.id,
        'Cancelada por el usuario'
      );
      console.log('[AppointmentDetail] Cita cancelada exitosamente');
      setShowCancelModal(false);
      setToast({ visible: true, message: 'Cita cancelada correctamente', type: 'success' });
      setTimeout(() => router.back(), 2000);
    } catch (error: any) {
      console.error('[AppointmentDetail] Error cancelando cita:', error);
      const errorMessage = error?.message || 'No se pudo cancelar la cita';
      setToast({ visible: true, message: errorMessage, type: 'error' });
      setShowCancelModal(false);
    } finally {
      setCancellingAppointment(false);
    }
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

  const formatPrice = (price?: number) => {
    if (!price) return 'Precio no disponible';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Fecha no disponible';

      const dateOnly = dateString.split('T')[0];
      const parts = dateOnly.split('-');
      if (parts.length !== 3) return dateString;

      const [year, month, day] = parts.map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) return dateString;

      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return dateString;

      const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];

      return `${date.getDate()} de ${months[date.getMonth()]}, ${date.getFullYear()}`;
    } catch (error) {
      return dateString || 'Fecha no disponible';
    }
  };

  if (loading || !appointment) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Cargando...</Text>
      </View>
    );
  }

  const propertyImages = appointment.inmueble_imagenes && appointment.inmueble_imagenes.length > 0
    ? appointment.inmueble_imagenes
    : appointment.inmueble_imagen_url
    ? [appointment.inmueble_imagen_url]
    : [];

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.imageContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {propertyImages.length > 0 ? (
              propertyImages.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={styles.propertyImage}
                  resizeMode="cover"
                />
              ))
            ) : (
              <View style={[styles.propertyImage, styles.noImageContainer, { backgroundColor: colors.surface }]}>
                <Home size={64} color={colors.textSecondary} />
                <Text style={[styles.noImageText, { color: colors.textSecondary }]}>Sin imágenes</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {propertyImages.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navButtonImage, styles.navButtonLeft]}
                onPress={handlePreviousImage}
                disabled={currentImageIndex === 0}
              >
                <ChevronLeft size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButtonImage, styles.navButtonRight]}
                onPress={handleNextImage}
                disabled={currentImageIndex === propertyImages.length - 1}
              >
                <ChevronRight size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.imageIndicator}>
                <Text style={styles.imageIndicatorText}>
                  {currentImageIndex + 1} / {propertyImages.length}
                </Text>
              </View>
            </>
          )}
          <View
            style={[
              styles.statusBadgeOverlay,
              { backgroundColor: getStatusColor(appointment.estado) + 'DD' },
            ]}
          >
            <Text style={[styles.statusTextOverlay, { color: '#FFFFFF' }]}>
              {getStatusText(appointment.estado)}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* SECCIÓN: INFORMACIÓN DEL INMUEBLE */}
          <View style={[styles.propertyCard, { backgroundColor: colors.surface }, shadows.md]}>
            {appointment.inmueble_precio && (
              <Text style={[styles.price, { color: colors.primary }]}>
                {formatPrice(appointment.inmueble_precio)}
              </Text>
            )}

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {appointment.inmueble_titulo}
            </Text>

            <View style={styles.locationRow}>
              <MapPin size={18} color={colors.textSecondary} />
              <Text style={[styles.location, { color: colors.textSecondary }]}>
                {appointment.inmueble_direccion}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.featuresGrid}>
              {appointment.inmueble_habitaciones !== undefined && (
                <View style={styles.featureItem}>
                  <Bed size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                  <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                    {appointment.inmueble_habitaciones} hab.
                  </Text>
                </View>
              )}

              {appointment.inmueble_banos !== undefined && (
                <View style={styles.featureItem}>
                  <Bath size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                  <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                    {appointment.inmueble_banos} {appointment.inmueble_banos === 1 ? 'baño' : 'baños'}
                  </Text>
                </View>
              )}

              {appointment.inmueble_area !== undefined && (
                <View style={styles.featureItem}>
                  <Home size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                  <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                    {appointment.inmueble_area} m²
                  </Text>
                </View>
              )}

              {appointment.inmueble_parqueaderos !== undefined && appointment.inmueble_parqueaderos > 0 && (
                <View style={styles.featureItem}>
                  <Car size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                  <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                    {appointment.inmueble_parqueaderos} parq.
                  </Text>
                </View>
              )}

              {appointment.inmueble_estrato && (
                <View style={styles.featureItem}>
                  <Layers size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                  <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                    Estrato {appointment.inmueble_estrato}
                  </Text>
                </View>
              )}

              <View style={styles.featureItem}>
                <Building2 size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                  {appointment.inmueble_tipo}
                </Text>
              </View>
            </View>
          </View>

          {/* SECCIÓN: UBICACIÓN */}
          {(appointment.inmueble_ciudad || appointment.inmueble_barrio) && (
            <View style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Ubicación del Inmueble
              </Text>
              <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Ciudad</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {appointment.inmueble_ciudad}
                  </Text>
                </View>
                {appointment.inmueble_barrio && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Barrio</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                      {appointment.inmueble_barrio}
                    </Text>
                  </View>
                )}
                {appointment.inmueble_tipo_negocio && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Tipo de negocio</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                      {appointment.inmueble_tipo_negocio === 'venta' ? 'Venta' : 'Arriendo'}
                    </Text>
                  </View>
                )}
              </View>
            )}

          {appointment.inmueble_descripcion && (
            <View style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Descripción
              </Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {appointment.inmueble_descripcion}
              </Text>
            </View>
          )}

          {appointment.inmueble_caracteristicas && appointment.inmueble_caracteristicas.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Características
              </Text>
              <View style={styles.featuresChips}>
                {appointment.inmueble_caracteristicas.map((feature, index) => (
                  <View key={index} style={[styles.featureChip, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                    <Text style={[styles.featureChipText, { color: colors.textPrimary }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {appointment.inmueble_coordenadas && (
            <View style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Ubicación
              </Text>
              <View style={styles.mapContainer}>
                <AppointmentMap
                  latitude={appointment.inmueble_coordenadas.lat}
                  longitude={appointment.inmueble_coordenadas.lng}
                  title={appointment.inmueble_titulo}
                  description={appointment.inmueble_direccion}
                />
              </View>
            </View>
          )}

          {/* SECCIÓN: INFORMACIÓN DE LA CITA */}
          <View style={[styles.appointmentInfoCard, { backgroundColor: colors.surface }, shadows.lg]}>
            <View style={styles.appointmentHeader}>
              <Calendar size={24} color={colors.primary} />
              <Text style={[styles.appointmentHeaderTitle, { color: colors.primary }]}>
                Información de la Cita
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.appointmentDetails}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Detalles de la Cita
            </Text>

            <View style={styles.appointmentInfoRow}>
              <Calendar size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Fecha</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {formatDate(appointment.fecha_cita)}
                </Text>
              </View>
            </View>

            <View style={styles.appointmentInfoRow}>
              <Clock size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Hora</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {appointment.hora_cita}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.appointmentCard}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Vendedor Asignado
            </Text>

            <View style={styles.infoRow}>
              <User size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Nombre</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {appointment.vendedor_nombre || 'Por Asignar'}
                </Text>
              </View>
            </View>

            <View style={styles.contactButtons}>
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: colors.primary }]}
                onPress={handleCall}
              >
                <Phone size={20} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>Llamar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: colors.primary }]}
                onPress={handleEmail}
              >
                <Mail size={20} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>Correo</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.contactDetails, { backgroundColor: colors.background }]}>
              <View style={styles.contactDetailRow}>
                <Phone size={16} color={colors.textSecondary} />
                <Text style={[styles.contactDetailText, { color: colors.textPrimary }]}>
                  {appointment.vendedor_celular}
                </Text>
              </View>
              <View style={styles.contactDetailRow}>
                <Mail size={16} color={colors.textSecondary} />
                <Text style={[styles.contactDetailText, { color: colors.textPrimary }]}>
                  {appointment.vendedor_email}
                </Text>
              </View>
            </View>
            </View>
            {appointment.notas_cliente && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Notas
                  </Text>
                  <Text style={[styles.description, { color: colors.textPrimary }]}>
                    {appointment.notas_cliente}
                  </Text>
                </View>
              </>
            )}
            </View>
          </View>
          {!appointment.confirmada_vendedor && appointment.estado === 'pendiente' && (
            <View style={[styles.warningBadge, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
              <Clock size={20} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>
                En espera de aceptación por parte del vendedor
              </Text>
            </View>
          )}
          {appointment.confirmada_vendedor && appointment.confirmada_cliente && (
            <View style={[styles.confirmedBadge, { backgroundColor: colors.success + '20' }]}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={[styles.confirmedText, { color: colors.success }]}>
                Has confirmado tu asistencia
              </Text>
            </View>
          )}
          {(appointment.estado === 'pendiente' || appointment.estado === 'confirmada') && (
            <View style={styles.actionButtons}>
              {appointment.confirmada_vendedor && !appointment.confirmada_cliente && appointment.estado === 'pendiente' && (
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.success }]}
                  onPress={handleConfirmAppointment}
                >
                  <CheckCircle size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Confirmar Asistencia</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.primary }]}
                onPress={handleRescheduleAppointment}
              >
                <Calendar size={20} color={colors.primary} />
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                  Reprogramar Cita
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dangerButton, { borderColor: colors.error }]}
                onPress={handleCancelAppointment}
              >
                <X size={20} color={colors.error} />
                <Text style={[styles.dangerButtonText, { color: colors.error }]}>
                  Cancelar Cita
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      <ConfirmModal
        visible={showCancelModal}
        title="Cancelar cita"
        message="¿Estás seguro que deseas cancelar esta cita?"
        confirmText="Sí, cancelar"
        cancelText="No"
        variant="destructive"
        loading={cancellingAppointment}
        onConfirm={confirmCancelAppointment}
        onCancel={() => setShowCancelModal(false)}
      />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.lg,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  propertyImage: {
    width: width,
    height: 300,
  },
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  noImageText: {
    fontSize: typography.fontSize.base,
  },
  navButtonImage: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -16 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: borderRadius.full,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  navButtonLeft: {
    left: spacing.sm,
  },
  navButtonRight: {
    right: spacing.sm,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    zIndex: 5,
  },
  imageIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: borderRadius.full,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  statusBadgeOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    zIndex: 5,
  },
  statusTextOverlay: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  propertyCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  price: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
    lineHeight: 28,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  location: {
    fontSize: typography.fontSize.base,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: '30%',
  },
  featureText: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  infoCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  featuresChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  featureChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  locationText: {
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  infoContent: {
    flex: 1,
    gap: spacing.xs,
  },
  mapContainer: {
    height: 200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  contactDetails: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  contactDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactDetailText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  notesText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  confirmedText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  actionButtons: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    borderWidth: 1,
  },
  dangerButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  characteristicsList: {
    gap: spacing.sm,
  },
  characteristicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  characteristicBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  characteristicText: {
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  appointmentSection: {
    gap: spacing.md,
  },
  sectionMainTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  sectionDivider: {
    height: 3,
    marginVertical: spacing.xl,
    borderRadius: borderRadius.sm,
  },
  appointmentCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  appointmentInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  appointmentInfoCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  appointmentHeaderTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  appointmentDetails: {
    gap: spacing.lg,
  },
});
