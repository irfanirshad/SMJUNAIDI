import React from "react";
import Container from "../Container";
import { topHelpCenter } from "@/constants/data";
import Link from "next/link";
import TopSocialLinksClient from "./TopSocialLinksClient";
import SelectCurrency from "./SelectCurrency";

const TopBanner = () => {
  return (
    <div className="w-full bg-babyshopPurple text-babyShopLightWhite py-1 text-sm font-medium">
      <Container className="grid grid-cols-1 md:grid-cols-3">
        <div className="flex items-center gap-5">
          {topHelpCenter?.map((item) => (
            <Link
              key={item?.title}
              href={item?.href}
              className="hover:text-babyshopWhite hoverEffect"
            >
              {item?.title}
            </Link>
          ))}
        </div>
        <p className="text-center hidden md:inline-flex">
          100% Secure delivery without contacting the courier
        </p>
        <div className="hidden md:inline-flex items-center justify-end">
          <SelectCurrency />
          <TopSocialLinksClient />
        </div>
      </Container>
    </div>
  );
};

export default TopBanner;
