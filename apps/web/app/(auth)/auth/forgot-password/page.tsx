"use client";

import { useState } from "react";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { logo } from "@/assets/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import authApi from "@/lib/authApi";

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.post("/auth/forgot-password", { email });

      if (response.success) {
        setIsSuccess(true);
        toast.success("Reset link sent!", {
          description: "Check your email for the password reset link",
        });
      } else {
        toast.error("Failed to send reset link", {
          description: response.error?.message || "Please try again",
        });
      }
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthHeader />
      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          {!isSuccess ? (
            <>
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-babyshopSky/10 mb-4">
                  <Mail className="w-8 h-8 text-babyshopSky" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  Forgot Password?
                </h1>
                <p className="text-lg text-gray-600 max-w-md mx-auto">
                  No worries! Enter your email and we'll send you a link to
                  reset your password.
                </p>
              </div>

              <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 text-base bg-babyshopSky hover:bg-babyshopPurple transition-colors"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>
              </div>

              <p className="text-center text-base text-gray-600 mt-8">
                Remember your password?{" "}
                <Link
                  href="/auth/signin"
                  className="text-babyshopSky font-semibold hover:text-babyshopPurple transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-10 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Check Your Email
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We've sent a password reset link to{" "}
                <span className="font-semibold text-gray-900">{email}</span>
              </p>
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <p className="text-sm text-gray-600">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="text-babyshopSky font-semibold hover:text-babyshopPurple transition-colors"
                  >
                    try again
                  </button>
                </p>
              </div>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 text-babyshopSky font-semibold hover:text-babyshopPurple transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
