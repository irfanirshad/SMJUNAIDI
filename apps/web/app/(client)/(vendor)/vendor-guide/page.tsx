import Container from "@/components/common/Container";
import Link from "next/link";
import {
  TrendingUp,
  Shield,
  Headphones,
  DollarSign,
  Users,
  Package,
  BarChart3,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import VendorDisabled from "@/components/vendor/VendorDisabled";
import { getVendorConfig, isVendorSystemEnabled } from "@/lib/vendorConfig";

export default async function VendorGuidePage() {
  // Check vendor system configuration
  const vendorConfig = await getVendorConfig();
  const vendorEnabled = isVendorSystemEnabled(vendorConfig);

  // If vendor system is disabled, show disabled message
  if (!vendorEnabled) {
    return <VendorDisabled />;
  }

  // Reusable Apply Button Component - always redirects to /become-vendor
  // The become-vendor page will handle showing login message for non-authenticated users
  const ApplyButton = ({ className = "" }: { className?: string }) => {
    return (
      <Link
        href="/become-vendor"
        className={
          className ||
          "inline-flex items-center gap-2 bg-babyshopSky hover:bg-opacity-90 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 text-lg"
        }
      >
        Apply Now <ArrowRight className="w-5 h-5" />
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-babyshopLightBg">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-gray-900 to-gray-800 text-babyshopWhite py-20">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Become a Vendor on Babymart
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of successful vendors selling baby products to
              parents worldwide. Grow your business with our powerful platform
              and reach more customers than ever before.
            </p>
            <ApplyButton />
          </div>
        </Container>
      </div>

      {/* Benefits Section */}
      <Container className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-babyshopBlack mb-4">
            Why Sell on Babymart?
          </h2>
          <p className="text-lg text-babyshopTextLight max-w-2xl mx-auto">
            Discover the advantages of partnering with Babymart and take your
            baby products business to the next level.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Benefit 1 */}
          <div className="bg-babyshopWhite p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-babyshopSky/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-babyshopSky" />
            </div>
            <h3 className="text-xl font-bold text-babyshopBlack mb-3">
              Massive Customer Base
            </h3>
            <p className="text-babyshopTextLight">
              Access thousands of active parents and caregivers looking for
              quality baby products every day.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-babyshopSky/10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-7 h-7 text-babyshopSky" />
            </div>
            <h3 className="text-xl font-bold text-babyshopBlack mb-3">
              Grow Your Sales
            </h3>
            <p className="text-babyshopTextLight">
              Increase your revenue with our marketing tools, promotions, and
              featured product placements.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-babyshopSky/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-babyshopSky" />
            </div>
            <h3 className="text-xl font-bold text-babyshopBlack mb-3">
              Secure & Trusted
            </h3>
            <p className="text-babyshopTextLight">
              Benefit from our secure payment processing and buyer protection
              that builds customer trust.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-babyshopSky/10 rounded-lg flex items-center justify-center mb-4">
              <Package className="w-7 h-7 text-babyshopSky" />
            </div>
            <h3 className="text-xl font-bold text-babyshopBlack mb-3">
              Easy Product Management
            </h3>
            <p className="text-babyshopTextLight">
              Simple dashboard to add products, manage inventory, and track
              orders in real-time.
            </p>
          </div>

          {/* Benefit 5 */}
          <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-babyshopSky/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-7 h-7 text-babyshopSky" />
            </div>
            <h3 className="text-xl font-bold text-babyshopBlack mb-3">
              Analytics & Insights
            </h3>
            <p className="text-babyshopTextLight">
              Get detailed sales reports, customer insights, and performance
              metrics to optimize your business.
            </p>
          </div>

          {/* Benefit 6 */}
          <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-babyshopSky/10 rounded-lg flex items-center justify-center mb-4">
              <Headphones className="w-7 h-7 text-babyshopSky" />
            </div>
            <h3 className="text-xl font-bold text-babyshopBlack mb-3">
              Dedicated Support
            </h3>
            <p className="text-babyshopTextLight">
              Our vendor support team is here to help you succeed with
              onboarding, training, and ongoing assistance.
            </p>
          </div>
        </div>
      </Container>

      {/* How It Works Section */}
      <div className="bg-babyshopWhite py-16">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-babyshopBlack mb-4">
              How It Works
            </h2>
            <p className="text-lg text-babyshopTextLight max-w-2xl mx-auto">
              Getting started as a vendor is simple. Follow these easy steps to
              begin selling.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex gap-6 items-start">
                <div className="shrink-0 w-12 h-12 bg-babyshopSky text-babyshopWhite rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-babyshopBlack mb-2">
                    Submit Your Application
                  </h3>
                  <p className="text-babyshopTextLight">
                    Fill out our simple vendor application form with your
                    business details, contact information, and store
                    description. The process takes less than 5 minutes.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6 items-start">
                <div className="shrink-0 w-12 h-12 bg-babyshopSky text-babyshopWhite rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-babyshopBlack mb-2">
                    Get Approved
                  </h3>
                  <p className="text-babyshopTextLight">
                    Our team will review your application within 24-48 hours.
                    We'll verify your business information and ensure you meet
                    our quality standards.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6 items-start">
                <div className="shrink-0 w-12 h-12 bg-babyshopSky text-babyshopWhite rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-babyshopBlack mb-2">
                    Set Up Your Store
                  </h3>
                  <p className="text-babyshopTextLight">
                    Once approved, access your vendor dashboard to add products,
                    set prices, upload images, and customize your store profile.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-6 items-start">
                <div className="shrink-0 w-12 h-12 bg-babyshopSky text-babyshopWhite rounded-full flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold text-babyshopBlack mb-2">
                    Start Selling
                  </h3>
                  <p className="text-babyshopTextLight">
                    Your products will be live on Babymart! Manage orders, track
                    sales, and grow your business with our powerful vendor
                    tools.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <ApplyButton />
          </div>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-babyshopBlack mb-4">
            Vendor Dashboard Features
          </h2>
          <p className="text-lg text-babyshopTextLight max-w-2xl mx-auto">
            Everything you need to manage and grow your online baby products
            business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="flex gap-4 items-start bg-babyshopWhite p-6 rounded-lg shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-babyshopBlack mb-1">
                Product Management
              </h4>
              <p className="text-babyshopTextLight text-sm">
                Add unlimited products with multiple images, descriptions, and
                variants
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-babyshopWhite p-6 rounded-lg shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-babyshopBlack mb-1">
                Inventory Tracking
              </h4>
              <p className="text-babyshopTextLight text-sm">
                Real-time stock management with low inventory alerts
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-babyshopWhite p-6 rounded-lg shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-babyshopBlack mb-1">
                Order Management
              </h4>
              <p className="text-babyshopTextLight text-sm">
                Process orders, update shipping status, and communicate with
                customers
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-babyshopWhite p-6 rounded-lg shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-babyshopBlack mb-1">
                Sales Analytics
              </h4>
              <p className="text-babyshopTextLight text-sm">
                Detailed reports on sales, revenue, and customer behavior
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-babyshopWhite p-6 rounded-lg shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-babyshopBlack mb-1">
                Marketing Tools
              </h4>
              <p className="text-babyshopTextLight text-sm">
                Create promotions, discounts, and featured product listings
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-babyshopWhite p-6 rounded-lg shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-babyshopBlack mb-1">
                Customer Reviews
              </h4>
              <p className="text-babyshopTextLight text-sm">
                Manage and respond to customer reviews to build trust
              </p>
            </div>
          </div>
        </div>
      </Container>

      {/* Pricing Section */}
      <div className="bg-babyShopLightWhite py-16">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-babyshopBlack mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-babyshopTextLight max-w-2xl mx-auto">
              No hidden fees. Only pay when you make a sale.
            </p>
          </div>

          <div className="max-w-2xl mx-auto bg-babyshopWhite rounded-2xl shadow-lg p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-babyshopSky/10 text-babyshopSky px-4 py-2 rounded-full font-semibold mb-4">
                <DollarSign className="w-5 h-5" />
                Commission-Based
              </div>
              <h3 className="text-4xl font-bold text-babyshopBlack mb-2">
                5% Commission
              </h3>
              <p className="text-babyshopTextLight">Only on successful sales</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-babyshopBlack">
                  No monthly fees or subscription costs
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-babyshopBlack">
                  No setup or listing fees
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-babyshopBlack">
                  Secure payment processing included
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-babyshopBlack">
                  Fast payouts every week
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-babyshopBlack">
                  Full access to all vendor features
                </span>
              </div>
            </div>

            <div className="text-center">
              <ApplyButton />
            </div>
          </div>
        </Container>
      </div>

      {/* FAQ Section */}
      <Container className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-babyshopBlack mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-babyshopWhite p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-babyshopBlack mb-2">
              What products can I sell on Babymart?
            </h3>
            <p className="text-babyshopTextLight">
              You can sell any baby-related products including clothing, toys,
              feeding supplies, nursery items, strollers, car seats, and more.
              All products must be safe, high-quality, and comply with safety
              regulations.
            </p>
          </div>

          <div className="bg-babyshopWhite p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-babyshopBlack mb-2">
              How long does the approval process take?
            </h3>
            <p className="text-babyshopTextLight">
              Most vendor applications are reviewed within 24-48 hours. You'll
              receive an email notification once your application has been
              approved or if we need additional information.
            </p>
          </div>

          <div className="bg-babyshopWhite p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-babyshopBlack mb-2">
              When and how do I get paid?
            </h3>
            <p className="text-babyshopTextLight">
              Payments are processed weekly via bank transfer. You'll receive
              your earnings minus the 5% commission fee. Detailed payment
              reports are available in your vendor dashboard.
            </p>
          </div>

          <div className="bg-babyshopWhite p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-babyshopBlack mb-2">
              Can I manage my own shipping?
            </h3>
            <p className="text-babyshopTextLight">
              Yes! You have full control over your shipping methods and rates.
              You can set your own shipping policies, offer free shipping, or
              integrate with shipping carriers.
            </p>
          </div>

          <div className="bg-babyshopWhite p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-babyshopBlack mb-2">
              Is there a limit on how many products I can list?
            </h3>
            <p className="text-babyshopTextLight">
              No, there's no limit! You can list as many products as you want.
              Our platform is designed to scale with your business.
            </p>
          </div>

          <div className="bg-babyshopWhite p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-babyshopBlack mb-2">
              What support do you provide to vendors?
            </h3>
            <p className="text-babyshopTextLight">
              We offer comprehensive support including onboarding assistance,
              training materials, a dedicated vendor support team, and regular
              updates on best practices to help you succeed.
            </p>
          </div>
        </div>
      </Container>

      {/* CTA Section */}
      <div className="bg-linear-to-r from-babyshopSky to-blue-600 text-babyshopWhite py-16">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Selling?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join Babymart today and reach thousands of parents looking for
              quality baby products. Start growing your business with us!
            </p>
            <ApplyButton className="inline-flex items-center gap-2 bg-white text-babyshopSky hover:bg-gray-100 font-bold py-4 px-8 rounded-full transition-all duration-300 text-lg" />
          </div>
        </Container>
      </div>
    </div>
  );
}
