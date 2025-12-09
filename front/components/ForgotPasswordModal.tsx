import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getColors, spacing, borderRadius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Mail } from 'lucide-react-native';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ visible, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      Alert.alert(
        'Correo enviado',
        'Te hemos enviado un correo con las instrucciones para recuperar tu contraseña. Revisa tu bandeja de entrada.',
        [
          {
            text: 'OK',
            onPress: handleClose,
          },
        ]
      );
    } catch (error: any) {
      console.error('Error al recuperar contraseña:', error);
      Alert.alert(
        'Error',
        'No pudimos enviar el correo de recuperación. Verifica que el correo esté registrado e intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={styles.overlayTouchable}
          onPress={handleClose}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <Text style={[styles.title, { color: colors.textPrimary }]}>Recuperar Contraseña</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                Ingresa tu correo electrónico y te enviaremos un enlace para recuperar tu contraseña.
              </Text>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>Correo Electrónico</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Mail size={20} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary }]}
                      placeholder="tu@email.com"
                      placeholderTextColor={colors.textSecondary}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading}
                    />
                  </View>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: colors.border }]}
                    onPress={handleClose}
                    disabled={loading}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: colors.primary }]}
                    onPress={handleResetPassword}
                    disabled={loading}
                  >
                    <Text style={styles.sendButtonText}>
                      {loading ? 'Enviando...' : 'Enviar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.sm,
    zIndex: 10,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.xl,
  },
  inputContainer: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  sendButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
  },
});
