import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  FlatList,
  ViewToken,
} from 'react-native';
import { getColors, spacing, typography, borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Mic, Search, Heart, Calendar, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const slides: OnboardingSlide[] = [
    {
      id: '1',
      title: 'Busca con tu voz',
      description: 'Habla naturalmente para buscar propiedades. Di lo que buscas y nuestra IA te entenderá.',
      icon: <Mic size={80} color={colors.primary} />,
      color: colors.primaryLight,
    },
    {
      id: '2',
      title: 'Encuentra tu hogar',
      description: 'Usa filtros avanzados o describe lo que necesitas. Busca por ubicación, precio, habitaciones y más.',
      icon: <Search size={80} color={colors.accent} />,
      color: colors.accentLight,
    },
    {
      id: '3',
      title: 'Guarda favoritos',
      description: 'Marca tus propiedades favoritas y compáralas fácilmente. Accede a ellas en cualquier momento.',
      icon: <Heart size={80} color={colors.error} />,
      color: '#EF4444',
    },
    {
      id: '4',
      title: 'Agenda citas',
      description: 'Programa visitas a propiedades directamente desde la app. Gestiona todas tus citas en un solo lugar.',
      icon: <Calendar size={80} color={colors.info} />,
      color: colors.info,
    },
  ];

  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onComplete();
    }
  };

  const renderItem = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
        {item.icon}
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <X size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      <FlatList
        ref={slidesRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity style={[styles.nextButton, { backgroundColor: colors.primary }]} onPress={scrollTo}>
          <Text style={[styles.nextButtonText, { color: colors.surface }]}>
            {currentIndex === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.sm,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    height: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
});
