import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function PropertyCardSkeleton() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Skeleton width="100%" height={200} borderRadius={12} />
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={20} style={{ marginBottom: 8 }} />
        <Skeleton width="50%" height={16} style={{ marginBottom: 12 }} />
        <View style={styles.row}>
          <Skeleton width={60} height={14} style={{ marginRight: 8 }} />
          <Skeleton width={60} height={14} style={{ marginRight: 8 }} />
          <Skeleton width={60} height={14} />
        </View>
      </View>
    </View>
  );
}

export function SearchHistoryItemSkeleton() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={[styles.historyItem, { backgroundColor: colors.surface }]}>
      <View style={styles.historyContent}>
        <Skeleton width="80%" height={18} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
        <View style={styles.row}>
          <Skeleton width={80} height={12} style={{ marginRight: 12 }} />
          <Skeleton width={100} height={12} />
        </View>
      </View>
      <Skeleton width={24} height={24} borderRadius={12} />
    </View>
  );
}

export function AppointmentCardSkeleton() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={[styles.appointmentCard, { backgroundColor: colors.surface }]}>
      <Skeleton width={60} height={60} borderRadius={12} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Skeleton width="90%" height={18} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={14} style={{ marginBottom: 8 }} />
        <View style={styles.row}>
          <Skeleton width={80} height={12} style={{ marginRight: 12 }} />
          <Skeleton width={60} height={12} />
        </View>
      </View>
    </View>
  );
}

export function SavedSearchItemSkeleton() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={[styles.savedSearchItem, { backgroundColor: colors.surface }]}>
      <View style={{ flex: 1 }}>
        <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
        <Skeleton width="90%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="50%" height={12} />
      </View>
      <View style={styles.savedSearchActions}>
        <Skeleton width={32} height={32} borderRadius={16} style={{ marginBottom: 8 }} />
        <Skeleton width={32} height={32} borderRadius={16} />
      </View>
    </View>
  );
}

export function RecentlyViewedItemSkeleton() {
  return <PropertyCardSkeleton />;
}

const styles = StyleSheet.create({
  skeleton: {},
  card: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  historyContent: {
    flex: 1,
    marginRight: 12,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  savedSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  savedSearchActions: {
    alignItems: 'center',
    marginLeft: 12,
  },
});
