import { fetchData } from "../../../lib/api";
import { Product } from "@babyshop/types";
import React from "react";
import ProductTypeCarousel from "./ProductTypeCarousel";
import Link from "next/link";

interface ProductsResponse {
  products: Product[];
}

interface ProductType {
  _id: string;
  name: string;
  type: string;
  displayOrder: number;
  color?: string;
}

interface ProductTypeSectionProps {
  productType: ProductType;
}

const ProductTypeSection = async ({ productType }: ProductTypeSectionProps) => {
  let products: Product[] = [];

  try {
    const data = await fetchData<ProductsResponse>(
      `/products?productType=${productType._id}&perPage=20`
    );
    products = data.products || [];
  } catch (error) {
    console.error(`Error fetching products for ${productType.name}:`, error);
  }

  // Don't render if no products
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-full bg-babyshopWhite border mt-3 rounded-md overflow-hidden">
      <div className="p-5 border-b flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {productType.name}
          </h2>
        </div>
        <Link
          href={`/products?type=${productType._id}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          View All →
        </Link>
      </div>
      <div className="w-full overflow-hidden">
        <ProductTypeCarousel products={products} />
      </div>
    </div>
  );
};

export default ProductTypeSection;
