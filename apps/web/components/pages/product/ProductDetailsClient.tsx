"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@babyshop/types";
import PriceFormatter from "@/components/common/PriceFormatter";
import { Button } from "@/components/ui/button";
import {
  Star,
  Eye,
  FileQuestion,
  Share2,
  Package,
  Tag,
  Check,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Link as LinkIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trackProductView } from "@/lib/productApi";
import { useCartStore } from "@/lib/store";

interface ProductDetailsClientProps {
  product: Product;
  discountedPrice: number;
}

const ProductDetailsClient: React.FC<ProductDetailsClientProps> = ({
  product,
  discountedPrice,
}) => {
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewCount, setViewCount] = useState(product.viewCount || 0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCartStore();

  // Track product view on component mount
  useEffect(() => {
    const trackView = async () => {
      try {
        const result = await trackProductView(product._id);
        if (result && typeof result === "object" && "viewCount" in result) {
          setViewCount(result.viewCount as number);
        }
      } catch (error) {
        // Silently fail - view tracking is not critical
        console.warn("Failed to track product view:", error);
      }
    };

    trackView();
  }, [product._id]);

  const handleAskQuestion = () => {
    router.push("/help");
  };

  const handleBuyNow = async () => {
    setIsAddingToCart(true);
    try {
      await addToCart(product, 1);
      // Store the product ID for Buy Now flow - only this item should be selected
      sessionStorage.setItem("buyNowProductId", product._id);
      toast.success("Product added to cart!");
      router.push("/user/cart");
    } catch (error) {
      console.error("Failed to add product to cart:", error);
      toast.error("Failed to add product to cart. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const productUrl = typeof window !== "undefined" ? window.location.href : "";

  const shareText = `Check out ${product.name} - ${product.description?.substring(0, 100)}...`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`,
    instagram: `https://www.instagram.com/`, // Instagram doesn't support direct sharing URLs
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    if (platform === "instagram") {
      toast.info(
        "Instagram doesn't support direct sharing. Link copied to clipboard!"
      );
      handleCopyLink();
    } else {
      window.open(shareLinks[platform], "_blank", "width=600,height=400");
      setShareOpen(false);
    }
  };

  return (
    <>
      {/* Price and Rating */}
      <div className="flex items-start gap-5 justify-between border-y border-babyshopTextLight/30 py-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            {product?.discountPercentage && product.discountPercentage > 0 ? (
              <>
                <PriceFormatter
                  amount={product.price}
                  className="text-babyshopTextLight line-through font-medium text-lg"
                />
                <PriceFormatter
                  amount={discountedPrice}
                  className="text-babyshopRed text-3xl font-bold"
                />
              </>
            ) : (
              <PriceFormatter
                amount={product?.price}
                className="text-babyshopBlack text-3xl font-bold"
              />
            )}
          </div>
          <p className="text-sm text-babyshopTextLight">
            {product?.stock !== undefined && product.stock > 0
              ? `${product.stock} items in stock`
              : "Out of stock"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => {
              const rating = product?.averageRating || product?.rating || 0;
              const isFilled = i < Math.floor(rating);
              const isHalfFilled =
                i === Math.floor(rating) && rating % 1 >= 0.5;

              return (
                <Star
                  key={i}
                  size={16}
                  className={
                    isFilled
                      ? "fill-babyshopSky text-babyshopSky"
                      : isHalfFilled
                        ? "fill-babyshopSky/50 text-babyshopSky"
                        : "text-gray-300"
                  }
                  fill={isFilled || isHalfFilled ? "currentColor" : "none"}
                />
              );
            })}
            <span className="text-sm font-medium text-babyshopBlack ml-1">
              {(product?.averageRating || product?.rating || 0).toFixed(1)}
            </span>
          </div>
          <p className="text-sm text-babyshopTextLight">
            ({product?.numReviews || 0}{" "}
            {product?.numReviews === 1 ? "review" : "reviews"})
          </p>
        </div>
      </div>

      {/* Product Description Preview */}
      <div className="bg-babyshopLightBg/50 rounded-lg p-4 border border-babyshopTextLight/20">
        <h3 className="text-sm font-semibold text-babyshopBlack mb-2">
          About This Product
        </h3>
        <p className="text-sm text-babyshopBlack/70 leading-relaxed line-clamp-4">
          {product?.description || "No description available for this product."}
        </p>
      </div>

      {/* Product Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        {product?.category && (
          <div className="flex items-start gap-2 p-3 bg-babyshopLightBg rounded-lg border border-babyshopTextLight/10">
            <Package className="text-babyshopSky mt-0.5 shrink-0" size={18} />
            <div className="min-w-0">
              <p className="text-xs text-babyshopTextLight">Category</p>
              <p className="font-medium text-babyshopBlack text-sm truncate">
                {product.category.name}
              </p>
            </div>
          </div>
        )}
        {product?.brand && (
          <div className="flex items-start gap-2 p-3 bg-babyshopLightBg rounded-lg border border-babyshopTextLight/10">
            <Tag className="text-babyshopSky mt-0.5 shrink-0" size={18} />
            <div className="min-w-0">
              <p className="text-xs text-babyshopTextLight">Brand</p>
              <p className="font-medium text-babyshopBlack text-sm truncate">
                {typeof product.brand === "object"
                  ? product.brand.name
                  : product.brand}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* User View Counter */}
      <div className="flex items-center gap-2 p-3 bg-babyshopSky/5 border border-babyshopSky/20 rounded-lg">
        <Eye className="text-babyshopSky shrink-0" size={18} />
        <p className="text-sm">
          <span className="font-semibold text-babyshopBlack">{viewCount}</span>{" "}
          <span className="text-babyshopTextLight">
            {viewCount === 1 ? "person has viewed" : "people have viewed"} this
            product
          </span>
        </p>
      </div>

      {/* Buy Now Button */}
      <Button
        onClick={handleBuyNow}
        disabled={isAddingToCart || !product.stock || product.stock === 0}
        className="py-6 text-base font-medium bg-babyshopSky hover:bg-babyshopSky/90 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAddingToCart ? "Adding to Cart..." : "Buy Now"}
      </Button>

      {/* Action Links */}
      <div className="flex items-center gap-4 justify-between p-4 bg-babyshopLightBg/50 rounded-lg border border-babyshopTextLight/20">
        <button
          onClick={handleAskQuestion}
          className="flex items-center gap-2 text-babyshopBlack/70 hover:text-babyshopSky transition-colors flex-1 justify-center py-2 px-3 hover:bg-babyshopWhite rounded-lg"
        >
          <FileQuestion size={18} />
          <span className="text-sm font-medium">Ask Question</span>
        </button>
        <div className="w-px h-6 bg-babyshopTextLight/30" />
        <Popover open={shareOpen} onOpenChange={setShareOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 text-babyshopBlack/70 hover:text-babyshopSky transition-colors flex-1 justify-center py-2 px-3 hover:bg-babyshopWhite rounded-lg">
              <Share2 size={18} />
              <span className="text-sm font-medium">Share</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="end">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-babyshopBlack mb-3">
                Share this product
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleShare("facebook")}
                  className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                >
                  <Facebook size={18} />
                  <span className="text-sm font-medium">Facebook</span>
                </button>
                <button
                  onClick={() => handleShare("twitter")}
                  className="flex items-center gap-2 p-3 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg transition-colors"
                >
                  <Twitter size={18} />
                  <span className="text-sm font-medium">Twitter</span>
                </button>
                <button
                  onClick={() => handleShare("linkedin")}
                  className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                >
                  <Linkedin size={18} />
                  <span className="text-sm font-medium">LinkedIn</span>
                </button>
                <button
                  onClick={() => handleShare("instagram")}
                  className="flex items-center gap-2 p-3 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg transition-colors"
                >
                  <Instagram size={18} />
                  <span className="text-sm font-medium">Instagram</span>
                </button>
              </div>
              <div className="pt-2 border-t border-babyshopTextLight/20">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 p-3 bg-babyshopLightBg hover:bg-babyshopTextLight/20 text-babyshopBlack rounded-lg transition-colors w-full"
                >
                  {copied ? (
                    <>
                      <Check size={18} className="text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        Link Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <LinkIcon size={18} />
                      <span className="text-sm font-medium">Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
};

export default ProductDetailsClient;
