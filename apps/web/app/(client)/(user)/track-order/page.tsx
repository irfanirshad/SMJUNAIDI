import React from "react";
import Container from "@/components/common/Container";
import { Title } from "@/components/common/text";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import {
  Truck,
  Search,
  Clock,
  Package2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

const TrackOrderPage = () => {
  const trackingSteps = [
    {
      status: "Order Placed",
      description: "Your order has been received",
      icon: <CheckCircle size={20} />,
      completed: true,
    },
    {
      status: "Payment Completed",
      description: "Payment received successfully",
      icon: <CheckCircle size={20} />,
      completed: true,
    },
    {
      status: "Order Packed",
      description: "We're preparing your items for shipment",
      icon: <Package2 size={20} />,
      completed: false,
      current: true,
    },
    {
      status: "Out for Delivery",
      description: "Your package is on its way to you",
      icon: <Truck size={20} />,
      completed: false,
    },
    {
      status: "Delivered",
      description: "Your order has been delivered",
      icon: <CheckCircle size={20} />,
      completed: false,
    },
  ];

  const faqItems = [
    {
      question: "How do I track my order?",
      answer:
        "You can track your order using the tracking number sent to your email, or by logging into your account and viewing your order history.",
    },
    {
      question: "When will I receive my tracking number?",
      answer:
        "You'll receive a tracking number via email within 24-48 hours after your order ships.",
    },
    {
      question: "My tracking shows 'Label Created' - what does this mean?",
      answer:
        "This means we've generated a shipping label for your package. It will be picked up by the carrier within 1-2 business days.",
    },
    {
      question: "What if my tracking hasn't updated?",
      answer:
        "Tracking information can sometimes take 24-48 hours to update. If there's still no update after this time, please contact our support team.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="pt-6">
        <PageBreadcrumb currentPage="Track Order" items={[]} />
      </Container>

      <Container className="py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Title className="text-4xl font-bold mb-4">Track Your Order</Title>
            <p className="text-gray-600 text-lg">
              Enter your order number or tracking number to see the latest
              status
            </p>
          </div>

          {/* Order Tracking Form */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Track Your Package</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Number or Tracking Number
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="e.g., BS-123456 or 1Z999AA1234567890"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopSky focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address (used for the order)
                </label>
                <input
                  type="email"
                  placeholder="your-email@example.com"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopSky focus:border-transparent"
                />
              </div>

              <button className="w-full bg-babyshopSky text-white py-3 rounded-lg hover:bg-babyshopSky/90 transition-colors font-medium">
                Track Order
              </button>
            </div>
          </div>

          {/* Sample Tracking Result */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold">Order #BS-123456</h3>
                <p className="text-gray-600">
                  Estimated delivery: Tomorrow, Dec 25
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Tracking #</div>
                <div className="font-mono text-sm">1Z999AA1234567890</div>
              </div>
            </div>

            {/* Tracking Progress */}
            <div className="space-y-4">
              {trackingSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed
                        ? "bg-green-500 text-white"
                        : step.current
                          ? "bg-babyshopSky text-white"
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium ${
                        step.completed || step.current
                          ? "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {step.status}
                    </div>
                    <div
                      className={`text-sm ${
                        step.completed || step.current
                          ? "text-gray-600"
                          : "text-gray-400"
                      }`}
                    >
                      {step.description}
                    </div>
                    {step.current && (
                      <div className="text-sm text-babyshopSky font-medium mt-1">
                        Current Status
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <Package2 className="text-babyshopSky mx-auto mb-3" size={32} />
              <h3 className="font-semibold mb-2">View All Orders</h3>
              <p className="text-gray-600 text-sm mb-4">
                See all your recent orders and their status
              </p>
              <Link
                href="/user/orders"
                className="bg-babyshopSky text-white px-4 py-2 rounded-lg text-sm hover:bg-babyshopSky/90 transition-colors"
              >
                View Orders
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <AlertCircle className="text-orange-500 mx-auto mb-3" size={32} />
              <h3 className="font-semibold mb-2">Report an Issue</h3>
              <p className="text-gray-600 text-sm mb-4">
                Package missing or damaged? Let us know
              </p>
              <Link
                href="/help/contact"
                className="border border-babyshopSky text-babyshopSky px-4 py-2 rounded-lg text-sm hover:bg-babyshopSky hover:text-white transition-colors"
              >
                Contact Support
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <Clock className="text-green-500 mx-auto mb-3" size={32} />
              <h3 className="font-semibold mb-2">Delivery Updates</h3>
              <p className="text-gray-600 text-sm mb-4">
                Get SMS notifications for delivery updates
              </p>
              <button className="border border-babyshopSky text-babyshopSky px-4 py-2 rounded-lg text-sm hover:bg-babyshopSky hover:text-white transition-colors">
                Enable SMS
              </button>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6">
              Shipping Information
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Delivery Timeframes
                </h3>
                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between">
                    <span>Standard Shipping:</span>
                    <span>3-5 business days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Express Shipping:</span>
                    <span>1-2 business days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overnight Shipping:</span>
                    <span>Next business day</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Carrier Partners</h3>
                <div className="space-y-2 text-gray-700">
                  <div>• UPS - Most domestic shipments</div>
                  <div>• FedEx - Express and overnight</div>
                  <div>• USPS - Small packages and PO boxes</div>
                  <div>• DHL - International shipments</div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                >
                  <h3 className="font-semibold text-lg mb-2">
                    {item.question}
                  </h3>
                  <p className="text-gray-700">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Need More Help */}
          <div className="bg-babyshopSky/10 rounded-lg p-8 mt-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Need More Help?</h3>
            <p className="text-gray-600 mb-6">
              Can&apos;t find your order or have questions about tracking? Our
              support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/help/contact"
                className="bg-babyshopSky text-white px-6 py-3 rounded-lg hover:bg-babyshopSky/90 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="/help"
                className="border border-babyshopSky text-babyshopSky px-6 py-3 rounded-lg hover:bg-babyshopSky hover:text-white transition-colors"
              >
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default TrackOrderPage;
