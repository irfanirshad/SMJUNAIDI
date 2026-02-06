import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  DimensionValue,
} from 'react-native';

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[{ width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.skeleton,
          {
            width: '100%',
            height: '100%',
            borderRadius,
            opacity,
          },
        ]}
      />
    </View>
  );
};

// Preset skeleton components
export const SkeletonCard: React.FC = () => (
  <View style={styles.card}>
    <SkeletonLoader width="100%" height={200} borderRadius={12} />
    <View style={styles.cardContent}>
      <SkeletonLoader width="70%" height={20} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="50%" height={16} style={{ marginBottom: 12 }} />
      <View style={styles.cardFooter}>
        <SkeletonLoader width={80} height={24} borderRadius={6} />
        <SkeletonLoader width={100} height={36} borderRadius={8} />
      </View>
    </View>
  </View>
);

export const SkeletonStatCard: React.FC = () => (
  <View style={styles.statCard}>
    <SkeletonLoader
      width={40}
      height={40}
      borderRadius={20}
      style={{ marginBottom: 12 }}
    />
    <SkeletonLoader width="80%" height={24} style={{ marginBottom: 8 }} />
    <SkeletonLoader width="60%" height={16} />
  </View>
);

export const SkeletonListItem: React.FC = () => (
  <View style={styles.listItem}>
    <SkeletonLoader width={60} height={60} borderRadius={30} />
    <View style={styles.listItemContent}>
      <SkeletonLoader width="70%" height={18} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="50%" height={14} />
    </View>
  </View>
);

export const SkeletonDashboard: React.FC = () => (
  <View style={styles.dashboard}>
    {/* Stats Grid */}
    <View style={styles.statsGrid}>
      <SkeletonStatCard />
      <SkeletonStatCard />
      <SkeletonStatCard />
      <SkeletonStatCard />
    </View>

    {/* Quick Actions */}
    <View style={styles.section}>
      <SkeletonLoader width={150} height={24} style={{ marginBottom: 16 }} />
      <View style={styles.actionsList}>
        {[1, 2, 3, 4, 5, 6].map(item => (
          <View key={item} style={styles.actionItem}>
            <SkeletonLoader width={40} height={40} borderRadius={20} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <SkeletonLoader
                width="60%"
                height={18}
                style={{ marginBottom: 6 }}
              />
              <SkeletonLoader width="40%" height={14} />
            </View>
            <SkeletonLoader width={24} height={24} borderRadius={12} />
          </View>
        ))}
      </View>
    </View>

    {/* Recent Orders */}
    <View style={styles.section}>
      <SkeletonLoader width={150} height={24} style={{ marginBottom: 16 }} />
      <SkeletonListItem />
      <SkeletonListItem />
      <SkeletonListItem />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardContent: {
    padding: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  listItemContent: {
    flex: 1,
    marginLeft: 16,
  },
  dashboard: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  actionsList: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});

export default SkeletonLoader;
