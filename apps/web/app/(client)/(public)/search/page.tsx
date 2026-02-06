import React from "react";
import Container from "@/components/common/Container";
import { Title } from "@/components/common/text";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import { Search, Filter, TrendingUp } from "lucide-react";
import Link from "next/link";

const SearchPage = () => {
  const topSearches = [
    "baby stroller",
    "organic baby food",
    "baby clothes 0-3 months",
    "high chair",
    "baby monitor",
    "diaper bag",
    "baby toys",
    "car seat",
    "baby bottles",
    "crib mattress",
  ];

  const searchCategories = [
    { title: "Feeding", count: 156, href: "/shop?category=feeding" },
    { title: "Clothing", count: 234, href: "/shop?category=clothing" },
    { title: "Toys", count: 189, href: "/shop?category=toys" },
    { title: "Safety", count: 98, href: "/shop?category=safety" },
    { title: "Furniture", count: 67, href: "/shop?category=furniture" },
    { title: "Strollers", count: 45, href: "/shop?category=strollers" },
  ];

  const recentSearches = [
    "organic cotton onesies",
    "baby monitor with video",
    "convertible car seat",
    "wooden toys",
    "baby carrier",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="pt-6">
        <PageBreadcrumb currentPage="Search" items={[]} />
      </Container>

      <Container className="py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Title className="text-4xl font-bold mb-4">Search Products</Title>
            <p className="text-gray-600">
              Find exactly what you&apos;re looking for from our extensive
              collection
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search for baby products..."
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-babyshopSky focus:border-transparent"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-babyshopSky text-white px-6 py-2 rounded-lg hover:bg-babyshopSky/90 transition-colors">
                Search
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter size={16} />
                <span>All Categories</span>
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Price Range
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Brand
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Age Group
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Top Searches */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="text-babyshopSky" size={20} />
                  <h2 className="text-xl font-semibold">Top Searches</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topSearches.map((search, index) => (
                    <Link
                      key={index}
                      href={`/shop?search=${encodeURIComponent(search)}`}
                      className="px-3 py-2 bg-gray-100 rounded-full text-sm hover:bg-babyshopSky hover:text-white transition-colors"
                    >
                      {search}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Search Categories */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Browse by Category
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {searchCategories.map((category, index) => (
                    <Link
                      key={index}
                      href={category.href}
                      className="p-4 border border-gray-200 rounded-lg hover:border-babyshopSky hover:bg-babyshopSky/5 transition-colors"
                    >
                      <div className="font-medium">{category.title}</div>
                      <div className="text-sm text-gray-500">
                        {category.count} products
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Searches */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold mb-4">Recent Searches</h3>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <Link
                      key={index}
                      href={`/shop?search=${encodeURIComponent(search)}`}
                      className="block text-sm text-gray-600 hover:text-babyshopSky transition-colors"
                    >
                      {search}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Search Tips */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold mb-4">Search Tips</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• Use specific keywords for better results</p>
                  <p>• Try different variations of product names</p>
                  <p>• Filter by age group to find age-appropriate items</p>
                  <p>• Use brand names for specific products</p>
                  <p>• Check spelling for accurate results</p>
                </div>
              </div>

              {/* Need Help */}
              <div className="bg-babyshopSky/10 rounded-lg p-6">
                <h3 className="font-semibold mb-2">
                  Need Help Finding Something?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Our customer service team is here to help you find exactly
                  what you need.
                </p>
                <Link
                  href="/help/contact"
                  className="inline-block bg-babyshopSky text-white px-4 py-2 rounded-lg text-sm hover:bg-babyshopSky/90 transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default SearchPage;
