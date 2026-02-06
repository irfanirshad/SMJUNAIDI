"use client";
import { useState, useEffect } from "react";
import { useCartStore, useUserStore } from "../../../lib/store";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import React from "react";

const CartIcon = () => {
  const { cartItemsWithQuantities, totalCartItems } = useCartStore();
  const { isAuthenticated } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering cart count on server
  if (!mounted) {
    return (
      <Link
        href={"/user/cart"}
        className="relative hover:text-babyshopSky hoverEffect"
      >
        <ShoppingBag />
        <span className="absolute -right-2 -top-2 bg-babyshopSky text-babyshopWhite text-[11px] font-medium w-4 h-4 rounded-full flex items-center justify-center">
          0
        </span>
      </Link>
    );
  }

  // Show 0 if user is not authenticated, otherwise show cart count
  const totalItems = !isAuthenticated
    ? 0
    : totalCartItems > 0
      ? totalCartItems
      : cartItemsWithQuantities.length;

  return (
    <Link
      href={"/user/cart"}
      className="relative hover:text-babyshopSky hoverEffect"
    >
      <ShoppingBag />
      <span className="absolute -right-2 -top-2 bg-babyshopSky text-babyshopWhite text-[11px] font-medium w-4 h-4 rounded-full flex items-center justify-center">
        {totalItems > 99 ? "99+" : totalItems}
      </span>
    </Link>
  );
};

export default CartIcon;
