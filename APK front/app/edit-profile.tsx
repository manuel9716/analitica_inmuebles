import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { getColors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { profileService } from '@/services/profileService';
import { UserProfile } from '@/types';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const data = await profileService.getProfile();
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    try {
      await profileService.updateProfile(profile);
      Alert.alert('Éxito', 'Perfil actualizado correctamente', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Editar Perfil',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitle: '',
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Nombre completo</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Ingresa tu nombre completo"
            placeholderTextColor={colors.textSecondary}
            value={profile.full_name || ''}
            onChangeText={(text) => setProfile({ ...profile, full_name: text })}
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Teléfono</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Ingresa tu teléfono"
            placeholderTextColor={colors.textSecondary}
            value={profile.phone || ''}
            onChangeText={(text) => setProfile({ ...profile, phone: text })}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Tipo de documento</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Picker
              selectedValue={profile.document_type || 'CC'}
              onValueChange={(value) =>
                setProfile({ ...profile, document_type: value as 'CC' | 'CE' | 'PA' })
              }
              style={styles.picker}
              enabled={!loading}
            >
              <Picker.Item label="Cédula de Ciudadanía" value="CC" />
              <Picker.Item label="Cédula de Extranjería" value="CE" />
              <Picker.Item label="Pasaporte" value="PA" />
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Número de documento</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Ingresa tu número de documento"
            placeholderTextColor={colors.textSecondary}
            value={profile.document_number || ''}
            onChangeText={(text) => setProfile({ ...profile, document_number: text })}
            keyboardType="number-pad"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: loading ? colors.textSecondary : colors.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </View>
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
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    borderWidth: 1,
  },
  pickerContainer: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  saveButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.md,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
  },
});
