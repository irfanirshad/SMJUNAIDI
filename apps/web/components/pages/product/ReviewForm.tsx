"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { addProductReview } from "@/lib/productApi";
import { useUserStore } from "@/lib/store";
import { useRouter } from "next/navigation";

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authUser, auth_token, isAuthenticated } = useUserStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !authUser) {
      toast.error("Please sign in to submit a review");
      router.push("/auth/signin");
      return;
    }

    if (!auth_token) {
      toast.error("Authentication token missing. Please sign in again.");
      router.push("/auth/signin");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please write a review");
      return;
    }

    if (comment.trim().length < 10) {
      toast.error("Review must be at least 10 characters long");
      return;
    }

    setIsSubmitting(true);

    try {

      await addProductReview(productId, rating, comment.trim(), auth_token);
      toast.success(
        "Review submitted! It will be visible after admin approval."
      );
      setRating(0);
      setComment("");

      // Call the callback to refresh product data
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit review";
      console.error("Review submission error:", error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-6 bg-babyshopLightBg rounded-lg">
        <p className="text-babyshopTextLight mb-4">
          Please sign in to write a review
        </p>
        <Button
          onClick={() => router.push("/auth/signin")}
          className="bg-babyshopSky hover:bg-babyshopSky/90"
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-babyshopBlack mb-2">
          Your Rating *
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={`${
                  star <= (hoveredRating || rating)
                    ? "fill-babyshopSky text-babyshopSky"
                    : "text-gray-300"
                } transition-colors`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-babyshopTextLight">
              {rating} out of 5 stars
            </span>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-babyshopBlack mb-2"
        >
          Your Review *
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={5}
          className="resize-none"
          required
        />
        <p className="text-xs text-babyshopTextLight mt-1">
          Minimum 10 characters
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
          className="bg-babyshopSky hover:bg-babyshopSky/90 px-8"
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
        <p className="text-xs text-babyshopTextLight">
          Your review will be visible after admin approval
        </p>
      </div>
    </form>
  );
};

export default ReviewForm;
