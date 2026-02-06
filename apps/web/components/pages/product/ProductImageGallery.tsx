"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import DiscountBadge from "@/components/common/DiscountBadge";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  discountPercentage?: number;
  stock?: number;
}

export default function ProductImageGallery({
  images,
  productName,
  discountPercentage,
  stock,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const handleThumbnailClick = (index: number) => {
    setSelectedImage(index);
  };

  const handleMainImageClick = () => {
    setModalImageIndex(selectedImage);
    setIsModalOpen(true);
  };

  const handlePrevImage = () => {
    setModalImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setModalImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevImage();
    if (e.key === "ArrowRight") handleNextImage();
    if (e.key === "Escape") setIsModalOpen(false);
  };

  return (
    <>
      <div className="relative">
        <div className="sticky top-5">
          {/* Main Image */}
          <div className="relative bg-babyshopLightBg rounded-xl overflow-hidden border border-babyshopTextLight/20 cursor-pointer group h-96 md:h-125 flex items-center justify-center">
            <div
              onClick={handleMainImageClick}
              className="relative w-full h-full"
            >
              <Image
                src={images[selectedImage]}
                alt={`${productName} - Image ${selectedImage + 1}`}
                width={600}
                height={600}
                className="w-full h-full object-contain"
                priority={selectedImage === 0}
              />
              {/* Overlay hint on hover */}
              <div className="absolute inset-0 bg-babyshopBlack/0 group-hover:bg-babyshopBlack/10 transition-all duration-300 flex items-center justify-center">
                <span className="text-babyshopWhite opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-babyshopBlack/70 px-4 py-2 rounded-lg text-sm font-medium">
                  Click to view full size
                </span>
              </div>
            </div>

            {/* Discount Badge */}
            {(discountPercentage ?? 0) > 0 && (
              <div className="absolute top-4 left-4">
                <DiscountBadge
                  discountPercentage={discountPercentage!}
                  className="w-16 h-16 text-lg"
                />
              </div>
            )}

            {/* Stock Badge */}
            {stock !== undefined && stock <= 5 && stock > 0 && (
              <div className="absolute top-4 right-4 bg-babyshopRed text-babyshopWhite px-3 py-1 rounded-full text-sm font-medium">
                Only {stock} left!
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  onMouseEnter={() => handleThumbnailClick(index)}
                  className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedImage === index
                      ? "border-babyshopSky ring-2 ring-babyshopSky/30"
                      : "border-babyshopTextLight/30 hover:border-babyshopSky/50"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${productName} thumbnail ${index + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-babyshopBlack/90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 text-babyshopWhite hover:text-babyshopSky transition-colors bg-babyshopBlack/50 rounded-full p-2"
            aria-label="Close modal"
          >
            <X size={32} />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 text-babyshopWhite bg-babyshopBlack/50 px-4 py-2 rounded-full text-sm font-medium">
            {modalImageIndex + 1} / {images.length}
          </div>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-babyshopWhite hover:text-babyshopSky transition-colors bg-babyshopBlack/50 rounded-full p-3"
                aria-label="Previous image"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-babyshopWhite hover:text-babyshopSky transition-colors bg-babyshopBlack/50 rounded-full p-3"
                aria-label="Next image"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          {/* Main Modal Image */}
          <div
            className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[modalImageIndex]}
              alt={`${productName} - Image ${modalImageIndex + 1}`}
              width={1200}
              height={1200}
              className="max-w-full max-h-full object-contain"
              priority
            />
          </div>

          {/* Thumbnail Navigation */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-babyshopBlack/50 p-2 rounded-md max-w-full overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalImageIndex(index);
                  }}
                  className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    modalImageIndex === index
                      ? "border-babyshopSky ring-2 ring-babyshopSky/50"
                      : "border-babyshopWhite/30 hover:border-babyshopSky/50"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${productName} thumbnail ${index + 1}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
