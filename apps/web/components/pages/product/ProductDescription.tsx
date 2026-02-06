"use client";
import React, { useState } from "react";
import { Product } from "@babyshop/types";
import { Package, Tag, Star, ChevronLeft, ChevronRight } from "lucide-react";
import ReviewForm from "./ReviewForm";
import { Button } from "@/components/ui/button";

interface ProductDescriptionProps {
  product?: Product;
  onReviewSubmitted?: () => void;
}

const ProductDescription = ({
  product,
  onReviewSubmitted,
}: ProductDescriptionProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const reviewsPerPage = 10;

  const brandName = product?.brand
    ? typeof product.brand === "object"
      ? product.brand.name
      : product.brand
    : null;

  // Get approved reviews
  const approvedReviews = product?.reviews?.filter((r) => r.isApproved) || [];
  const totalReviews = approvedReviews.length;

  // Handler for when review is submitted
  const handleReviewSubmitted = () => {
    setCurrentPage(1); // Reset to first page
    setShowReviewForm(false); // Close form
    onReviewSubmitted?.(); // Call parent callback
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalReviews / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;

  // Get sorted reviews and then paginate
  const sortedReviews = [...approvedReviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const displayedReviews = sortedReviews.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Calculate rating statistics
  const ratingCounts = [0, 0, 0, 0, 0]; // Index 0 = 1 star, Index 4 = 5 stars
  approvedReviews.forEach((review) => {
    const rating = Number(review.rating);
    if (rating >= 1 && rating <= 5) {
      ratingCounts[rating - 1]++;
    }
  });

  const averageRating =
    totalReviews > 0
      ? approvedReviews.reduce(
          (sum, review) => sum + Number(review.rating),
          0
        ) / totalReviews
      : 0;

  return (
    <div className="w-full space-y-8">
      {/* Description Section */}
      <section id="description" className="scroll-mt-20">
        <div className="bg-babyshopWhite border border-babyshopTextLight/20 rounded-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-babyshopBlack flex items-center gap-3 mb-6">
            <div className="p-2 bg-babyshopSky/10 rounded-lg">
              <Package className="text-babyshopSky" size={28} />
            </div>
            Product Description
          </h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-babyshopBlack/80 leading-relaxed text-base">
              {product?.description ||
                "No description available for this product."}
            </p>
          </div>

          {/* Key Features */}
          <div className="mt-6 p-5 bg-babyshopLightBg rounded-lg border border-babyshopTextLight/20">
            <h3 className="font-semibold text-babyshopBlack mb-4 text-lg">
              Key Features:
            </h3>
            <ul className="space-y-3 text-babyshopBlack/80">
              <li className="flex items-start gap-3">
                <span className="text-babyshopSky mt-1 text-xl">•</span>
                <span>
                  High-quality materials ensuring durability and safety
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-babyshopSky mt-1 text-xl">•</span>
                <span>Easy to clean and maintain</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-babyshopSky mt-1 text-xl">•</span>
                <span>Suitable for babies and toddlers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-babyshopSky mt-1 text-xl">•</span>
                <span>Meets all safety standards and regulations</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Specifications Section */}
      <section id="specifications" className="scroll-mt-20">
        <div className="bg-babyshopWhite border border-babyshopTextLight/20 rounded-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-babyshopBlack flex items-center gap-3 mb-6">
            <div className="p-2 bg-babyshopSky/10 rounded-lg">
              <Tag className="text-babyshopSky" size={28} />
            </div>
            Product Specifications
          </h2>
          <div className="bg-babyshopLightBg rounded-lg border border-babyshopTextLight/20 overflow-hidden">
            <div className="divide-y divide-babyshopTextLight/20">
              <div className="grid grid-cols-1 md:grid-cols-2 p-4 hover:bg-babyshopWhite transition-colors">
                <span className="font-medium text-babyshopBlack mb-1 md:mb-0">
                  Product Name
                </span>
                <span className="text-babyshopBlack/80">
                  {product?.name || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 p-4 hover:bg-babyshopWhite transition-colors">
                <span className="font-medium text-babyshopBlack mb-1 md:mb-0">
                  Price
                </span>
                <span className="text-babyshopBlack/80 font-semibold text-lg">
                  ${product?.price || "N/A"}
                </span>
              </div>
              {product?.originalPrice && (
                <div className="grid grid-cols-1 md:grid-cols-2 p-4 hover:bg-babyshopWhite transition-colors">
                  <span className="font-medium text-babyshopBlack mb-1 md:mb-0">
                    Original Price
                  </span>
                  <span className="text-babyshopBlack/80 line-through">
                    ${product.originalPrice}
                  </span>
                </div>
              )}
              {product?.discountPercentage && (
                <div className="grid grid-cols-1 md:grid-cols-2 p-4 hover:bg-babyshopWhite transition-colors">
                  <span className="font-medium text-babyshopBlack mb-1 md:mb-0">
                    Discount
                  </span>
                  <span className="text-babyshopRed font-semibold">
                    {product.discountPercentage}% OFF
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 p-4 hover:bg-babyshopWhite transition-colors">
                <span className="font-medium text-babyshopBlack mb-1 md:mb-0">
                  Stock Status
                </span>
                <span
                  className={`font-medium ${product?.stock && product.stock > 0 ? "text-green-600" : "text-babyshopRed"}`}
                >
                  {product?.stock && product.stock > 0
                    ? `In Stock (${product.stock} available)`
                    : "Out of Stock"}
                </span>
              </div>
              {product?.category && (
                <div className="grid grid-cols-1 md:grid-cols-2 p-4 hover:bg-babyshopWhite transition-colors">
                  <span className="font-medium text-babyshopBlack mb-1 md:mb-0">
                    Category
                  </span>
                  <span className="text-babyshopBlack/80">
                    {product.category.name}
                  </span>
                </div>
              )}
              {brandName && (
                <div className="grid grid-cols-1 md:grid-cols-2 p-4 hover:bg-babyshopWhite transition-colors">
                  <span className="font-medium text-babyshopBlack mb-1 md:mb-0">
                    Brand
                  </span>
                  <span className="text-babyshopBlack/80">{brandName}</span>
                </div>
              )}
              {product?.averageRating !== undefined && (
                <div className="grid grid-cols-1 md:grid-cols-2 p-4 hover:bg-babyshopWhite transition-colors">
                  <span className="font-medium text-babyshopBlack mb-1 md:mb-0">
                    Average Rating
                  </span>
                  <span className="text-babyshopBlack/80 flex items-center gap-1">
                    {product.averageRating.toFixed(1)}{" "}
                    <Star
                      size={16}
                      className="text-babyshopSky"
                      fill="currentColor"
                    />
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="scroll-mt-20">
        <div className="bg-babyshopWhite border border-babyshopTextLight/20 rounded-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-babyshopBlack flex items-center gap-3 mb-6">
            <div className="p-2 bg-babyshopSky/10 rounded-lg">
              <Star className="text-babyshopSky" size={28} />
            </div>
            Customer Reviews ({totalReviews})
          </h2>

          {/* Rating Statistics */}
          {totalReviews > 0 && (
            <div className="bg-babyshopLightBg/50 border border-babyshopTextLight/20 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Average Rating */}
                <div className="flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold text-babyshopBlack mb-2">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={
                          i < Math.round(averageRating)
                            ? "fill-babyshopSky text-babyshopSky"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <p className="text-sm text-babyshopTextLight">
                    Based on {totalReviews}{" "}
                    {totalReviews === 1 ? "review" : "reviews"}
                  </p>
                </div>

                {/* Rating Breakdown */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = ratingCounts[rating - 1];
                    const percentage =
                      totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-babyshopBlack w-12">
                          {rating} star
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-babyshopSky h-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-babyshopTextLight w-8 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Approved Reviews */}
          {displayedReviews.length > 0 ? (
            <>
              <div className="space-y-4 mb-6">
                {displayedReviews.map((review) => (
                  <div
                    key={review._id}
                    className="bg-babyshopLightBg rounded-lg border border-babyshopTextLight/20 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-babyshopBlack text-lg">
                          {review.userName}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={
                                i < Number(review.rating)
                                  ? "fill-babyshopSky text-babyshopSky"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-babyshopTextLight">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-babyshopBlack/80 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mb-8">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="border-babyshopTextLight/30 hover:border-babyshopSky hover:bg-babyshopSky/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </Button>

                  {/* Page Numbers */}
                  {getPageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                      {page === "..." ? (
                        <span className="px-2 text-babyshopTextLight">...</span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(page as number)}
                          className={`min-w-9 ${
                            currentPage === page
                              ? "bg-babyshopSky text-white border-babyshopSky hover:bg-babyshopSky/90"
                              : "border-babyshopTextLight/30 hover:border-babyshopSky hover:bg-babyshopSky/10"
                          }`}
                        >
                          {page}
                        </Button>
                      )}
                    </React.Fragment>
                  ))}

                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="border-babyshopTextLight/30 hover:border-babyshopSky hover:bg-babyshopSky/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-babyshopLightBg rounded-lg border border-babyshopTextLight/20 p-8 text-center mb-8">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center text-babyshopTextLight">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={24} />
                  ))}
                </div>
                <p className="text-babyshopBlack/70">
                  No reviews yet. Be the first to share your experience!
                </p>
              </div>
            </div>
          )}

          {/* Review Form */}
          <div className="border-t border-babyshopTextLight/20 pt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-babyshopBlack">
                Write a Review
              </h3>
              {!showReviewForm && (
                <Button
                  onClick={() => setShowReviewForm(true)}
                  className="bg-babyshopSky hover:bg-babyshopSky/90"
                >
                  <Star size={16} className="mr-2" />
                  Add Review
                </Button>
              )}
            </div>

            {showReviewForm && (
              <div className="bg-babyshopLightBg/50 border border-babyshopTextLight/20 rounded-lg p-6">
                <ReviewForm
                  productId={product?._id || ""}
                  onReviewSubmitted={handleReviewSubmitted}
                />
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowReviewForm(false)}
                    className="border-babyshopTextLight/30"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDescription;
