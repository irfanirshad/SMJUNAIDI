"use client";

import { useState, useEffect, Suspense } from "react";
import { ArrowLeft, Eye, EyeOff, CheckCircle, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      toast.error("Invalid reset link");
      router.push("/auth/forgot-password");
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams, router]);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.post("/auth/reset-password", {
        token,
        password,
      });

      if (response.success) {
        setIsSuccess(true);
        toast.success("Password reset successful!", {
          description: "You can now sign in with your new password",
        });
      } else {
        toast.error("Failed to reset password", {
          description:
            response.error?.message ||
            "The link may have expired. Please try again.",
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

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthHeader />
      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          {!isSuccess ? (
            <>
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-babyshopPurple/10 mb-4">
                  <Lock className="w-8 h-8 text-babyshopPurple" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  Reset Password
                </h1>
                <p className="text-lg text-gray-600">
                  Enter your new password below
                </p>
              </div>

              <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-12 text-base pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-3">
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-all ${
                                level <= passwordStrength
                                  ? passwordStrength <= 2
                                    ? "bg-red-500"
                                    : passwordStrength <= 3
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-600">
                          {passwordStrength <= 2
                            ? "Weak password"
                            : passwordStrength <= 3
                              ? "Medium strength"
                              : "Strong password"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-12 text-base pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 text-base bg-babyshopPurple hover:bg-babyshopSky transition-colors"
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
                        Resetting...
                      </span>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-10 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Password Reset!
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Your password has been successfully reset. You can now sign in
                with your new password.
              </p>
              <Button
                onClick={() => router.push("/auth/signin")}
                className="bg-babyshopSky hover:bg-babyshopPurple transition-colors"
              >
                Go to Sign In
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
