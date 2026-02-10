/**
 * Format price to INR currency format using the shared currency symbol.
 * @param price - The price amount to format
 * @returns Formatted price string (e.g., "₹123.45")
 */
import { CURRENCY_SYMBOL } from '../config/environment';

export const formatPrice = (price: number | undefined): string => {
  if (price === undefined || price === null || isNaN(price)) {
    return `${CURRENCY_SYMBOL}0.00`;
  }

  return `${CURRENCY_SYMBOL}${price.toFixed(2)}`;
};

/**
 * Format price range for products with discounts
 * @param originalPrice - The original price
 * @param discountPrice - The discounted price (optional)
 * @returns Object with formatted prices
 */
export const formatPriceWithDiscount = (
  originalPrice: number,
  discountPrice?: number,
) => {
  return {
    original: formatPrice(originalPrice),
    discount: discountPrice ? formatPrice(discountPrice) : null,
    hasDiscount: !!discountPrice && discountPrice < originalPrice,
  };
};

/**
 * Calculate discount percentage
 * @param originalPrice - The original price
 * @param discountPrice - The discounted price
 * @returns Discount percentage as number
 */
export const calculateDiscountPercentage = (
  originalPrice: number,
  discountPrice: number,
): number => {
  if (!originalPrice || !discountPrice || discountPrice >= originalPrice) {
    return 0;
  }
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
};
