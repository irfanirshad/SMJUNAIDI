"use client";

import React from "react";
import dynamic from "next/dynamic";
import TopBanner from "./TopBanner";
import Container from "../Container";
import SearchInput from "./SearchInput";
import UserButton from "./UserButton";
import CartIcon from "./CartIcon";
import Logo from "../Logo";
import OrdersIcon from "./OrdersIcon";
import WishlistIcon from "./WishlistIcon";
import NotificationIcon from "./NotificationIcon";
import VendorBadge from "./VendorBadge";

// Dynamically import Sidebar with no SSR to prevent hydration issues
const Sidebar = dynamic(() => import("./Sidebar"), {
  ssr: false,
});

const Header = ({ logoUrl }: { logoUrl?: string | null }) => {
  return (
    <header className="border-b sticky top-0 z-50 bg-babyshopWhite">
      <TopBanner />
      <Container className="flex items-center justify-between gap-10 py-4">
        <div className="flex flex-1 items-center justify-between md:gap-12">
          <Sidebar />
          <Logo logoUrl={logoUrl} />
          <div className="md:hidden flex items-center gap-3">
            <OrdersIcon />
            <WishlistIcon />
            <NotificationIcon />
            <CartIcon />
          </div>
          <SearchInput />
        </div>
        <div className="hidden md:inline-flex items-center gap-5">
          {/* <OrdersIcon /> */}
          <WishlistIcon />
          <NotificationIcon />
          <CartIcon />
          <VendorBadge />
          <UserButton />
        </div>
      </Container>
    </header>
  );
};

export default Header;
