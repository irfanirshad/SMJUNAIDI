import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Skeleton from './Skeleton';
import colors from '../../constants/colors';

const { width } = Dimensions.get('window');

const SingleProductSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Product Image */}
      <Skeleton
        width={width - 40}
        height={300}
        borderRadius={12}
        style={styles.imageSkeleton}
      />

      {/* Product Name */}
      <Skeleton
        width="90%"
        height={24}
        borderRadius={6}
        style={styles.titleSkeleton}
      />

      {/* Product Price */}
      <Skeleton
        width="40%"
        height={20}
        borderRadius={5}
        style={styles.priceSkeleton}
      />

      {/* Product Description Lines */}
      <View style={styles.descriptionContainer}>
        <Skeleton
          width="100%"
          height={16}
          borderRadius={4}
          style={styles.descriptionLine}
        />
        <Skeleton
          width="85%"
          height={16}
          borderRadius={4}
          style={styles.descriptionLine}
        />
        <Skeleton
          width="92%"
          height={16}
          borderRadius={4}
          style={styles.descriptionLine}
        />
        <Skeleton
          width="78%"
          height={16}
          borderRadius={4}
          style={styles.descriptionLine}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <Skeleton width="48%" height={50} borderRadius={8} />
        <Skeleton width="48%" height={50} borderRadius={8} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.babyWhite,
  },
  imageSkeleton: {
    marginBottom: 20,
    alignSelf: 'center',
  },
  titleSkeleton: {
    marginBottom: 15,
  },
  priceSkeleton: {
    marginBottom: 20,
  },
  descriptionContainer: {
    marginBottom: 30,
  },
  descriptionLine: {
    marginBottom: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});

export default SingleProductSkeleton;
