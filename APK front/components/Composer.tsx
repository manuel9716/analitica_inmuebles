import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getColors, spacing, borderRadius } from '@/constants/theme';
import { Send, Mic } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ComposerProps {
  onSend: (message: string) => void;
  onVoiceStart?: () => void;
  disabled?: boolean;
}

export default function Composer({ onSend, onVoiceStart, disabled }: ComposerProps) {
  const [message, setMessage] = useState('');
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
          placeholder="Escribe tu búsqueda..."
          placeholderTextColor={colors.textSecondary}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
          editable={!disabled}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />

        <View style={styles.actions}>
          {onVoiceStart && (
            <TouchableOpacity
              style={[styles.button, styles.actionButton]}
              onPress={onVoiceStart}
              disabled={disabled}
            >
              <Mic size={20} color={disabled ? colors.textSecondary : (isDark ? '#FFFFFF' : colors.primary)} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              styles.actionButton,
              { backgroundColor: (!message.trim() || disabled) ? colors.textSecondary : colors.primary },
            ]}
            onPress={handleSend}
            disabled={!message.trim() || disabled}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm + 2,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 44,
    textAlignVertical: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    borderRadius: borderRadius.full,
    width: 40,
    height: 40,
    padding: spacing.xs,
  },
});
