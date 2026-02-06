"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Package,
  BarChart3,
  Bell,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Container from "@/components/common/Container";

interface NavItem {
  href: string;
  label: string;
  icon: JSX.Element;
}

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: "/user/profile",
      label: "Profile",
      icon: <User className="w-4 h-4" />,
    },
    {
      href: "/user/orders",
      label: "Orders",
      icon: <Package className="w-4 h-4" />,
    },
    {
      href: "/user/analytics",
      label: "Analytics",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      href: "/user/notifications",
      label: "Notifications",
      icon: <Bell className="w-4 h-4" />,
    },
    {
      href: "/user/settings",
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-6 max-w-7xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">
            Manage your account, orders, and preferences
          </p>
        </div>

        {/* Navigation Tabs - Desktop */}
        <div className="hidden lg:block mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <nav className="flex items-center gap-2 overflow-x-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-all relative",
                      isActive
                        ? "bg-babyshopSky text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Navigation Sidebar - Mobile & Tablet */}
        <div className="lg:hidden mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <nav className="divide-y divide-gray-200">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 transition-colors",
                      isActive
                        ? "bg-babyshopSky/10 text-babyshopSky font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {children}
        </div>
      </Container>
    </div>
  );
}
