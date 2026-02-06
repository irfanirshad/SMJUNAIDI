"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  _id: string;
  name: string;
  title: string;
  image: string;
  link?: string;
}

interface HomeAdvertisementProps {
  bannerIds?: string[];
  images?: string[];
}

const HomeAdvertisement = ({ bannerIds, images }: HomeAdvertisementProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        // If specific banner IDs are provided, fetch those
        if (bannerIds && bannerIds.length > 0) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/banners?ids=${bannerIds.join(",")}`
          );
          const data = await response.json();
          setBanners(data);
        }
        // If direct images are provided, use them
        else if (images && images.length > 0) {
          const imageBanners = images.map((img, idx) => ({
            _id: `img-${idx}`,
            name: `Banner ${idx + 1}`,
            title: "",
            image: img,
          }));
          setBanners(imageBanners);
        }
        // Otherwise fetch all active advertisement banners from ads-banners API
        else {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/ads-banners`
          );

          const data = await response.json();
          setBanners(data?.adsBanners || []);
        }
      } catch (error) {
        console.error("Failed to fetch advertisement banners:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, [bannerIds, images]);

  // Auto-play carousel
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-gray-200 rounded-lg h-48 md:h-64 animate-pulse mt-3" />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-3 bg-babyshopWhite rounded-lg overflow-hidden border">
      <div className="relative group">
        {/* Carousel Images */}
        <div className="relative w-full aspect-16/6 md:aspect-21/6 overflow-hidden">
          {banners.map((banner, index) => (
            <div
              key={banner._id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              {banner.link ? (
                <Link href={banner.link}>
                  <Image
                    src={banner.image}
                    alt={banner.name || `Advertisement ${index + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                    priority={index === 0}
                    unoptimized={banner.image.startsWith("data:")}
                  />
                </Link>
              ) : (
                <Image
                  src={banner.image}
                  alt={banner.name || `Advertisement ${index + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                  priority={index === 0}
                  unoptimized={banner.image.startsWith("data:")}
                />
              )}
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "bg-white w-8"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeAdvertisement;
