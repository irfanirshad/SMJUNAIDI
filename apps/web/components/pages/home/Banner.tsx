import { fetchData } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Banner {
  _id: string;
  name: string;
  title: string;
  startFrom: number;
  image: string;
  bannerType: string;
}

const Banner = async () => {
  let banners: Banner[] = [];
  try {
    const data = await fetchData<Banner[]>("/banners");
    banners = data;
  } catch (error) {
  }
  const imageOne = banners[0];
  const imageTwo = banners[1];

  if (banners?.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-0">
      <div className="md:col-span-3 relative group overflow-hidden rounded-md">
        <Image
          src={imageOne?.image}
          alt="bannerImage"
          width={800}
          height={500}
          priority
          className="w-full h-72 md:min-h-[400px] object-cover group-hover:scale-110 hoverEffect"
        />
        <div className="absolute top-0 left-0 w-full h-full flex flex-col gap-3 items-center justify-center text-babyshopWhite">
          <p className="font-bold text-sm">{imageOne?.name}</p>
          <h2 className="text-4xl font-medium max-w-96 text-center capitalize">
            {imageOne?.title}
          </h2>
          <Link
            href={"/shop"}
            className="capitalize bg-babyshopWhite rounded-full font-medium text-babyshopBlack px-6 py-2 text-base hover:bg-babyshopSky/10 border border-transparent hover:border hover:border-babyshopWhite hoverEffect"
          >
            shop now
          </Link>
        </div>
      </div>
      <div className="relative group overflow-hidden rounded-md">
        <Image
          src={imageTwo?.image}
          alt="bannerImage"
          width={400}
          height={500}
          className="w-full h-72 md:min-h-[400px] object-cover group-hover:scale-110 hoverEffect"
        />
        <div className="absolute top-10 left-0 w-full h-full flex flex-col gap-3 items-center justify-start text-babyshopWhite">
          <p className="font-bold text-sm">{imageTwo?.name}</p>
          <h2 className="text-4xl font-medium max-w-96 text-center capitalize">
            {imageTwo?.title}
          </h2>
          <Link
            href={"/shop"}
            className="capitalize bg-babyshopWhite rounded-full font-medium text-babyshopBlack px-6 py-2 text-base hover:bg-babyshopPurple/10 border border-transparent hover:border hover:border-babyshopWhite hoverEffect"
          >
            shop now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Banner;
