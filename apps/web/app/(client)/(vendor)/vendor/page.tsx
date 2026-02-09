"use client";

import { useEffect, useState } from "react";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Plus,
  Settings,
  BarChart3,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalProducts: number;
  pendingProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function VendorDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    pendingProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = Cookies.get("auth_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/dashboard/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      href: "/vendor/products",
      trend: "+12%",
      trendUp: true,
    },
    {
      name: "Pending Approval",
      value: stats.pendingProducts,
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      href: "/vendor/products?status=pending",
      badge: stats.pendingProducts > 0 ? "Needs Attention" : "All Clear",
      badgeVariant: stats.pendingProducts > 0 ? "destructive" : "default",
    },
    {
      name: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      href: "/vendor/orders",
      trend: "+8%",
      trendUp: true,
    },
    {
      name: "Total Revenue",
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      href: "/vendor/analytics",
      trend: "+23%",
      trendUp: true,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-babyshopBlack">
            Vendor Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your products, orders, and view your store performance
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/vendor/products">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/vendor/products">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card
            key={stat.name}
            className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
          >
            <Link href={stat.href}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.name}
                    </p>
                    <p className="text-3xl font-bold text-babyshopBlack">
                      {stat.value}
                    </p>
                    {stat.trend && (
                      <div className="flex items-center gap-1">
                        <TrendingUp
                          className={`h-4 w-4 ${stat.trendUp ? "text-green-600" : "text-red-600"}`}
                        />
                        <span
                          className={`text-xs font-medium ${stat.trendUp ? "text-green-600" : "text-red-600"}`}
                        >
                          {stat.trend}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          from last month
                        </span>
                      </div>
                    )}
                    {stat.badge && (
                      <Badge
                        variant={stat.badgeVariant as any}
                        className="text-xs"
                      >
                        {stat.badge}
                      </Badge>
                    )}
                  </div>
                  <div
                    className={`${stat.iconBg} p-3 rounded-lg group-hover:scale-110 transition-transform`}
                  >
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* Welcome Banner */}
      <Card className="border-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6" />
                <h2 className="text-2xl font-bold">
                  Welcome to Your Vendor Portal!
                </h2>
              </div>
              <p className="text-white/90 text-lg">
                Start adding products to your store and manage your inventory.
                All products will be reviewed by our admin team before going
                live.
              </p>
            </div>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="hidden lg:flex"
            >
              <Link href="/vendor/products">
                Get Started
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to help you manage your store efficiently
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2 hover:bg-purple-50 hover:border-purple-300"
            >
              <Link href="/vendor/products">
                <div className="p-3 bg-purple-100 rounded-lg mb-2">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
                <span className="font-semibold">Add New Product</span>
                <span className="text-xs text-muted-foreground">
                  List products for sale
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
            >
              <Link href="/vendor/products">
                <div className="p-3 bg-blue-100 rounded-lg mb-2">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <span className="font-semibold">Manage Inventory</span>
                <span className="text-xs text-muted-foreground">
                  Update stock & prices
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2 hover:bg-green-50 hover:border-green-300"
            >
              <Link href="/vendor/orders">
                <div className="p-3 bg-green-100 rounded-lg mb-2">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
                <span className="font-semibold">Process Orders</span>
                <span className="text-xs text-muted-foreground">
                  View & fulfill orders
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2 hover:bg-amber-50 hover:border-amber-300"
            >
              <Link href="/vendor/analytics">
                <div className="p-3 bg-amber-100 rounded-lg mb-2">
                  <BarChart3 className="h-6 w-6 text-amber-600" />
                </div>
                <span className="font-semibold">View Analytics</span>
                <span className="text-xs text-muted-foreground">
                  Track performance
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2 hover:bg-rose-50 hover:border-rose-300"
            >
              <Link href="/vendor/products?status=pending">
                <div className="p-3 bg-rose-100 rounded-lg mb-2">
                  <Clock className="h-6 w-6 text-rose-600" />
                </div>
                <span className="font-semibold">Pending Review</span>
                <span className="text-xs text-muted-foreground">
                  {stats.pendingProducts} items waiting
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2 hover:bg-indigo-50 hover:border-indigo-300"
            >
              <Link href="/vendor/products">
                <div className="p-3 bg-indigo-100 rounded-lg mb-2">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                </div>
                <span className="font-semibold">Store Settings</span>
                <span className="text-xs text-muted-foreground">
                  Configure your store
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
