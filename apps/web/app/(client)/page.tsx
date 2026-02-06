import Container from "@/components/common/Container";
import Banner from "@/components/pages/home/Banner";
import CategoriesSection from "@/components/pages/home/CategoriesSection";
import HomeAdvertisement from "@/components/pages/home/HomeAdvertisement";
import BecomeVendor from "@/components/pages/home/BecomeVendor";
import ProductTypeSection from "@/components/pages/home/ProductTypeSection";
import AllProductsSection from "@/components/pages/home/AllProductsSection";
import {
  JsonLd,
  generateOrganizationSchema,
  generateWebsiteSchema,
} from "@/lib/structured-data";
import { Metadata } from "next";
import { getVendorConfig } from "@/lib/vendorConfig";
import { fetchData } from "@/lib/api";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://babymart.reactbd.com",
  },
};

interface ProductType {
  _id: string;
  name: string;
  type: string;
  displayOrder: number;
  color?: string;
  isActive: boolean;
}

interface ProductTypesResponse {
  productTypes: ProductType[];
}

export default async function Home() {
  // Fetch vendor config once at page level
  const vendorConfig = await getVendorConfig();

  // Fetch product types
  let productTypes: ProductType[] = [];
  try {
    const data = await fetchData<ProductTypesResponse>("/product-types");
    productTypes = (Array.isArray(data) ? data : data.productTypes || [])
      .filter((pt) => pt.isActive && pt.displayOrder !== 0) // Filter active and exclude displayOrder 0
      .sort((a, b) => a.displayOrder - b.displayOrder); // Sort by displayOrder
  } catch (error) {
    console.error("Error fetching product types:", error);
  }

  // Group product types by display order
  const firstTwo = productTypes.filter(
    (pt) => pt.displayOrder === 1 || pt.displayOrder === 2
  );
  const middleTwo = productTypes.filter(
    (pt) => pt.displayOrder === 3 || pt.displayOrder === 4
  );
  const remaining = productTypes.filter((pt) => pt.displayOrder > 4);

  return (
    <div>
      <JsonLd data={generateOrganizationSchema()} />
      <JsonLd data={generateWebsiteSchema()} />
      <Container className="min-h-screen flex flex-col md:flex-row py-7 gap-3">
        <CategoriesSection />
        <div className="flex-1 min-w-0">
          <Banner />

          {/* First 2 product type sections (displayOrder 1 & 2) */}
          {firstTwo.map((productType) => (
            <ProductTypeSection
              key={productType._id}
              productType={productType}
            />
          ))}

          <HomeAdvertisement />

          {/* Middle 2 product type sections (displayOrder 3 & 4) */}
          {middleTwo.map((productType) => (
            <ProductTypeSection
              key={productType._id}
              productType={productType}
            />
          ))}

          <BecomeVendor config={vendorConfig} />

          {/* Remaining product type sections (displayOrder > 4) */}
          {remaining.map((productType) => (
            <ProductTypeSection
              key={productType._id}
              productType={productType}
            />
          ))}

          {/* All Products section at the bottom */}
          <AllProductsSection />
        </div>
      </Container>
    </div>
  );
}
