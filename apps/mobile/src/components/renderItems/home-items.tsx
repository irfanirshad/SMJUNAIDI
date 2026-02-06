import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HomeScreenNavigationProp } from '../../../types';
import SmartImage from '../SmartImage';
import colors from '../../constants/colors';

interface Props {
  _id: string;
  name: string;
  image?: string;
  navigation: HomeScreenNavigationProp;
}

const HomeCategoryRender = ({ _id, name, image, navigation }: Props) => {
  return (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() =>
        navigation.navigate('ProductList', {
          categoryId: _id,
          categoryName: name,
        })
      }
      activeOpacity={0.7}
    >
      {image && (
        <View style={styles.imageView}>
          <SmartImage
            source={{ uri: image }}
            style={styles.categoryImage}
            fallbackColor="#f0f0f0"
          />
        </View>
      )}
      <Text style={styles.categoryName} numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryCard: {
    alignItems: 'center',
    marginRight: 15,
    width: 80,
    paddingVertical: 5,
  },
  imageView: {
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 8,
    overflow: 'hidden',
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.babyWhite,
    // shadowColor: colors.shadowColor,
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.lightGray,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primaryText,
    textAlign: 'center',
  },
});

export { HomeCategoryRender };
export { HomeProductRender } from './home-product';
