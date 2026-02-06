"use client";

import SignUpForm from "@/components/pages/auth/SignUpForm";
import { ArrowLeft } from "lucide-react";
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

const SignUpPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AuthHeader />
      <main className="flex items-center justify-center px-4 py-5">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Create your account
            </h1>
            <p className="text-lg text-gray-600">
              Join Babymart and start shopping
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-10">
            <SignUpForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUpPage;
