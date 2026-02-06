import React from "react";
import PriceFormatter from "./PriceFormatter";

interface Props {
  price: number;
  discountPercentage?: number;
}

const PriceContainer = ({ price, discountPercentage }: Props) => {
  if (!discountPercentage) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <PriceFormatter amount={price} className="text-babyshopRed" />
      </div>
    );
  }

  const discountedPrice = price * (1 - discountPercentage / 100);
  return (
    <div className="flex items-center gap-2 text-sm">
      <PriceFormatter
        amount={price}
        className="text-babyshopTextLight line-through font-medium"
      />
      <PriceFormatter amount={discountedPrice} className="text-babyshopRed" />
    </div>
  );
};

export default PriceContainer;
