import { footerTopData } from "@/constants/data";
import Image from "next/image";
import React from "react";
import Container from "../Container";

const TopFooter = () => {
  return (
    <Container className="py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {footerTopData?.map((item) => (
        <div
          key={item?.title}
          className="flex items-center gap-5 lg:border-r last:border-r-0"
        >
          <Image src={item?.image} alt="footerOneImage" />
          <div>
            <h3 className="text-lg font-semibold capitalize mb-1.5">
              {item?.title}
            </h3>
            <p className="font-medium text-babyshopBlack/60 leading-5">
              {item?.subTitle}
            </p>
          </div>
        </div>
      ))}
    </Container>
  );
};

export default TopFooter;
