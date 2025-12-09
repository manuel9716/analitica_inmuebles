import React, { useState, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/contexts/AuthContext';
import { getColors, spacing, borderRadius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Eye, EyeOff, Mail, Lock, User, Phone, FileText, CreditCard } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from './Toast';

interface RegisterModalProps {
  visible: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({ visible, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [documentType, setDocumentType] = useState<'CC' | 'CE' | 'PA'>('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });
  const { signUp } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  useEffect(() => {
    loadSessionId();
  }, []);

  const loadSessionId = async () => {
    try {
      const id = await AsyncStorage.getItem('session_id');
      setSessionId(id);
    } catch (error) {
      console.error('Error loading session ID:', error);
    }
  };

  const handleRegister = async () => {
    if (!fullName || !phone || !documentNumber || !email || !password) {
      setToast({ visible: true, message: 'Por favor completa todos los campos', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setToast({ visible: true, message: 'La contraseña debe tener al menos 6 caracteres', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, sessionId, {
        full_name: fullName,
        phone,
        document_type: documentType,
        document_number: documentNumber,
      });

      if (sessionId) {
        setToast({ visible: true, message: 'Cuenta creada. Tus datos han sido migrados correctamente', type: 'success' });
      } else {
        setToast({ visible: true, message: 'Cuenta creada correctamente', type: 'success' });
      }

      setTimeout(() => {
        setFullName('');
        setPhone('');
        setDocumentNumber('');
        setEmail('');
        setPassword('');
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error al registrarse:', error);
      const errorMessage = error.message || 'Ocurrió un error';

      if (errorMessage.includes('User already registered')) {
        setToast({ visible: true, message: 'Este email ya está registrado. Intenta iniciar sesión.', type: 'error' });
      } else if (errorMessage.includes('Invalid email')) {
        setToast({ visible: true, message: 'El formato del email no es válido', type: 'error' });
      } else {
        setToast({ visible: true, message: errorMessage, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFullName('');
    setPhone('');
    setDocumentNumber('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    onClose();
  };

  return (
    <>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
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

              <Text style={[styles.title, { color: colors.textPrimary }]}>Crear Cuenta</Text>

              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Nombre Completo</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <User size={20} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.input, { color: colors.textPrimary }]}
                        placeholder="Juan Pérez"
                        placeholderTextColor={colors.textSecondary}
                        value={fullName}
                        onChangeText={setFullName}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Celular</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Phone size={20} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.input, { color: colors.textPrimary }]}
                        placeholder="3001234567"
                        placeholderTextColor={colors.textSecondary}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputContainer, styles.halfWidth]}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Tipo de Documento</Text>
                      <View style={[styles.pickerWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <FileText size={20} color={colors.textSecondary} />
                        <Picker
                          selectedValue={documentType}
                          onValueChange={(value) => setDocumentType(value as 'CC' | 'CE' | 'PA')}
                          style={[styles.picker, { color: colors.textPrimary }]}
                          enabled={!loading}
                        >
                          <Picker.Item label="CC" value="CC" />
                          <Picker.Item label="CE" value="CE" />
                          <Picker.Item label="PA" value="PA" />
                        </Picker>
                      </View>
                    </View>

                    <View style={[styles.inputContainer, styles.halfWidth]}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>Número</Text>
                      <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <CreditCard size={20} color={colors.textSecondary} />
                        <TextInput
                          style={[styles.input, { color: colors.textPrimary }]}
                          placeholder="123456789"
                          placeholderTextColor={colors.textSecondary}
                          value={documentNumber}
                          onChangeText={setDocumentNumber}
                          keyboardType="number-pad"
                          editable={!loading}
                        />
                      </View>
                    </View>
                  </View>

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

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Contraseña</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Lock size={20} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.input, { color: colors.textPrimary }]}
                        placeholder="••••••••"
                        placeholderTextColor={colors.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                          <EyeOff size={20} color={colors.textSecondary} />
                        ) : (
                          <Eye size={20} color={colors.textSecondary} />
                        )}
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                      La contraseña debe tener al menos 6 caracteres
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.registerButton, { backgroundColor: colors.primary }]}
                    onPress={handleRegister}
                    disabled={loading}
                  >
                    <Text style={styles.registerButtonText}>
                      {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.switchButton}
                    onPress={() => {
                      handleClose();
                      onSwitchToLogin();
                    }}
                  >
                    <Text style={[styles.switchButtonText, { color: colors.primary }]}>
                      ¿Ya tienes cuenta? Inicia sesión
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
    </>
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
    width: '95%',
    maxHeight: '90%',
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
    marginBottom: spacing.lg,
  },
  scrollView: {
    maxHeight: 500,
  },
  form: {
    gap: spacing.lg,
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    paddingLeft: spacing.md,
    borderWidth: 1,
  },
  picker: {
    flex: 1,
    height: 48,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  registerButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
});
