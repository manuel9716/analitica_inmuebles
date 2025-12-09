import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
import { getColors, spacing, borderRadius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Heart, Calendar, Clock } from 'lucide-react-native';

interface AuthPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export default function AuthPromptModal({ visible, onClose, onLogin, onRegister }: AuthPromptModalProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.overlayTouchable}
          onPress={onClose}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Regístrate para más funciones
              </Text>

              <Text style={[styles.description, { color: colors.textSecondary }]}>
                Guarda favoritos, programa citas y accede a tu historial
              </Text>

              <View style={styles.features}>
                <View style={styles.feature}>
                  <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <Heart size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                    Guarda tus propiedades favoritas
                  </Text>
                </View>

                <View style={styles.feature}>
                  <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <Calendar size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                    Programa visitas y citas
                  </Text>
                </View>

                <View style={styles.feature}>
                  <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <Clock size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                    Accede a tu historial de búsquedas
                  </Text>
                </View>
              </View>

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.registerButton, { backgroundColor: colors.primary }]}
                  onPress={onRegister}
                >
                  <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.loginButton, { borderColor: colors.border }]}
                  onPress={onLogin}
                >
                  <Text style={[styles.loginButtonText, { color: colors.primary }]}>
                    Ya tengo cuenta
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </View>
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
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  features: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  buttons: {
    gap: spacing.md,
  },
  registerButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
  },
  loginButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  loginButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
});
