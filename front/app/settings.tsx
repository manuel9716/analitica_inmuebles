import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Stack, useRouter } from 'expo-router';
import { getColors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { useVoice } from '@/contexts/VoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { profileService } from '@/services/profileService';
import { Volume2, Bell, Mail, MessageSquare, Moon, Sun } from 'lucide-react-native';
import Toast from '@/components/Toast';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings, updateSettings, speak } = useVoice();
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = getColors(isDark);

  const [localSettings, setLocalSettings] = useState(settings);
  const [notifications, setNotifications] = useState({
    email_appointments: true,
    email_messages: false,
    email_updates: true,
    push_appointments: true,
    push_messages: true,
    sms_appointments: false,
  });
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });

  useEffect(() => {
    setLocalSettings(settings);
    loadNotificationSettings();
  }, [settings, user]);

  const loadNotificationSettings = async () => {
    if (!user) return;
    try {
      const userSettings = await profileService.getNotificationSettings();
      if (userSettings) {
        setNotifications(userSettings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      if (user) {
        await profileService.updateNotificationSettings(notifications);
      }
      setToast({ visible: true, message: 'Configuración guardada correctamente', type: 'success' });
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      setToast({ visible: true, message: 'No se pudo guardar la configuración', type: 'error' });
    }
  };

  const handleTestVoice = () => {
    speak('Hola, esta es una prueba de cómo suena tu asistente de voz configurado.');
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Configuración',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitle: '',
        }}
      />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Apariencia</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              {isDark ? (
                <Moon size={18} color={colors.textPrimary} />
              ) : (
                <Sun size={18} color={colors.textPrimary} />
              )}
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Modo Oscuro</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notificaciones</Text>

          {/* Email Notifications */}
          <View style={[styles.notificationCategory, { borderBottomColor: colors.border }]}>
            <View style={styles.categoryHeader}>
              <Mail size={20} color={isDark ? '#FFFFFF' : colors.primary} />
              <Text style={[styles.categoryTitle, { color: colors.textPrimary }]}>Notificaciones por Email</Text>
            </View>
            <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
              Recibe actualizaciones importantes directamente en tu correo electrónico
            </Text>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Citas programadas</Text>
              <Switch
                value={notifications.email_appointments}
                onValueChange={(value) =>
                  setNotifications(prev => ({ ...prev, email_appointments: value }))
                }
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.surface}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Nuevos mensajes</Text>
              <Switch
                value={notifications.email_messages}
                onValueChange={(value) =>
                  setNotifications(prev => ({ ...prev, email_messages: value }))
                }
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.surface}
              />
            </View>

            <View style={[styles.settingRow, styles.lastSettingRow]}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Actualizaciones de propiedades</Text>
              <Switch
                value={notifications.email_updates}
                onValueChange={(value) =>
                  setNotifications(prev => ({ ...prev, email_updates: value }))
                }
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.surface}
              />
            </View>
          </View>

          {/* Push Notifications */}
          <View style={[styles.notificationCategory, { borderBottomColor: colors.border }]}>
            <View style={styles.categoryHeader}>
              <Bell size={20} color={isDark ? '#FFFFFF' : colors.primary} />
              <Text style={[styles.categoryTitle, { color: colors.textPrimary }]}>Notificaciones Push</Text>
            </View>
            <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
              Alertas instantáneas en tu dispositivo móvil
            </Text>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Citas programadas</Text>
              <Switch
                value={notifications.push_appointments}
                onValueChange={(value) =>
                  setNotifications(prev => ({ ...prev, push_appointments: value }))
                }
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.surface}
              />
            </View>

            <View style={[styles.settingRow, styles.lastSettingRow]}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Nuevos mensajes</Text>
              <Switch
                value={notifications.push_messages}
                onValueChange={(value) =>
                  setNotifications(prev => ({ ...prev, push_messages: value }))
                }
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.surface}
              />
            </View>
          </View>

          {/* SMS Notifications */}
          <View style={[styles.notificationCategory, styles.lastNotificationCategory]}>
            <View style={styles.categoryHeader}>
              <MessageSquare size={20} color={isDark ? '#FFFFFF' : colors.primary} />
              <Text style={[styles.categoryTitle, { color: colors.textPrimary }]}>Notificaciones por SMS</Text>
            </View>
            <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
              Recordatorios importantes vía mensaje de texto
            </Text>

            <View style={[styles.settingRow, styles.lastSettingRow]}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Citas programadas</Text>
              <Switch
                value={notifications.sms_appointments}
                onValueChange={(value) =>
                  setNotifications(prev => ({ ...prev, sms_appointments: value }))
                }
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.surface}
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Preferencias de Voz</Text>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Activar voz</Text>
            <Switch
              value={localSettings.voice_enabled}
              onValueChange={(value) =>
                setLocalSettings(prev => ({ ...prev, voice_enabled: value }))
              }
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.surface}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Género de voz</Text>
            <View style={styles.genderButtons}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  { borderColor: colors.border },
                  localSettings.voice_gender === 'male' && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() =>
                  setLocalSettings(prev => ({ ...prev, voice_gender: 'male' }))
                }
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    { color: colors.textPrimary },
                    localSettings.voice_gender === 'male' && { color: colors.surface },
                  ]}
                >
                  Masculino
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  { borderColor: colors.border },
                  localSettings.voice_gender === 'female' && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() =>
                  setLocalSettings(prev => ({ ...prev, voice_gender: 'female' }))
                }
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    { color: colors.textPrimary },
                    localSettings.voice_gender === 'female' && { color: '#FFFFFF' },
                  ]}
                >
                  Femenino
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sliderContainer}>
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
              Velocidad: {localSettings.voice_rate.toFixed(2)}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={2.0}
              value={localSettings.voice_rate}
              onValueChange={(value) =>
                setLocalSettings(prev => ({ ...prev, voice_rate: value }))
              }
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={styles.sliderContainer}>
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
              Tono: {localSettings.voice_pitch.toFixed(2)}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={2.0}
              value={localSettings.voice_pitch}
              onValueChange={(value) =>
                setLocalSettings(prev => ({ ...prev, voice_pitch: value }))
              }
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={styles.sliderContainer}>
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
              Volumen: {localSettings.voice_volume.toFixed(2)}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1.0}
              value={localSettings.voice_volume}
              onValueChange={(value) =>
                setLocalSettings(prev => ({ ...prev, voice_volume: value }))
              }
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <TouchableOpacity style={[styles.testButton, { backgroundColor: colors.accent }]} onPress={handleTestVoice}>
            <Volume2 size={20} color={colors.surface} />
            <Text style={[styles.testButtonText, { color: colors.surface }]}>Probar Voz</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
          <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>Guardar Cambios</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  lastSettingRow: {
    marginBottom: 0,
  },
  notificationCategory: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  lastNotificationCategory: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  categoryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },
  categoryDescription: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  settingLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  genderButtonActive: {
  },
  genderButtonText: {
    fontSize: typography.fontSize.sm,
  },
  genderButtonTextActive: {
  },
  sliderContainer: {
    marginBottom: spacing.lg,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  testButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.md,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
  },
  aboutDescription: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  aboutDescriptionText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  aboutLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aboutLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  aboutValue: {
    fontSize: typography.fontSize.base,
  },
  divider: {
    height: 1,
    marginVertical: spacing.lg,
  },
  legalSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  legalButton: {
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  legalDivider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  legalButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  footerInfo: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  copyright: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  developer: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  developerName: {
    fontWeight: '600',
  },
});
