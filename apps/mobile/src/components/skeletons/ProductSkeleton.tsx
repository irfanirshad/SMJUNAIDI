import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Skeleton from './Skeleton';
import colors from '../../constants/colors';

const { width } = Dimensions.get('window');
const productWidth = (width - 45) / 2; // 15px padding on each side + 15px between items

interface ProductSkeletonProps {
  count?: number;
  variant?: 'grid' | 'list';
}

const ProductSkeleton: React.FC<ProductSkeletonProps> = ({
  count = 1,
  variant = 'grid',
}) => {
  if (variant === 'list') {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <View key={`list-skeleton-${index}`} style={styles.listContainer}>
            {/* Product Image */}
            <Skeleton
              width={100}
              height={100}
              borderRadius={8}
              style={styles.listImageSkeleton}
            />

            <View style={styles.listInfo}>
              {/* Product Name */}
              <Skeleton
                width="90%"
                height={16}
                borderRadius={4}
                style={styles.listTitleSkeleton}
              />

              {/* Brand */}
              <Skeleton
                width="60%"
                height={13}
                borderRadius={4}
                style={styles.listBrandSkeleton}
              />

              {/* Price and Stock */}
              <View style={styles.listFooter}>
                <Skeleton width={80} height={16} borderRadius={4} />
                <Skeleton width={60} height={20} borderRadius={4} />
              </View>
            </View>
          </View>
        ))}
      </>
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View key={`grid-skeleton-${index}`} style={styles.container}>
          {/* Product Image */}
          <Skeleton
            width={productWidth - 20}
            height={150}
            borderRadius={8}
            style={styles.imageSkeleton}
          />

          {/* Product Name */}
          <Skeleton
            width="90%"
            height={16}
            borderRadius={4}
            style={styles.titleSkeleton}
          />

          {/* Product Price */}
          <Skeleton
            width="60%"
            height={14}
            borderRadius={4}
            style={styles.priceSkeleton}
          />

          {/* Add to Cart Button */}
          <Skeleton
            width="100%"
            height={36}
            borderRadius={6}
            style={styles.buttonSkeleton}
          />
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: productWidth,
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  imageSkeleton: {
    marginBottom: 10,
  },
  titleSkeleton: {
    marginBottom: 8,
  },
  priceSkeleton: {
    marginBottom: 10,
  },
  buttonSkeleton: {
    marginTop: 5,
  },
  // List variant styles
  listContainer: {
    flexDirection: 'row',
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listImageSkeleton: {
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listTitleSkeleton: {
    marginBottom: 4,
  },
  listBrandSkeleton: {
    marginBottom: 8,
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default ProductSkeleton;
