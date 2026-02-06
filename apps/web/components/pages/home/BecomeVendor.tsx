"use client";

import Link from "next/link";
import Container from "@/components/common/Container";
import { VendorConfig, isVendorSystemEnabled } from "@/lib/vendorConfig";
import { useUserStore } from "@/lib/store";
import { CheckCircle, Store, Package, TrendingUp } from "lucide-react";

interface BecomeVendorProps {
  config: VendorConfig;
}

const BecomeVendor = ({ config }: BecomeVendorProps) => {
  const vendorEnabled = isVendorSystemEnabled(config);
  const { authUser } = useUserStore();

  // Don't render anything if vendor system is disabled
  if (!vendorEnabled) {
    return null;
  }

  // If user is a vendor, show welcome message instead
  if (authUser?.role === "vendor") {
    return (
      <Container className="bg-linear-to-r from-green-600 to-emerald-700 rounded-2xl p-8 md:p-12 relative overflow-hidden text-white my-10">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-10 h-10" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Welcome Back, Vendor!
            </h2>
          </div>
          <p className="text-green-100 text-lg mb-8">
            You're already part of our vendor community. Manage your products,
            track orders, and grow your business from your vendor dashboard.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Store className="w-6 h-6" />
              <div>
                <div className="font-semibold">Your Store</div>
                <div className="text-sm text-green-100">Manage products</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Package className="w-6 h-6" />
              <div>
                <div className="font-semibold">Orders</div>
                <div className="text-sm text-green-100">Track sales</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <TrendingUp className="w-6 h-6" />
              <div>
                <div className="font-semibold">Analytics</div>
                <div className="text-sm text-green-100">View insights</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/vendor"
              className="bg-white text-green-600 hover:bg-green-50 font-semibold py-3 px-8 rounded-full transition-all duration-300 text-center"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/vendor/products"
              className="bg-transparent border-2 border-white hover:bg-white hover:text-green-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 text-center"
            >
              Manage Products
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 bottom-0 opacity-20 hidden md:block w-1/3 h-full">
          <svg
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-white fill-current"
          >
            <path
              d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.9,32.7C59.6,44,48.3,53.5,36.2,60.2C24.1,66.9,11.2,70.8,-1.2,72.9C-13.6,75,-26.1,75.3,-37.2,69.5C-48.2,63.7,-57.8,51.8,-66,39.1C-74.2,26.4,-81,12.9,-82.2,-1.3C-83.3,-15.5,-78.9,-30.4,-70.1,-42.6C-61.3,-54.8,-48.1,-64.3,-34.7,-71.9C-21.3,-79.6,-7.7,-85.4,3.7,-91.8L15.1,-98.2"
              transform="translate(100 100)"
            />
          </svg>
        </div>
      </Container>
    );
  }

  return (
    <Container className="bg-linear-to-r from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 relative overflow-hidden text-white my-10">
      <div className="relative z-10 max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Become a Vendor on Babymart
        </h2>
        <p className="text-gray-300 text-lg mb-8">
          Join our marketplace and reach thousands of customers. Sell your baby
          products with ease and grow your business today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/become-vendor"
            className="bg-babyshopSky hover:bg-white hover:text-babyshopSky text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 text-center"
          >
            Apply Now
          </Link>
          <Link
            href="/vendor-guide"
            className="bg-transparent border border-white hover:bg-white hover:text-gray-900 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 text-center"
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute right-0 bottom-0 opacity-20 hidden md:block w-1/3 h-full">
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white fill-current"
        >
          <path
            d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.9,32.7C59.6,44,48.3,53.5,36.2,60.2C24.1,66.9,11.2,70.8,-1.2,72.9C-13.6,75,-26.1,75.3,-37.2,69.5C-48.2,63.7,-57.8,51.8,-66,39.1C-74.2,26.4,-81,12.9,-82.2,-1.3C-83.3,-15.5,-78.9,-30.4,-70.1,-42.6C-61.3,-54.8,-48.1,-64.3,-34.7,-71.9C-21.3,-79.6,-7.7,-85.4,3.7,-91.8L15.1,-98.2"
            transform="translate(100 100)"
          />
        </svg>
      </div>
    </Container>
  );
};

export default BecomeVendor;
