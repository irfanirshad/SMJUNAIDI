import { fetchData } from "../../../lib/api";
import { Product } from "@babyshop/types";
import React from "react";
import ProductList from "../../common/products/ProductList";

interface ProductsResponse {
  products: Product[];
}

interface TrendingProductsProps {
  title?: string;
  description?: string;
}

const TrendingProducts = async ({
  title = "Trending Products",
  description = "Check out what's hot right now!",
}: TrendingProductsProps = {}) => {
  let products: Product[] = [];

  try {
    const data = await fetchData<ProductsResponse>(
      "/products?productType=trending&perPage=10"
    );
    products = data.products || [];

    // Fallback: If no trending products found, fetch regular products
    if (products.length === 0) {
      const fallbackData = await fetchData<ProductsResponse>(
        "/products?perPage=10&page=1"
      );
      products = fallbackData.products || [];
    }
  } catch (error) {
    console.error("Error fetching trending products:", error);
  }

  // Only return null if absolutely no products are available
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-babyshopWhite border mt-3 rounded-md">
      <div className="p-5 border-b">
        <h2 className="text-2xl font-bold text-gray-800">🔥 {title}</h2>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      <ProductList products={products} />
    </div>
  );
};

export default TrendingProducts;
