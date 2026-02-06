"use client";
import { useRouter } from "next/navigation";
import {
  Home,
  ShoppingBag,
  Heart,
  Search,
  Phone,
  MapPin,
  Clock,
  ArrowLeft,
  Baby,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const NotFoundPageClient = () => {
  const router = useRouter();

  const quickLinks = [
    { href: "/shop", label: "Shop All Products", icon: ShoppingBag },
    { href: "/user/wishlist", label: "Wishlist", icon: Heart },
    { href: "/search", label: "Search Products", icon: Search },
    { href: "/help/contact", label: "Contact Support", icon: Phone },
  ];

  const popularCategories = [
    { href: "/shop?category=clothing", label: "Baby Clothes" },
    { href: "/shop?category=toys", label: "Toys & Games" },
    { href: "/shop?category=feeding", label: "Feeding Essentials" },
    { href: "/shop?category=safety", label: "Safety Products" },
    { href: "/shop?category=nursery", label: "Nursery Decor" },
    { href: "/shop?category=accessories", label: "Accessories" },
  ];

  const helpfulPages = [
    { href: "/track-order", label: "Track Your Order" },
    { href: "/returns", label: "Returns & Exchanges" },
    { href: "/help/shipping", label: "Shipping Information" },
    { href: "/testimonials", label: "Customer Reviews" },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="text-center space-y-6 bg-linear-to-r from-blue-600 to-purple-600 text-white pb-8">
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mx-auto"
              >
                <div className="relative">
                  <Baby className="mx-auto h-20 w-20 text-white drop-shadow-lg" />
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
                    ?
                  </div>
                </div>
              </motion.div>
              <div>
                <CardTitle className="text-4xl font-bold mb-2">
                  Oops! Page Not Found
                </CardTitle>
                <CardDescription className="text-blue-100 text-lg">
                  This little one seems to have wandered off to playtime!
                  <br />
                  Don&apos;t worry, we&apos;ll help you find what you&apos;re
                  looking for.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-8 space-y-8">
              {/* Main Navigation */}
              <div className="text-center space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => router.push("/")}
                    className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl text-lg shadow-lg transition-all duration-300"
                  >
                    <Home className="mr-2 h-5 w-5" />
                    Return to Home
                  </Button>
                </motion.div>
                <p className="text-gray-600">
                  Or explore our amazing collection of baby products below
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                  Quick Links
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickLinks.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href={link.href}
                        className="flex flex-col items-center p-4 bg-linear-to-br from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 group"
                      >
                        <link.icon className="h-8 w-8 text-gray-600 group-hover:text-blue-600 mb-2 transition-colors" />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 text-center transition-colors">
                          {link.label}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Popular Categories */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                  Popular Categories
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {popularCategories.map((category, index) => (
                    <motion.div
                      key={category.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <Link
                        href={category.href}
                        className="block p-3 bg-white hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 group"
                      >
                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                          {category.label}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Helpful Pages */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                  Need Help?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {helpfulPages.map((page, index) => (
                    <motion.div
                      key={page.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <Link
                        href={page.href}
                        className="flex items-center p-3 bg-linear-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 rounded-lg border border-green-200 hover:border-green-300 transition-all duration-200 group"
                      >
                        <ArrowLeft className="h-4 w-4 text-green-600 mr-3 transform group-hover:translate-x-1 transition-transform" />
                        <span className="text-sm font-medium text-green-700">
                          {page.label}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="bg-gray-50 p-6">
              <div className="w-full space-y-4">
                {/* Store Info */}
                <div className="text-center space-y-2">
                  <h4 className="font-semibold text-gray-800">
                    Welcome to Babyshop - Your Trusted Baby Store
                  </h4>
                  <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                    We&apos;re your one-stop destination for everything your
                    little one needs. From clothes and toys to safety gear and
                    nursery essentials, we make shopping for your baby safe,
                    easy, and enjoyable.
                  </p>
                </div>

                {/* Contact Info */}
                <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-blue-600" />
                    <Link
                      href="/help/contact"
                      className="hover:text-blue-600 transition-colors"
                    >
                      Customer Support
                    </Link>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-green-600" />
                    <span>24/7 Available</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-purple-600" />
                    <Link
                      href="/help/shipping"
                      className="hover:text-purple-600 transition-colors"
                    >
                      Free Shipping
                    </Link>
                  </div>
                </div>

                {/* Privacy */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Your privacy and security matter to us.
                    <Link
                      href="/privacy"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      Privacy Policy
                    </Link>
                    {" • "}
                    <Link
                      href="/terms"
                      className="text-blue-600 hover:underline"
                    >
                      Terms of Service
                    </Link>
                  </p>
                </div>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPageClient;
