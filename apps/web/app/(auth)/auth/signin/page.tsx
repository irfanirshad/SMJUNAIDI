"use client";

import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import SignInForm from "@/components/pages/auth/SignInForm";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { logo } from "@/assets/image";

function AuthHeader() {
  const router = useRouter();

  return (
    <header className="w-full bg-babyshopWhite border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-babyshopSky transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src={logo}
              alt="Babymart Logo"
              className="h-8 w-auto"
              priority
            />
          </Link>

          <div className="w-20" />
        </div>
      </div>
    </header>
  );
}

function SignInContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AuthHeader />
      <main className="flex items-center justify-center px-4 py-5">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Welcome back
            </h1>
            <p className="text-lg text-gray-600">
              Sign in to your Babymart account
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-10">
            <SignInForm />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-babyshopSky mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
