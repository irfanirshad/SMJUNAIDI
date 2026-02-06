import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';
import colors from '../../constants/colors';

const CategorySkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <Skeleton width={80} height={80} borderRadius={8} />
      <Skeleton
        width={60}
        height={14}
        borderRadius={4}
        style={styles.titleSkeleton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: colors.babyWhite,
  },
  titleSkeleton: {
    marginTop: 8,
  },
});

export default CategorySkeleton;
