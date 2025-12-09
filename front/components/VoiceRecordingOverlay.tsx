import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { getColors, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Send } from 'lucide-react-native';

interface VoiceRecordingOverlayProps {
  onCancel: () => void;
  onSend: () => void;
  duration: number;
  transcript?: string;
}

export default function VoiceRecordingOverlay({ onCancel, onSend, duration, transcript = '' }: VoiceRecordingOverlayProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const wave1Anim = useRef(new Animated.Value(1)).current;
  const wave2Anim = useRef(new Animated.Value(1)).current;
  const wave3Anim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(wave1Anim, {
            toValue: 1.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(wave1Anim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(wave2Anim, {
            toValue: 1.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(wave2Anim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(wave3Anim, {
            toValue: 1.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(wave3Anim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.Text style={[styles.title, { opacity: opacityAnim, color: colors.surface }]}>
          Escuchando...
        </Animated.Text>

        <View style={styles.waveContainer}>
          <Animated.View
            style={[
              styles.wave,
              styles.wave3,
              {
                transform: [{ scale: wave3Anim }],
                opacity: 0.2,
                backgroundColor: colors.accent,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.wave,
              styles.wave2,
              {
                transform: [{ scale: wave2Anim }],
                opacity: 0.4,
                backgroundColor: colors.accent,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.wave,
              styles.wave1,
              {
                transform: [{ scale: wave1Anim }],
                backgroundColor: colors.accent,
              },
            ]}
          />
          <View style={[styles.micIcon, { backgroundColor: colors.primary }]}>
            <Text style={styles.micEmoji}>🎤</Text>
          </View>
        </View>

        <Text style={[styles.duration, { color: colors.surface }]}>{formatDuration(duration)}</Text>

        {transcript ? (
          <View style={[styles.transcriptContainer, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
            <Text style={[styles.transcriptText, { color: colors.surface }]}>{transcript}</Text>
          </View>
        ) : (
          <Text style={[styles.hint, { color: colors.surface }]}>Habla ahora o toca para detener</Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.surface }]} onPress={onCancel}>
            <X size={24} color={colors.error} />
            <Text style={[styles.cancelText, { color: colors.error }]}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.accent }]} onPress={onSend}>
            <Send size={24} color={colors.surface} />
            <Text style={[styles.sendText, { color: colors.surface }]}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    marginBottom: spacing.xl,
  },
  waveContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  wave: {
    position: 'absolute',
    borderRadius: 100,
  },
  wave1: {
    width: 80,
    height: 80,
  },
  wave2: {
    width: 120,
    height: 120,
  },
  wave3: {
    width: 160,
    height: 160,
  },
  micIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  micEmoji: {
    fontSize: 32,
  },
  hint: {
    fontSize: typography.fontSize.sm,
    opacity: 0.7,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  duration: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  transcriptContainer: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    minHeight: 60,
    maxWidth: '90%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcriptText: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  cancelText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  sendText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
});
