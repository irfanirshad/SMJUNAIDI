"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Store,
  Menu,
  X,
  LogOut,
} from "lucide-react";

interface VendorStatus {
  isVendor: boolean;
  vendor: {
    _id: string;
    storeName: string;
    status: "pending" | "approved" | "rejected";
    logo?: string;
  } | null;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/vendor",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    href: "/vendor/products",
    icon: Package,
  },
  {
    name: "Orders",
    href: "/vendor/orders",
    icon: ShoppingCart,
  },
  {
    name: "Analytics",
    href: "/vendor/analytics",
    icon: BarChart3,
  },
  {
    name: "Store Settings",
    href: "/vendor/settings",
    icon: Settings,
  },
];

export default function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [vendorStatus, setVendorStatus] = useState<VendorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchVendorInfo();
  }, []);

  const fetchVendorInfo = async () => {
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
        // API returns { success: true, data: vendor }
        const vendor = data.data || data.vendor;
        if (vendor) {
          setVendorStatus({
            isVendor: true,
            vendor: vendor,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch vendor info:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-babyshopLightBg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-babyshopPurple"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-babyshopLightBg">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-babyshopBlack bg-opacity-50 lg:hidden top-27"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - positioned below header */}
      <div
        className={`fixed left-0 z-40 w-64 bg-babyshopWhite shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 top-27 bottom-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Store Info */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <Link href="/vendor" className="flex items-center space-x-2">
              <Store className="h-6 w-6 text-babyshopPurple" />
              <span className="text-base font-semibold text-babyshopBlack">
                {vendorStatus?.vendor?.storeName || "My Store"}
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-babyshopTextLight hover:text-babyshopBlack"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-babyshopPurple text-babyshopWhite shadow-sm"
                      : "text-babyshopBlack hover:bg-babyShopLightWhite"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <Link
              href="/"
              className="flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium text-babyshopTextLight hover:text-babyshopBlack hover:bg-babyShopLightWhite transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span>Back to Store</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile menu button - only visible on mobile */}
        <button
          type="button"
          className="fixed top-20 left-4 z-50 p-2.5 text-babyshopBlack lg:hidden hover:bg-babyShopLightWhite rounded-md bg-babyshopWhite shadow-md"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
