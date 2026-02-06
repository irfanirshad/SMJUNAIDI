"use client";
import { Input } from "../../../components/ui/input";
import { fetchData } from "../../../lib/api";
import { getProductUrl } from "../../../lib/productHelpers";
import {
  Loader2,
  Search,
  X,
  Mic,
  MicOff,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "use-debounce";
import { motion, AnimatePresence } from "motion/react";
import AddToCartButton from "../products/AddToCartButton";

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

// Import Product type - fallback to local definition if package import fails
interface Category {
  _id: string;
  name: string;
  image: string;
  categoryType?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Brand {
  _id: string;
  name: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  stock?: number;
  countInStock?: number;
  averageRating?: number;
  rating?: number;
  numReviews?: number;
  image: string;
  images: string[];
  category: Category;
  brand: Brand | string;
  ratings?: unknown[];
  quantity?: number;
  matchScore?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductsResponse {
  products: Product[];
  total: number;
}

const SearchInput = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Voice search states
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Image search states
  const [isImageSearching, setIsImageSearching] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setVoiceSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join("");

          setSearch(transcript);
          setShowResults(true);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          if (event.error === "not-allowed") {
            setError(
              "Microphone access denied. Please enable microphone access."
            );
          } else if (event.error === "no-speech") {
            setError("No speech detected. Please try again.");
          } else {
            setError("Voice search error. Please try again.");
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const fetchFeaturedProducts = useCallback(async () => {
    setFeaturedLoading(true);
    try {
      const response = await fetchData<ProductsResponse>(
        "/products?page=1&limit=5"
      );
      setFeaturedProducts(response.products);
    } catch (error) {
      console.error("Error fetching featured products:", error);
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchData<ProductsResponse>(
        `/products?page=1&limit=10&search=${encodeURIComponent(searchTerm)}`
      );
      setProducts(response.products);
    } catch {
      setError("Failed to fetch products");
      // console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByImage = useCallback(async (imageFile: File) => {
    setIsImageSearching(true);
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const endpoint = `${apiUrl}${apiUrl.includes("/api") ? "" : "/api"}/products/search-by-image`;

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Image search error response:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorData.message || "Image search failed");
      }

      const data: ProductsResponse = await response.json();
      setProducts(data.products);
      setShowResults(true);

      if (data.products.length === 0) {
        setError("No matching products found for this image");
      }
    } catch (err) {
      setError("Failed to search by image. Please try again.");
      console.error("Image search error:", err);
    } finally {
      setIsImageSearching(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  useEffect(() => {
    fetchProducts(debouncedSearch);
  }, [debouncedSearch, fetchProducts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSearch && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [showSearch]);

  const toggleMobileSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setSearch("");
      setShowResults(true);
    }
  };

  const startVoiceSearch = () => {
    if (recognitionRef.current && !isListening) {
      setError(null);
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting voice recognition:", error);
        setError("Could not start voice search. Please try again.");
      }
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Perform search
      searchByImage(file);
      // Clear text search when using image search
      setSearch("");
    }

    // Reset input value to allow selecting the same file again
    event.target.value = "";
  };

  const triggerImageUpload = (isMobile = false) => {
    if (isMobile && mobileFileInputRef.current) {
      mobileFileInputRef.current.click();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const clearImageSearch = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setSearch("");
    setProducts([]);
  };

  return (
    <div ref={searchRef} className="relative lg:w-full">
      {/* Desktop search */}
      <button
        onClick={toggleMobileSearch}
        className="lg:hidden border p-2 rounded-full border-babyshopSky/30 hover:border-babyshopSky hvoerEffect group"
      >
        {showSearch ? (
          <X className="w-5 h-5 text-babyshopSky/60 group-hover:text-babyshopSky hoverEffect" />
        ) : (
          <Search className="w-5 h-5 text-babyshopSky/60 group-hover:text-babyshopSky hoverEffect" />
        )}
      </button>
      <form
        className="relative hidden lg:flex items-center"
        onSubmit={(e) => e.preventDefault()}
      >
        {imagePreview ? (
          <div className="flex-1 rounded-md py-2 px-3 bg-white border-2 border-babyshopRed flex items-center gap-2">
            <div className="w-10 h-10 bg-gray-50 rounded overflow-hidden shrink-0">
              <img
                src={imagePreview}
                alt="Search image"
                className="object-cover w-full h-full"
              />
            </div>
            <span className="text-sm text-gray-600 flex-1 truncate">
              Searching by image...
            </span>
          </div>
        ) : (
          <Input
            placeholder="Search Products..."
            className="flex-1 rounded-md py-5 focus-visible:ring-0 focus-visible:border-babyshopRed bg-white text-babyshopText placeholder:font-semibold placeholder:tracking-wide pr-16"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowResults(true)}
          />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <div className="absolute right-3 top-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => triggerImageUpload(false)}
            className={`p-1 rounded-full transition-colors ${
              isImageSearching
                ? "bg-babyshopSky text-white animate-pulse"
                : "text-babyshopText hover:text-babyshopSky"
            }`}
            title="Search by image"
            disabled={isImageSearching}
          >
            <Camera className="w-5 h-5" />
          </button>
          {voiceSupported && (
            <button
              type="button"
              onClick={isListening ? stopVoiceSearch : startVoiceSearch}
              className={`p-1 rounded-full transition-colors ${
                isListening
                  ? "bg-babyshopRed text-white animate-pulse"
                  : "text-babyshopText hover:text-babyshopSky"
              }`}
              title={isListening ? "Stop listening" : "Voice search"}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}
          {search || imagePreview ? (
            <X
              onClick={imagePreview ? clearImageSearch : () => setSearch("")}
              className="w-5 h-5 text-babyshopText hover:text-babyshopRed hoverEffect cursor-pointer"
            />
          ) : (
            <Search className="w-5 h-5 text-babyshopText" />
          )}
        </div>
      </form>

      {/* Mobile search overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed lg:hidden left-0 md:top-16 w-full px-1 py-1 md:px-5 md:py-2 bg-white"
          >
            <div className="bg-white p-4 shadow-lg rounded-md">
              <div className="relative flex items-center">
                {imagePreview ? (
                  <div className="w-full rounded-md py-2 px-3 bg-white border-2 border-babyshopRed flex items-center gap-2">
                    <div className="w-10 h-10 bg-gray-50 rounded overflow-hidden shrink-0">
                      <img
                        src={imagePreview}
                        alt="Search image"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <span className="text-sm text-gray-600 flex-1 truncate">
                      Searching by image...
                    </span>
                  </div>
                ) : (
                  <Input
                    ref={mobileInputRef}
                    placeholder="Search Products..."
                    className="w-full pr-16 py-5 rounded-md focus-visible:ring-0 focus-visible:border-babyshopRed bg-white text-babyshopText placeholder:font-semibold"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setShowResults(true)}
                  />
                )}
                <input
                  ref={mobileFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="absolute right-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => triggerImageUpload(true)}
                    className={`p-1 rounded-full transition-colors ${
                      isImageSearching
                        ? "bg-babyshopSky text-white animate-pulse"
                        : "text-babyshopText hover:text-babyshopSky"
                    }`}
                    title="Search by image"
                    disabled={isImageSearching}
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  {voiceSupported && (
                    <button
                      type="button"
                      onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                      className={`p-1 rounded-full transition-colors ${
                        isListening
                          ? "bg-babyshopRed text-white animate-pulse"
                          : "text-babyshopText hover:text-babyshopSky"
                      }`}
                      title={isListening ? "Stop listening" : "Voice search"}
                    >
                      {isListening ? (
                        <MicOff className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </button>
                  )}
                  {search || imagePreview ? (
                    <X
                      onClick={
                        imagePreview ? clearImageSearch : () => setSearch("")
                      }
                      className="w-5 h-5 text-babyshopText hover:text-babyshopRed hoverEffect cursor-pointer"
                    />
                  ) : (
                    <Search className="w-5 h-5 text-babyshopText" />
                  )}
                </div>
              </div>

              {/* Image preview */}
              {imagePreview && (
                <div className="mt-3 flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  <ImageIcon className="w-4 h-4 text-babyshopSky" />
                  <span className="text-sm text-gray-600 flex-1">
                    Searching by image...
                  </span>
                  <button
                    onClick={clearImageSearch}
                    className="text-babyshopRed hover:text-babyshopRed/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Mobile search results */}
              {showResults && (
                <div className="mt-2 bg-white rounded-md shadow-lg overflow-y-auto border border-gray-200 max-h-[50vh]">
                  {loading || isImageSearching ? (
                    <div className="py-2">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-babyshopRed" />
                          <span className="text-sm font-medium text-gray-700">
                            {isImageSearching
                              ? "Analyzing image..."
                              : "Searching..."}
                          </span>
                        </div>
                      </div>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
                            <div className="w-12 h-12 bg-gray-200 rounded" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4" />
                              <div className="h-3 bg-gray-200 rounded w-1/2" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : products?.length > 0 ? (
                    <div className="py-2">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-700">
                          Search Results ({products.length})
                        </p>
                      </div>
                      {products.map((product) => (
                        <div
                          key={product._id}
                          onClick={() => {
                            setShowResults(false);
                            setSearch("");
                            setShowSearch(false);
                          }}
                          className={`border-b border-gray-100 last:border-b-0 hover:bg-gray-50 px-4 py-3 cursor-pointer ${
                            product.matchScore && product.matchScore >= 90
                              ? "border-l-4 border-l-green-500 bg-green-50/30"
                              : ""
                          }`}
                        >
                          <Link
                            href={getProductUrl(product)}
                            className="flex items-center gap-3"
                          >
                            {(product.images?.[0] || product.image) && (
                              <div className="w-12 h-12 bg-gray-50 rounded shrink-0 overflow-hidden">
                                <img
                                  src={product.images?.[0] || product.image}
                                  alt={product.name}
                                  className="object-contain w-full h-full"
                                />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium text-gray-800 line-clamp-1">
                                  {product.name}
                                </h3>
                                {product.matchScore &&
                                  product.matchScore >= 90 && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 shrink-0">
                                      {product.matchScore}%
                                    </span>
                                  )}
                              </div>
                              {product.price && (
                                <p className="text-sm font-semibold text-babyshopSky mt-0.5">
                                  ${product.price}
                                </p>
                              )}
                              {(product.category?.name ||
                                (typeof product.brand === "object" &&
                                  product.brand?.name)) && (
                                <p className="text-sm text-babyshopTextLight">
                                  {product.category?.name || "No Category"} -{" "}
                                  {typeof product.brand === "object"
                                    ? product.brand?.name
                                    : product.brand || "No Brand"}
                                </p>
                              )}
                            </div>
                          </Link>
                        </div>
                      ))}
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                        <Link
                          href={`/shop?search=${encodeURIComponent(search)}`}
                          onClick={() => {
                            setShowResults(false);
                            setShowSearch(false);
                          }}
                          className="text-sm text-babyshopSky font-medium hover:underline"
                        >
                          View all results
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        {!search ? (
                          <p className="text-sm font-medium text-gray-700">
                            Popular Products
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-gray-700">
                            No results for &quot;
                            <span className="text-babyshopRed">{search}</span>
                            &quot;
                          </p>
                        )}
                      </div>
                      <div>
                        {featuredLoading ? (
                          <>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className="border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
                                  <div className="w-5 h-5 bg-gray-200 rounded" />
                                  <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        ) : featuredProducts?.length > 0 ? (
                          featuredProducts.map((item) => (
                            <div
                              key={item._id}
                              className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                            >
                              <button
                                onClick={() => {
                                  setSearch(item.name);
                                  setShowResults(true);
                                }}
                                className="flex items-center gap-3 w-full text-left px-4 py-3 hover:cursor-pointer"
                              >
                                <Search className="text-babyshopText w-5 h-5" />
                                <div>
                                  <h3 className="text-sm font-medium text-gray-800 line-clamp-1">
                                    {item.name}
                                  </h3>
                                </div>
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-sm text-gray-500">
                            No popular products available
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop search results dropdown */}
      {showResults && !showSearch && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-md shadow-lg z-50 max-h-[70vh] overflow-y-auto border border-gray-200 lg:block hidden">
          {loading || isImageSearching ? (
            <div className="py-2">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-babyshopRed" />
                  <span className="text-sm font-medium text-gray-700">
                    {isImageSearching ? "Analyzing image..." : "Searching..."}
                  </span>
                </div>
              </div>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : products?.length > 0 ? (
            <div className="py-0">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-700">
                  Search Results ({products.length})
                </p>
                {error && (
                  <p className="text-sm font-medium text-babyshopRed">
                    {error}
                  </p>
                )}
              </div>
              {products.map((product) => (
                <div
                  key={product._id}
                  className={`border-b border-gray-100 last:border-b-0 hover:bg-gray-50 px-4 py-3 flex items-center gap-5 justify-between ${
                    product.matchScore && product.matchScore >= 90
                      ? "border-l-4 border-l-green-500 bg-green-50/30"
                      : ""
                  }`}
                >
                  <div
                    className="flex-1"
                    onClick={() => {
                      setShowResults(false);
                      setSearch("");
                    }}
                  >
                    <Link
                      href={getProductUrl(product)}
                      className="flex items-center gap-3"
                    >
                      {(product.images?.[0] || product.image) && (
                        <div className="w-12 h-12 bg-gray-50 rounded shrink-0 overflow-hidden">
                          <img
                            src={product.images?.[0] || product.image}
                            alt={product.name}
                            className="object-contain w-full h-full"
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-800 line-clamp-1">
                            {product.name}
                          </h3>
                          {product.matchScore && product.matchScore >= 90 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 shrink-0">
                              {product.matchScore}% match
                            </span>
                          )}
                        </div>
                        {product.price && (
                          <p className="text-sm font-semibold text-babyshopSky mt-0.5">
                            ${product.price}
                          </p>
                        )}
                        {(product.category?.name ||
                          (typeof product.brand === "object" &&
                            product.brand?.name)) && (
                          <p className="text-sm text-babyshopTextLight">
                            {product.category?.name || "No Category"} -{" "}
                            {typeof product.brand === "object"
                              ? product.brand?.name
                              : product.brand || "No Brand"}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>
                  <AddToCartButton product={product} />
                </div>
              ))}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <Link
                  href={`/shop?search=${encodeURIComponent(search)}`}
                  onClick={() => {
                    setShowResults(false);
                  }}
                  className="text-sm text-babyshopSky font-medium hover:underline"
                >
                  View all results
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                {!search ? (
                  <p className="text-sm font-medium text-gray-700">
                    Popular Products
                  </p>
                ) : (
                  <p className="text-sm font-medium text-gray-700">
                    No results for &quot;
                    <span className="text-babyshopRed">{search}</span>&quot;
                  </p>
                )}
              </div>
              <div>
                {featuredLoading ? (
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
                          <div className="w-5 h-5 bg-gray-200 rounded" />
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : featuredProducts?.length > 0 ? (
                  featuredProducts.map((item) => (
                    <div
                      key={item._id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <button
                        onClick={() => {
                          setSearch(item.name);
                          setShowResults(true);
                        }}
                        className="flex items-center gap-3 w-full text-left px-4 py-3 hover:cursor-pointer"
                      >
                        <Search className="text-babyshopText w-5 h-5" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-800 line-clamp-1">
                            {item.name}
                          </h3>
                        </div>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    No popular products available
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
