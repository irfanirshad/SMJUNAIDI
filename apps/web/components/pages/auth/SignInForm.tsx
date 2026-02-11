"use client";

import { LogIn, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserStore } from "../../../lib/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
} from "../../../components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { Checkbox } from "../../../components/ui/checkbox";
import { Button } from "../../../components/ui/button";
import authApi from "../../../lib/authApi";
import { GoogleSignInButton } from "./OAuthButtons";

// Define the schema for the login form
const loginSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    termsAccepted: z.boolean(),
  })
  .refine((data) => data.termsAccepted === true, {
    message: "You must accept the terms and privacy policy",
    path: ["termsAccepted"],
  });

type LoginFormData = z.infer<typeof loginSchema>;

const SignInForm = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthToken, updateUser } = useUserStore();

  // Get redirect parameter from URL
  const redirectTo = searchParams.get("redirect") || "/user/profile";

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      termsAccepted: true,
    },
  });

  const login = async (data: LoginFormData): Promise<boolean> => {
    try {
      const response = await authApi.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      if (response.success && response.data) {
        const { token, ...userData } = response.data as {
          token: string;
          [key: string]: any;
        };
        setAuthToken(token);
        updateUser(userData);
        return true;
      } else {
        toast.error("Login failed", {
          description: response.error?.message || "Invalid email or password",
          className: "bg-red-50 text-gray-800 border-red-200",
          duration: 7000,
        });
        return false;
      }
    } catch {
      toast.error("Login failed", {
        description: "An unexpected error occurred. Please try again later.",
        className: "bg-red-50 text-gray-800 border-red-200",
        duration: 7000,
      });
      return false;
    }
  };

  const onSubmit: (data: LoginFormData) => Promise<void> = async (data) => {
    setIsLoading(true);
    const success = await login(data);
    if (success) {
      toast.success("Login successful", {
        description: "You have been signed in",
        className: "bg-green-50 text-gray-800 border-green-200",
        duration: 5000,
      });
      router.push(redirectTo);
    }
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full px-4"
    >
      <Card className="w-full shadow-none border-0">
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Email
                    </FormLabel>
                    <FormControl>
                      <motion.div
                        whileFocus={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Input
                          placeholder="you@example.com"
                          type="email"
                          disabled={isLoading}
                          className="border-gray-300 focus:ring-2 focus:ring-babyshopSky focus:border-babyshopSky transition-all duration-200"
                          {...field}
                        />
                      </motion.div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Password
                      </FormLabel>
                      <Link
                        href="/auth/forgot-password"
                        className="text-xs text-babyshopSky hover:text-babyshopPurple hover:underline transition-colors duration-200"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <motion.div
                        whileFocus={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="relative">
                          <Input
                            placeholder="••••••••"
                            type={showPassword ? "text" : "password"}
                            disabled={isLoading}
                            className="border-gray-300 focus:ring-2 focus:ring-babyshopSky focus:border-babyshopSky transition-all duration-200 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-babyshopSky transition-colors duration-200"
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                        className="border-gray-300 data-[state=checked]:bg-babyshopSky data-[state=checked]:border-babyshopSky"
                      />
                    </FormControl>
                    <FormLabel className="text-sm text-gray-500 font-normal">
                      I agree with the{" "}
                      <Link
                        href="/privacy"
                        className="text-babyshopSky hover:text-babyshopPurple hover:underline"
                      >
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/terms"
                        className="text-babyshopSky hover:text-babyshopPurple hover:underline"
                      >
                        Terms of Use
                      </Link>
                    </FormLabel>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-linear-to-r from-babyshopSky to-babyshopPurple hover:from-babyshopPurple hover:to-babyshopSky text-white font-semibold h-12 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  disabled={isLoading || !form.watch("termsAccepted")}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
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
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn size={16} />
                      Sign In
                    </span>
                  )}
                </Button>
              </motion.div>

              {/* OAuth Login Section */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <GoogleSignInButton
                    disabled={isLoading}
                    redirectTo={redirectTo}
                    onSuccess={() => {
                      toast.success("Login successful", {
                        description: "You have been signed in with OAuth",
                        className:
                          "bg-green-50 text-green-800 border-green-200",
                      });
                    }}
                  />
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center border-t pt-6">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-babyshopSky hover:text-babyshopPurple font-semibold hover:underline transition-all duration-200"
            >
              Sign up now
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default SignInForm;
