import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import AuthInitializer from "@/components/pages/auth/AuthInitializer";
import ConsoleProtection from "@/components/common/ConsoleProtection";
import Head from "next/head";
import React from "react";
import "@/lib/env-check"; // Validate environment variables

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body className={`antialiased`}>
        <ConsoleProtection />
        <AuthInitializer />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "rounded-lg shadow-lg border",
            duration: 4000,
          }}
        />
       
      </body>
    </html>
  );
}
