import type { Metadata } from "next";
import React from "react";
import Header from "@/components/common/header/Header";
import Footer from "@/components/common/footer/Footer";
import SubscriptionModal from "@/components/common/SubscriptionModal";

// Server-side function to fetch logo with proper error handling
async function fetchLogo(): Promise<string | null> {
  try {
    // Use API_ENDPOINT for server-side, fallback to NEXT_PUBLIC_API_URL
    const apiUrl =
      process.env.API_ENDPOINT ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";

    const response = await fetch(`${apiUrl}/api/website-icons/key/main_logo`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.imageUrl) {
        return data.data.imageUrl;
      }
    }
  } catch (error) {
    // Silently fail and use default logo - don't crash the page
    console.error("Error fetching logo (using default):", error);
  }
  return null;
}

export const metadata: Metadata = {
  metadataBase: new URL("https://babymart.reactbd.com"),
  title: {
    default: "Salman Junaidi - Premium Attars: Timeless Fragrance, Pure Elegance Online Shopping",
    template: "%s | BabyMart",
  },
  description:
    "Shop premium baby products, strollers, toys, clothing, feeding essentials & more at BabyMart. Trusted brands, safe products, fast delivery. Your one-stop shop for all baby needs.",
  keywords: [
    "baby products",
    "baby essentials",
    "baby strollers",
    "baby toys",
    "baby clothing",
    "baby feeding",
    "baby care",
    "online baby shop",
    "babymart",
    "baby gear",
    "infant products",
    "newborn essentials",
  ],
  authors: [{ name: "BabyMart Team" }],
  creator: "BabyMart",
  publisher: "BabyMart",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://babymart.reactbd.com",
    siteName: "BabyMart",
    title: "Salman Junaidi - Premium Attars: Timeless Fragrance, Pure Elegance Online Shopping",
    description:
      "Shop premium baby products, strollers, toys, clothing, feeding essentials & more. Trusted brands, safe products, fast delivery.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "BabyMart - Your trusted baby products store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Salman Junaidi - Premium Attars: Timeless Fragrance, Pure Elegance",
    description:
      "Shop premium baby products with trusted brands and fast delivery.",
    images: ["/og-image.jpg"],
    creator: "@babymart",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-site-verification-code",
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  alternates: {
    canonical: "https://babymart.reactbd.com",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const logoUrl = await fetchLogo();

  return (
    <>
      <Header logoUrl={logoUrl} />
      <div className="bg-babyshopLightBg min-h-screen pb-20">{children}</div>
      <Footer />
      {/* Set forceShow={true} temporarily to test the modal */}
      <SubscriptionModal delay={3000} />
    </>
  );
}
