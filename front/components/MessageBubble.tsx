import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Message, Listing } from '@/types';
import { getColors, typography, spacing, borderRadius } from '@/constants/theme';
import { Volume2, VolumeX } from 'lucide-react-native';
import PropertyCard from './PropertyCard';
import { useVoice } from '@/contexts/VoiceContext';
import { useTheme } from '@/contexts/ThemeContext';

interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
  listings?: Listing[];
  onToggleSelect?: (listing: Listing) => void;
  onPlayVoice?: () => void;
  isPlayingVoice?: boolean;
  selectedListings?: string[];
  currentMessageId?: string | null;
  onRemoveFromSelection?: (listingId: string) => void;
  onAuthRequired?: () => void;
}

export default function MessageBubble({
  message,
  isUser,
  listings,
  onToggleSelect,
  onPlayVoice,
  isPlayingVoice,
  selectedListings,
  currentMessageId,
  onRemoveFromSelection,
  onAuthRequired,
}: MessageBubbleProps) {
  const { speak } = useVoice();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const hasSpoken = useRef(false);

  useEffect(() => {
    if (!isUser && message.role === 'assistant' && !hasSpoken.current) {
      hasSpoken.current = true;
      const textToSpeak = generateFullTextToSpeak();
      speak(textToSpeak);
    }
  }, [message.id]);

  const generateFullTextToSpeak = (): string => {
    let fullText = message.content;

    if (listings && listings.length > 0) {
      const listingsText = listings.slice(0, 3).map((listing, index) => {
        const parts: string[] = [];
        parts.push(`Propiedad ${index + 1}:`);
        if (listing.title) parts.push(listing.title);
        if (listing.location) parts.push(`en ${listing.location}`);

        if (listing.price) {
          const priceFormatted = listing.price >= 1000000
            ? `${(listing.price / 1000000).toFixed(0)} millones`
            : `${listing.price.toLocaleString('es-CO')} pesos`;
          parts.push(`Precio: ${priceFormatted}`);
        }

        if (listing.area) parts.push(`${listing.area} metros cuadrados`);
        if (listing.bedrooms) parts.push(`${listing.bedrooms} habitaciones`);
        if (listing.bathrooms) parts.push(`${listing.bathrooms} baños`);

        return parts.join(', ');
      }).join('. ');

      if (listings.length > 3) {
        fullText += '. ' + listingsText + `. Y ${listings.length - 3} propiedades más.`;
      } else {
        fullText += '. ' + listingsText;
      }
    }

    return fullText;
  };

  const bubbleStyle = isUser
    ? {
        backgroundColor: colors.userBubble,
        borderWidth: 2,
        borderColor: colors.primary,
      }
    : message.role === 'system'
    ? { backgroundColor: colors.systemBubble }
    : {
        backgroundColor: colors.assistantBubble,
        borderWidth: !isDark ? 2 : 0,
        borderColor: !isDark ? colors.primary : 'transparent',
      };

  const textStyle = isUser
    ? { color: '#FFFFFF' }
    : { color: colors.textPrimary };

  return (
    <View style={[styles.container, isUser && styles.userContainer]}>
      <View style={[styles.bubble, bubbleStyle]}>
        <Text style={[styles.text, textStyle]} numberOfLines={0}>{message.content}</Text>

        {!isUser && onPlayVoice && (
          <TouchableOpacity style={styles.voiceButton} onPress={onPlayVoice}>
            {isPlayingVoice ? (
              <VolumeX size={20} color={isDark ? '#FFFFFF' : colors.primary} />
            ) : (
              <Volume2 size={20} color={isDark ? '#FFFFFF' : colors.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {listings && listings.length > 0 && !message.frozenSelection && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.listingsContainer}
          contentContainerStyle={styles.listingsContent}
        >
          {listings.map((listing) => (
            <PropertyCard
              key={listing.id}
              listing={listing}
              onToggleSelect={onToggleSelect}
              isSelected={selectedListings?.includes(listing.id) || false}
              isActive={message.id === currentMessageId}
              isFrozen={message.frozenSelection}
              onAuthRequired={onAuthRequired}
            />
          ))}
        </ScrollView>
      )}

      {message.frozenSelection && message.selectedListingIds && message.selectedListingIds.length > 0 && (
        <View style={[
          styles.selectionPanel,
          {
            backgroundColor: 'rgba(107, 114, 128, 0.3)',
            borderTopColor: colors.border,
          }
        ]}>
          <View style={styles.selectionHeader}>
            <Text style={[styles.selectionTitle, { color: colors.textPrimary }]}>
              {message.selectedListingIds.length} inmuebles usados en la siguiente búsqueda
            </Text>
            <Text style={[styles.selectionSubtitle, { color: colors.textSecondary }]}>
              Esta selección ya fue aplicada
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '85%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
  },
  text: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  voiceButton: {
    marginTop: spacing.sm,
    padding: spacing.xs,
  },
  listingsContainer: {
    marginTop: spacing.md,
  },
  listingsContent: {
    paddingRight: spacing.md,
  },
  selectionPanel: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderTopWidth: 1,
  },
  selectionHeader: {
    gap: spacing.xs,
  },
  selectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  selectionSubtitle: {
    fontSize: typography.fontSize.sm,
  },
});
