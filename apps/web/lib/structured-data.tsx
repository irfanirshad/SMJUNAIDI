// Structured data for SEO (JSON-LD)

export interface Product {
  name: string;
  description: string;
  price: number;
  images?: string[];
  brand?: string;
  sku?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  rating?: number;
  reviewCount?: number;
}

export function generateProductSchema(product: Product, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images || [],
    sku: product.sku || "",
    brand: {
      "@type": "Brand",
      name: product.brand || "BabyMart",
    },
    offers: {
      "@type": "Offer",
      url: `https://babymart.reactbd.com${url}`,
      priceCurrency: "INR",
      price: product.price,
      availability: `https://schema.org/${product.availability || "InStock"}`,
      seller: {
        "@type": "Organization",
        name: "BabyMart",
      },
    },
    aggregateRating: product.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.reviewCount || 0,
        }
      : undefined,
  };
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BabyMart",
    url: "https://babymart.reactbd.com",
    logo: "https://babymart.reactbd.com/logo.png",
    description: "Premium baby products and essentials online shopping",
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: "support@babymart.reactbd.com",
    },
    sameAs: [
      "https://www.facebook.com/babymart",
      "https://www.instagram.com/babymart",
      "https://twitter.com/babymart",
    ],
  };
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BabyMart",
    url: "https://babymart.reactbd.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://babymart.reactbd.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://babymart.reactbd.com${item.url}`,
    })),
  };
}

// Helper component to inject JSON-LD
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
