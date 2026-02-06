import { fetchData } from "../../../lib/api";
import { Product } from "@babyshop/types";
import React from "react";
import ProductList from "../../common/products/ProductList";

interface ProductsResponse {
  products: Product[];
}

interface FeaturedProductsProps {
  title?: string;
  description?: string;
  productFilter?: {
    tags?: string[];
  };
  categoryIds?: string[];
  brandIds?: string[];
}

const FeaturedProducts = async ({
  title = "Featured Products",
  description = "Handpicked favorites just for you!",
  productFilter,
  categoryIds,
  brandIds,
}: FeaturedProductsProps = {}) => {
  let products: Product[] = [];

  try {
    // Build query parameters based on filters
    const params = new URLSearchParams();
    params.append("productType", "featured");
    params.append("perPage", "10");

    if (productFilter?.tags && productFilter.tags.length > 0) {
      params.append("tags", productFilter.tags.join(","));
    }

    if (categoryIds && categoryIds.length > 0) {
      params.append("categories", categoryIds.join(","));
    }

    if (brandIds && brandIds.length > 0) {
      params.append("brands", brandIds.join(","));
    }

    const data = await fetchData<ProductsResponse>(
      `/products?${params.toString()}`
    );
    products = data.products || [];

    // Fallback: If no featured products found, fetch regular products
    if (products.length === 0) {
      const fallbackParams = new URLSearchParams();
      fallbackParams.append("perPage", "10");
      fallbackParams.append("page", "1");

      if (categoryIds && categoryIds.length > 0) {
        fallbackParams.append("categories", categoryIds.join(","));
      }

      if (brandIds && brandIds.length > 0) {
        fallbackParams.append("brands", brandIds.join(","));
      }

      const fallbackData = await fetchData<ProductsResponse>(
        `/products?${fallbackParams.toString()}`
      );
      products = fallbackData.products || [];
    }
  } catch (error) {
    console.error("Error fetching featured products:", error);
  }

  // Only return null if absolutely no products are available
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-babyshopWhite border mt-3 rounded-md">
      <div className="p-5 border-b">
        <h2 className="text-2xl font-bold text-gray-800">⭐ {title}</h2>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      <ProductList products={products} />
    </div>
  );
};

export default FeaturedProducts;
