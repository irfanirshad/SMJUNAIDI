import { fetchData } from "../../../lib/api";
import { Product } from "@babyshop/types";
import React from "react";
import ProductList from "../../common/products/ProductList";
import Link from "next/link";

interface ProductsResponse {
  products: Product[];
}

interface AllProductsSectionProps {
  title?: string;
  description?: string;
}

const AllProductsSection = async ({
  title = "All Products",
  description = "Explore our complete collection",
}: AllProductsSectionProps = {}) => {
  let products: Product[] = [];

  try {
    const data = await fetchData<ProductsResponse>(
      "/products?perPage=20&page=1"
    );
    products = data.products || [];
  } catch (error) {
    console.error("Error fetching all products:", error);
  }

  // Only return null if absolutely no products are available
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-babyshopWhite border mt-3 rounded-md">
      <div className="p-5 border-b flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🛍️ {title}</h2>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        <Link
          href="/products"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          View All →
        </Link>
      </div>
      <ProductList products={products} />
    </div>
  );
};

export default AllProductsSection;
