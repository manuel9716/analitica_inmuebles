import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getColors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { appointmentsAppService } from '@/services/appointmentsAppService';
import { supabase } from '@/lib/supabase';
import { X, Calendar, CheckCircle, AlertCircle } from 'lucide-react-native';

export default function ScheduleVisitModal() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  // Parse listing from params
  let listing: any = null;
  try {
    if (params.listing && typeof params.listing === 'string') {
      listing = JSON.parse(params.listing);
    }
  } catch (error) {
    console.error('Error parsing listing:', error);
  }

  // Fallback to individual params if listing is not available
  const listingId = listing?.id || (params.listingId as string);
  const listingTitle = listing?.title || (params.listingTitle as string);
  const rescheduleId = params.rescheduleId as string | undefined;
  const isRescheduling = !!rescheduleId;

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const availableTimes = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  // Validate listing data on mount
  React.useEffect(() => {
    if (!user) {
      Alert.alert(
        'Inicia sesión',
        'Debes iniciar sesión para programar una cita',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
      return;
    }

    if (!listingId || !listingTitle) {
      Alert.alert(
        'Error',
        'No se pudo cargar la información de la propiedad',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [listingId, listingTitle, user]);

  const handleSchedule = async () => {
    // Validate required fields
    if (!listingId || !listingTitle) {
      Alert.alert('Error', 'Información de la propiedad no disponible');
      return;
    }

    if (!selectedTime) {
      Alert.alert('Error', 'Por favor selecciona una hora para la visita');
      return;
    }

    setLoading(true);

    try {
      console.log('[ScheduleVisit] Iniciando proceso de agendamiento...');
      console.log('[ScheduleVisit] Usuario:', user?.id);

      const listingData = listing || {
        id: listingId,
        title: listingTitle,
        price: 0,
        location: '',
        bedrooms: 0,
        bathrooms: 0,
        area: 0,
        images: [],
        description: '',
        propertyType: 'casa',
        transactionType: 'venta',
      };

      // Obtener datos del usuario desde la tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('nombre_completo, email, celular')
        .eq('id', user?.id)
        .maybeSingle();

      if (userError) {
        console.error('[ScheduleVisit] Error obteniendo datos del usuario:', userError);
      }

      console.log('[ScheduleVisit] Datos del usuario obtenidos:', userData);

      // Obtener datos de contacto del vendedor desde la integración WASI (campo configuracion)
      console.log('[ScheduleVisit] ===== CONSULTANDO DATOS DE WASI =====');
      console.log('[ScheduleVisit] Tabla: api_integrations');
      console.log('[ScheduleVisit] ID a buscar: 66b99dcf-de09-4e2a-8af4-65f6dcff6601');

      const { data: wasiIntegration, error: wasiError } = await supabase
        .from('api_integrations')
        .select('configuracion')
        .eq('id', '66b99dcf-de09-4e2a-8af4-65f6dcff6601')
        .maybeSingle();

      if (wasiError) {
        console.error('[ScheduleVisit] ❌ ERROR obteniendo datos de WASI:', wasiError);
        console.error('[ScheduleVisit] Error completo:', JSON.stringify(wasiError, null, 2));
      }

      console.log('[ScheduleVisit] ✅ Datos WASI obtenidos:', wasiIntegration);
      console.log('[ScheduleVisit] configuracion:', wasiIntegration?.configuracion);

      // Extraer datos de contacto del campo configuracion de WASI
      const wasiConfig = wasiIntegration?.configuracion || {};
      console.log('[ScheduleVisit] wasiConfig extraído:', wasiConfig);
      console.log('[ScheduleVisit] wasiConfig.nombre:', wasiConfig.nombre);
      console.log('[ScheduleVisit] wasiConfig.correo:', wasiConfig.correo);
      console.log('[ScheduleVisit] wasiConfig.celular:', wasiConfig.celular);

      console.log('[ScheduleVisit] listing?.seller:', listing?.seller);

      const vendedorNombre = listing?.seller?.name || wasiConfig.nombre || 'Fredy Colorado';
      const vendedorEmail = listing?.seller?.email || wasiConfig.correo || 'fcortes@softnexus.io';
      const vendedorCelular = listing?.seller?.phone || wasiConfig.celular || '3023402605';

      console.log('[ScheduleVisit] ===== VENDEDOR FINAL =====');
      console.log('[ScheduleVisit] vendedorNombre:', vendedorNombre);
      console.log('[ScheduleVisit] vendedorEmail:', vendedorEmail);
      console.log('[ScheduleVisit] vendedorCelular:', vendedorCelular);

      const input = {
        cliente_nombre: userData?.nombre_completo || 'Usuario',
        cliente_email: userData?.email || user?.email || 'email@example.com',
        cliente_celular: userData?.celular || '+573000000000',
        cliente_id: user?.id,

        vendedor_nombre: vendedorNombre,
        vendedor_email: vendedorEmail,
        vendedor_celular: vendedorCelular,

        inmueble_id: listingId,
        inmueble_titulo: listingTitle,
        inmueble_tipo: listing?.propertyType || 'casa',
        inmueble_direccion: listing?.location || 'Dirección no disponible',
        inmueble_ciudad: listing?.city || 'Ciudad',
        inmueble_departamento: listing?.department || 'Departamento',
        inmueble_barrio: listing?.neighborhood,
        inmueble_coordenadas: listing?.coordinates,
        inmueble_precio: listing?.price,
        inmueble_imagen_url: listing?.images?.[0],
        inmueble_imagenes: listing?.images,
        inmueble_url: `https://buscofacil.com/inmuebles/${listingId}`,
        inmueble_habitaciones: listing?.bedrooms,
        inmueble_banos: listing?.bathrooms,
        inmueble_area: listing?.area,
        inmueble_parqueaderos: listing?.parking,
        inmueble_estrato: listing?.estrato,
        inmueble_tipo_negocio: listing?.transactionType,
        inmueble_descripcion: listing?.description,
        inmueble_caracteristicas: listing?.features,

        fecha_cita: dateToLocalString(date),
        hora_inicio: selectedTime,
        hora_cita: selectedTime,
        duracion_minutos: 60,

        notas_cliente: notes,
        canal_comunicacion: 'app' as const,
      };

      console.log('[ScheduleVisit] ===== DATOS FINALES =====');
      console.log('[ScheduleVisit] Cliente:', {
        nombre: input.cliente_nombre,
        email: input.cliente_email,
        celular: input.cliente_celular,
        id: input.cliente_id
      });
      console.log('[ScheduleVisit] Vendedor:', {
        nombre: input.vendedor_nombre,
        email: input.vendedor_email,
        celular: input.vendedor_celular
      });
      console.log('[ScheduleVisit] Datos completos a enviar:', JSON.stringify(input, null, 2));

      if (isRescheduling && rescheduleId) {
        // Reprogramar cita existente
        console.log('[ScheduleVisit] Reprogramando cita:', rescheduleId);
        await appointmentsAppService.rescheduleAppointment(
          rescheduleId,
          dateToLocalString(date),
          selectedTime,
          notes || 'Reprogramada por el cliente'
        );
        console.log('[ScheduleVisit] Cita reprogramada exitosamente');
      } else {
        // Crear nueva cita
        const result = await appointmentsAppService.createAppointment(input);
        console.log('[ScheduleVisit] Cita creada exitosamente:', result);
      }

      setLoading(false);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('[ScheduleVisit] Error completo:', error);
      console.error('[ScheduleVisit] Error mensaje:', error?.message);
      console.error('[ScheduleVisit] Error detalles:', error?.details);

      setLoading(false);

      const message = error?.message || 'No se pudo pre agendar la visita';
      setErrorMessage(message);
      setShowErrorModal(true);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const dateToLocalString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getTimeSlotText = (slot: 'morning' | 'afternoon') => {
    return slot === 'morning'
      ? 'Mañana (9:00 AM - 12:00 PM)'
      : 'Tarde (2:00 PM - 6:00 PM)';
  };

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {isRescheduling ? 'Reprogramar Visita' : 'Pre Agendar Visita'}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={[styles.propertyTitle, { color: colors.textPrimary }]}>{listingTitle}</Text>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Fecha preferida</Text>

            {Platform.OS === 'web' ? (
              <View style={[
                styles.dateInputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }
              ]}>
                <Calendar size={20} color={colors.primary} style={styles.dateIcon} />
                <input
                  type="date"
                  value={dateToLocalString(date)}
                  onChange={(e) => {
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    const newDate = new Date(year, month - 1, day);
                    if (!isNaN(newDate.getTime())) {
                      setDate(newDate);
                    }
                  }}
                  min={dateToLocalString(new Date())}
                  style={{
                    flex: 1,
                    padding: 12,
                    fontSize: 16,
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: colors.textPrimary,
                    outline: 'none',
                  }}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.dateTimeButton,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    }
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar size={20} color="#FFFFFF" />
                  <Text style={[styles.dateTimeText, { color: '#FFFFFF' }]}>
                    {formatDate(date)}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <View style={[styles.pickerContainer, { backgroundColor: !isDark ? colors.primary : 'transparent' }]}>
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (selectedDate) {
                          setDate(selectedDate);
                        }
                      }}
                      minimumDate={new Date()}
                      themeVariant="dark"
                      accentColor="#FFFFFF"
                      textColor="#FFFFFF"
                      style={{ backgroundColor: !isDark ? colors.primary : 'transparent' }}
                    />
                  </View>
                )}
              </>
            )}

          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Hora de la visita</Text>

            <View style={styles.timeGrid}>
              {availableTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeChip,
                    {
                      backgroundColor: selectedTime === time ? colors.primary : colors.surface,
                      borderColor: selectedTime === time ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[
                    styles.timeChipText,
                    { color: selectedTime === time ? '#FFFFFF' : colors.textPrimary }
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Notas adicionales (opcional)</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                }
              ]}
              placeholder="Escribe cualquier información adicional..."
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.scheduleButton,
              { backgroundColor: colors.primary },
              loading && { backgroundColor: colors.textSecondary }
            ]}
            onPress={handleSchedule}
            disabled={loading}
          >
            <Text style={[styles.scheduleButtonText, { color: '#FFFFFF' }]}>
              {loading
                ? (isRescheduling ? 'Reprogramando...' : 'Pre agendando...')
                : (isRescheduling ? 'Reprogramar Visita' : 'Pre Agendar Visita')
              }
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
      >
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <View style={[styles.modalContent, { backgroundColor: colors.background }]} pointerEvents="auto">
            <View style={[styles.modalIconContainer, { backgroundColor: '#10B981' }]}>
              <CheckCircle size={48} color="#FFFFFF" />
            </View>

            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {isRescheduling ? '¡Visita Reprogramada!' : '¡Visita Pre Agendada!'}
            </Text>

            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {isRescheduling
                ? `Tu visita ha sido reprogramada para el ${formatDate(date)} a las ${selectedTime}.\n\nEl vendedor será notificado del cambio.`
                : `Tu visita ha sido pre agendada para el ${formatDate(date)} a las ${selectedTime}.\n\nTe contactaremos pronto para confirmar la cita.`
              }
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonSecondary,
                  { borderColor: colors.border },
                  pressed && { opacity: 0.7 }
                ]}
                onPress={() => {
                  console.log('[Modal] Entendido pressed');
                  setShowSuccessModal(false);
                  setTimeout(() => {
                    router.back();
                  }, 100);
                }}
              >
                <Text style={[styles.modalButtonTextSecondary, { color: colors.textPrimary }]}>
                  Entendido
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 }
                ]}
                onPress={() => {
                  console.log('[Modal] Ver Mis Citas pressed');
                  setShowSuccessModal(false);
                  setTimeout(() => {
                    router.back();
                    setTimeout(() => {
                      router.push('/appointments');
                    }, 200);
                  }, 100);
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>
                  Ver Mis Citas
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <View style={[styles.modalContent, { backgroundColor: colors.background }]} pointerEvents="auto">
            <View style={[styles.modalIconContainer, { backgroundColor: '#EF4444' }]}>
              <AlertCircle size={48} color="#FFFFFF" />
            </View>

            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Error al Pre Agendar
            </Text>

            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {errorMessage}
              {'\n\n'}
              Por favor, intenta de nuevo o contacta a soporte.
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonSecondary,
                  { borderColor: colors.border },
                  pressed && { opacity: 0.7 }
                ]}
                onPress={() => {
                  console.log('[Modal] Cancelar pressed');
                  setShowErrorModal(false);
                }}
              >
                <Text style={[styles.modalButtonTextSecondary, { color: colors.textPrimary }]}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 }
                ]}
                onPress={() => {
                  console.log('[Modal] Reintentar pressed');
                  setShowErrorModal(false);
                  setTimeout(() => {
                    handleSchedule();
                  }, 100);
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>
                  Reintentar
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  propertyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  dateTimeText: {
    fontSize: typography.fontSize.base,
    flex: 1,
  },
  textArea: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  scheduleButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.md,
  },
  scheduleButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    overflow: 'hidden',
    transform: [{ scaleY: 0.85 }],
    height: Platform.OS === 'ios' ? 180 : undefined,
  },
  timeSlotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timeSlotText: {
    fontSize: typography.fontSize.base,
    flex: 1,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  timeChipText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingLeft: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  dateIcon: {
    marginRight: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...shadows.lg,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalMessage: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  } as any,
  modalButtonPrimary: {
    ...shadows.sm,
  },
  modalButtonSecondary: {
    borderWidth: 1,
  },
  modalButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
});
