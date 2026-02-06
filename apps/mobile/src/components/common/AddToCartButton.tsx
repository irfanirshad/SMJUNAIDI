import { StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import { Product } from '../../../types';
import colors from '../../constants/colors';
import { ShoppingBag01Icon, Loading01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../context/ToastContext';

interface AddToCartButtonProps {
  product: Product;
  customStyle?: object;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  customStyle,
}) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleAddToCart = async () => {
    // Check if user is authenticated
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please sign in to add items to your cart',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () => (navigation as any).navigate('Login'),
          },
        ],
      );
      return;
    }

    // Check stock availability
    if (product.stock === 0) {
      showToast('This product is currently out of stock', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Add to cart with the full product object
      await addToCart(product, 1);

      // Show success feedback
      showToast(`${product.name} added to cart!`, 'success');
    } catch (error) {
      console.error('Add to cart error:', error);

      // Extract meaningful error message
      let errorMessage = 'Failed to add to cart. Please try again.';
      if (error instanceof Error) {
        // Check if it's a stock availability error
        if (error.message.includes('available in stock')) {
          errorMessage = error.message;
        } else if (error.message.includes('stock')) {
          errorMessage = error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.addToCartBtn,
        customStyle,
        (product.stock === 0 || isLoading) && styles.disabledBtn,
      ]}
      onPress={e => {
        e.stopPropagation();
        handleAddToCart();
      }}
      disabled={product.stock === 0 || isLoading}
    >
      {isLoading ? (
        <>
          <HugeiconsIcon
            icon={Loading01Icon}
            size={18}
            color={colors.babyshopSky}
            strokeWidth={2.5}
          />
          <Text style={styles.addToCartText}>Adding...</Text>
        </>
      ) : (
        <>
          <HugeiconsIcon
            icon={ShoppingBag01Icon}
            size={18}
            color={product.stock === 0 ? colors.mutedText : colors.babyshopSky}
            strokeWidth={2.5}
          />
          <Text
            style={[
              styles.addToCartText,
              product.stock === 0 && styles.disabledText,
            ]}
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default AddToCartButton;

const styles = StyleSheet.create({
  addToCartBtn: {
    borderRadius: 50,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.babyshopSky,
  },
  addToCartText: {
    color: colors.babyshopSky,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  disabledBtn: {
    backgroundColor: colors.mediumGray,
    borderColor: colors.mediumGray,
    opacity: 0.6,
  },
  disabledText: {
    color: colors.mutedText,
  },
});
