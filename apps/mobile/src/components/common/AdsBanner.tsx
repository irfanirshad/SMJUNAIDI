import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { adsBannerAPI } from '../../services/api';
import colors from '../../constants/colors';

const { width } = Dimensions.get('window');

interface AdsBannerType {
  _id: string;
  name: string;
  title: string;
  image: string;
}

const AdsBanner: React.FC = () => {
  const [adsBanners, setAdsBanners] = useState<AdsBannerType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchAdsBanners = async () => {
      try {
        const data = await adsBannerAPI.getAdsBanners();
        setAdsBanners(data?.adsBanners || []);
      } catch (error) {
        console.error('Error fetching ads banners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdsBanners();
  }, []);

  useEffect(() => {
    if (adsBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % adsBanners.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [adsBanners.length]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonBanner} />
      </View>
    );
  }

  if (adsBanners.length === 0) {
    return null;
  }

  const renderItem = ({ item }: { item: AdsBannerType }) => (
    <TouchableOpacity style={styles.bannerItem} activeOpacity={0.9}>
      <Image source={{ uri: item.image }} style={styles.bannerImage} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={adsBanners}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={event => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
      {adsBanners.length > 1 && (
        <View style={styles.pagination}>
          {adsBanners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                currentIndex === index && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.babyWhite,
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bannerItem: {
    width: width,
  },
  bannerImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lightGray,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: colors.babyshopSky,
  },
  skeletonBanner: {
    width: '100%',
    height: 180,
    backgroundColor: colors.lightGray,
  },
});

export default AdsBanner;
