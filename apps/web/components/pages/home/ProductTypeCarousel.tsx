"use client";

import { Product } from "@babyshop/types";
import ProductCard from "../../common/products/ProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ProductTypeCarouselProps {
  products: Product[];
}

const ProductTypeCarousel = ({ products }: ProductTypeCarouselProps) => {
  return (
    <div className="relative w-full px-12 py-6">
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {products.map((product) => (
            <CarouselItem
              key={product._id}
              className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5"
            >
              <div className="w-full">
                <ProductCard product={product} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4" />
        <CarouselNext className="-right-4" />
      </Carousel>
    </div>
  );
};

export default ProductTypeCarousel;
