"use client";

import { Store } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useUserStore } from "../../../lib/store";

const VendorBadge = () => {
  const { isAuthenticated, authUser } = useUserStore();
  const [isVendor, setIsVendor] = useState(false);
  const [vendorStatus, setVendorStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && authUser) {
      checkVendorStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, authUser]);

  const checkVendorStatus = async () => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const vendor = data.data || data.vendor;
        if (vendor) {
          setIsVendor(true);
          setVendorStatus(vendor.status);
        }
      }
    } catch (error) {
      console.error("Failed to check vendor status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything if not authenticated or not a vendor
  if (!isAuthenticated || !authUser || !isVendor || loading) {
    return null;
  }

  // Only show for approved vendors or vendor role
  if (vendorStatus !== "approved" && authUser.role !== "vendor") {
    return null;
  }

  return (
    <Link href="/vendor" className="relative group" title="Vendor Dashboard">
      <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-babyshopPurple/10 hover:bg-babyshopPurple/20 transition-all">
        <Store className="h-5 w-5 text-babyshopPurple" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-babyshopSky opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-babyshopSky"></span>
        </span>
      </div>
    </Link>
  );
};

export default VendorBadge;
