/**
 * Format price to USD currency format
 * @param price - The price amount to format
 * @param currency - The currency code (default: 'USD')
 * @returns Formatted price string (e.g., "$123.45")
 */
export const formatPrice = (
  price: number | undefined,
  currency: string = 'USD',
): string => {
  if (price === undefined || price === null || isNaN(price)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
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
