"use client";
import { twMerge } from "tailwind-merge";

interface Props {
  amount: number | undefined;
  className?: string;
}

const PriceFormatter = ({ amount, className }: Props) => {
  if (amount === undefined || amount === null) return null;

  const formattedPrice = new Number(amount).toLocaleString("en-IN", {
    currency: "INR",
    style: "currency",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span
      className={twMerge(
        "text-sm font-semibold text-tech_dark_color",
        className
      )}
    >
      {formattedPrice}
    </span>
  );
};

export default PriceFormatter;
