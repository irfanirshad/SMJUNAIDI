import React from "react";
import Container from "@/components/common/Container";
import { Title } from "@/components/common/text";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="pt-6">
        <PageBreadcrumb currentPage="About Us" items={[]} />
      </Container>

      <Container className="py-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <Title className="text-4xl font-bold mb-4">About Babyshop</Title>
            <p className="text-gray-600 text-lg">
              Your trusted partner for premium baby and children&apos;s products
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-babyshopSky">
                Our Story
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Founded with love and care, Babyshop has been dedicated to
                providing high-quality, safe, and stylish products for babies
                and children. We understand that every parent wants the best for
                their little ones, and we&apos;re here to make that possible
                with our carefully curated selection of products.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-babyshopSky">
                Our Mission
              </h2>
              <p className="text-gray-700 leading-relaxed">
                To provide parents with peace of mind by offering only the
                highest quality, safest, and most innovative products for their
                children. We believe every child deserves the best start in
                life, and we&apos;re committed to supporting families on their
                parenting journey.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-babyshopSky">
                Why Choose Us?
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-babyshopSky rounded-full mt-2"></div>
                    <div>
                      <h3 className="font-semibold">Quality Assured</h3>
                      <p className="text-gray-600 text-sm">
                        Every product undergoes rigorous quality testing
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-babyshopSky rounded-full mt-2"></div>
                    <div>
                      <h3 className="font-semibold">Expert Curation</h3>
                      <p className="text-gray-600 text-sm">
                        Selected by parenting and child development experts
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-babyshopSky rounded-full mt-2"></div>
                    <div>
                      <h3 className="font-semibold">Fast Delivery</h3>
                      <p className="text-gray-600 text-sm">
                        Quick and secure delivery to your doorstep
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-babyshopSky rounded-full mt-2"></div>
                    <div>
                      <h3 className="font-semibold">Customer Support</h3>
                      <p className="text-gray-600 text-sm">
                        Dedicated support team ready to help
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-babyshopSky">
                Our Commitment
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We&apos;re committed to sustainability, safety, and innovation.
                All our products meet or exceed international safety standards,
                and we continuously work with manufacturers who share our values
                of environmental responsibility and ethical business practices.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default AboutPage;
