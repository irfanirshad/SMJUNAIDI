"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Loader2 } from "lucide-react";
import { Product } from "@babyshop/types";
import WishlistButton from "@/components/common/products/WishlistButton";
import { toast } from "sonner";
import { useCartStore, useUserStore } from "@/lib/store";
import { useRouter } from "next/navigation";

interface ProductActionsProps {
  product: Product;
}

const ProductActions: React.FC<ProductActionsProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [localLoading, setLocalLoading] = useState(false);
  const { addToCart } = useCartStore(); // Remove isLoading from here
  const { isAuthenticated } = useUserStore();
  const router = useRouter();

  const handleQuantityChange = (type: "increase" | "decrease") => {
    if (type === "increase") {
      setQuantity((prev) => prev + 1);
    } else {
      setQuantity((prev) => Math.max(1, prev - 1));
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to cart");
      router.push("/auth/signin");
      return;
    }

    setLocalLoading(true);
    try {
      await addToCart(product, quantity);
      toast.success("Added to cart successfully!");
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Failed to add to cart. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  };

  const isButtonLoading = localLoading; // Only use localLoading

  return (
    <>
      {/* Product name with wishlist button */}
      <div className="flex items-center justify-between gap-5">
        <h1 className="text-2xl font-bold line-clamp-1">{product?.name}</h1>
        <div className="flex items-center gap-2">
          <WishlistButton
            product={product}
            className="border border-babyshopTextLight hover:border-babyshopSky"
          />
        </div>
      </div>

      {/* Quantity and Add to Cart */}
      <div>
        <p className="mb-2">Quantity</p>
        <div className="flex items-center gap-5">
          <div className="border flex items-center gap-6 px-5 py-2 rounded-full">
            <button
              onClick={() => handleQuantityChange("decrease")}
              className="border-0 bg-transparent text-babyshopBlack hover:text-babyshopSky hoverEffect"
              disabled={isButtonLoading}
            >
              <Minus size={18} />
            </button>
            <span>{quantity}</span>
            <button
              onClick={() => handleQuantityChange("increase")}
              className="border-0 bg-transparent text-babyshopBlack hover:text-babyshopSky hoverEffect"
              disabled={isButtonLoading}
            >
              <Plus size={18} />
            </button>
          </div>
          <Button
            onClick={handleAddToCart}
            variant="outline"
            disabled={isButtonLoading}
            className="flex-1 py-5 border-babyshopTextLight hover:border-babyshopSky hover:bg-babyshopSky hover:text-babyshopWhite text-base font-medium"
          >
            {isButtonLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              "Add to cart"
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default ProductActions;
