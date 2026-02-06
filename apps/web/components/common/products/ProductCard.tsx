import { Product } from "@babyshop/types";
import Image from "next/image";
import React, { memo } from "react";
import PriceContainer from "../PriceContainer";
import Link from "next/link";
import DiscountBadge from "../DiscountBadge";
import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";
import { getProductUrl } from "@/lib/productHelpers";

const ProductCard = ({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) => {
  return (
    <div
      className={`border rounded-md group overflow-hidden w-full relative ${className}`}
    >
      <Link
        href={getProductUrl(product)}
        className="p-2 overflow-hidden relative block"
      >
        <Image
          src={product?.images?.[0] || product?.image}
          width={500}
          height={500}
          alt="productIamge"
          className="w-full h-36 object-cover group-hover:scale-110 hoverEffect"
        />
        <DiscountBadge
          discountPercentage={product?.discountPercentage}
          className="absolute top-4 left-2"
        />
      </Link>

      {/* Wishlist Button */}
      <div className="absolute top-2 right-2 z-10">
        <WishlistButton product={product} className="bg-white shadow-sm" />
      </div>

      <hr />
      <div className="px-4 py-2 space-y-1">
        <p className="uppercase text-xs font-medium text-babyshopTextLight">
          {product?.category?.name}
        </p>
        <p className="line-clamp-2 text-sm h-10">{product?.name}</p>
        <PriceContainer
          price={product?.price}
          discountPercentage={product?.discountPercentage}
        />
        {product?.stock !== undefined && (
          <p className="text-xs text-gray-500">
            {product.stock > 0 ? (
              <span className="text-shadow-babyshopBlack/60">
                In Stock:{" "}
                <span className="text-babyshopSky font-medium">
                  {product.stock}
                </span>
              </span>
            ) : (
              <span className="text-red-600">Out of Stock</span>
            )}
          </p>
        )}
        <AddToCartButton product={product} />
      </div>
    </div>
  );
};

export default memo(ProductCard);
