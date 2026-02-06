import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { HomeScreenNavigationProp } from '../../../types';
import colors from '../../constants/colors';
import { bannerAPI } from '../../services/api';

const { width } = Dimensions.get('window');

interface BannerType {
  _id: string;
  name: string;
  title: string;
  startFrom?: number;
  image: string;
  bannerType: string;
}

interface BannerProps {
  navigation: HomeScreenNavigationProp;
}

const Banner: React.FC<BannerProps> = ({ navigation }) => {
  const [banners, setBanners] = useState<BannerType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await bannerAPI.getBanners();
        setBanners(data);
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonOverlay}>
            <View style={styles.skeletonContent}>
              <View style={styles.skeletonSubtitle} />
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonButton} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  const mainBanner = banners[0];

  return (
    <View style={styles.container}>
      <View style={styles.bannerCard}>
        <Image source={{ uri: mainBanner.image }} style={styles.bannerImage} />
        <View style={styles.overlay}>
          <View style={styles.contentContainer}>
            {mainBanner.name && (
              <Text style={styles.subtitle}>{mainBanner.name}</Text>
            )}
            {mainBanner.title && (
              <Text style={styles.title}>{mainBanner.title}</Text>
            )}
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate('ProductList', {})}
              activeOpacity={0.8}
            >
              <Text style={styles.shopButtonText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.babyWhite,
  },
  loadingContainer: {
    height: 200,
    backgroundColor: colors.babyWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerCard: {
    width: width,
    height: 200,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.babyWhite,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.babyWhite,
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'capitalize',
    maxWidth: '80%',
  },
  shopButton: {
    backgroundColor: colors.babyWhite,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.babyshopBlack,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skeletonCard: {
    width: width,
    height: 200,
    position: 'relative',
    backgroundColor: colors.lightGray,
  },
  skeletonImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.lightGray,
  },
  skeletonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  skeletonSubtitle: {
    width: 80,
    height: 12,
    backgroundColor: colors.babyWhite + '40',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonTitle: {
    width: 200,
    height: 24,
    backgroundColor: colors.babyWhite + '40',
    borderRadius: 4,
    marginBottom: 20,
  },
  skeletonButton: {
    width: 120,
    height: 40,
    backgroundColor: colors.babyWhite + '40',
    borderRadius: 25,
  },
});

export default Banner;
