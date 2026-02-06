"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardFooter } from "../../../components/ui/card";
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
import { UserPlus, Eye, EyeOff, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useUserStore } from "../../../lib/store";
import { GoogleSignInButton, GitHubSignInButton } from "./OAuthButtons";

// Define the schema for the form, including terms acceptance
const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
    role: z.literal("user"),
    termsAccepted: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.termsAccepted === true, {
    message: "You must agree to the Privacy Policy and Terms of Use",
    path: ["termsAccepted"],
  });

type FormData = z.infer<typeof registerSchema>;

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const router = useRouter();
  const { register } = useUserStore();

  const form = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user",
      termsAccepted: true,
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      // Combine firstName and lastName into a single name field for registration
      const registerData = {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
        role: data.role,
      };
      await register(registerData);
      toast.success("Registration successful", {
        description: "Your account has been created",
        className: "bg-green-50 text-green-800 border-green-200",
      });
      router.push("/auth/signin");
    } catch (error: unknown) {
      console.error("Failed to register:", error);
      let message = "Failed to register new user. Please try again.";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error("Registration failed", {
        description: message,
        className: "bg-red-50 text-red-800 border-red-200",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(form.watch("password") || "");
  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };
  const getStrengthText = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
  };

  return (
    <div className="flex items-center justify-center w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full px-4"
      >
        <Card className="w-full shadow-none border-0">
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          First Name
                        </FormLabel>
                        <FormControl>
                          <motion.div
                            whileFocus={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Input
                              placeholder="First name"
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
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Last Name
                        </FormLabel>
                        <FormControl>
                          <motion.div
                            whileFocus={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Input
                              placeholder="Last name"
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
                </div>
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
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Password
                      </FormLabel>
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
                      {field.value && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">
                              Password strength:
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                passwordStrength <= 1
                                  ? "text-red-500"
                                  : passwordStrength <= 3
                                    ? "text-yellow-500"
                                    : "text-green-500"
                              }`}
                            >
                              {getStrengthText()}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                  level <= passwordStrength
                                    ? getStrengthColor()
                                    : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <div className="mt-2 space-y-1">
                            <PasswordRequirement
                              met={field.value.length >= 8}
                              text="At least 8 characters"
                            />
                            <PasswordRequirement
                              met={
                                /[a-z]/.test(field.value) &&
                                /[A-Z]/.test(field.value)
                              }
                              text="Upper & lowercase letters"
                            />
                            <PasswordRequirement
                              met={/\d/.test(field.value)}
                              text="Contains a number"
                            />
                            <PasswordRequirement
                              met={/[^a-zA-Z\d]/.test(field.value)}
                              text="Special character"
                            />
                          </div>
                        </div>
                      )}
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <motion.div
                          whileFocus={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="relative">
                            <Input
                              placeholder="••••••••"
                              type={showConfirmPassword ? "text" : "password"}
                              disabled={isLoading}
                              className="border-gray-300 focus:ring-2 focus:ring-babyshopSky focus:border-babyshopSky transition-all duration-200 pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-babyshopSky transition-colors duration-200"
                              disabled={isLoading}
                            >
                              {showConfirmPassword ? (
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
                        Creating account...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <UserPlus size={16} />
                        Sign Up
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
                      onSuccess={() => {
                        toast.success("Registration successful", {
                          description:
                            "Your account has been created with OAuth",
                          className:
                            "bg-green-50 text-green-800 border-green-200",
                        });
                      }}
                    />
                    <GitHubSignInButton
                      disabled={isLoading}
                      onSuccess={() => {
                        toast.success("Registration successful", {
                          description:
                            "Your account has been created with OAuth",
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
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="text-babyshopSky hover:text-babyshopPurple font-semibold hover:underline transition-all duration-200"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

// Helper component for password requirements
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <X className="w-3 h-3 text-gray-400" />
      )}
      <span className={met ? "text-green-600" : "text-gray-500"}>{text}</span>
    </div>
  );
}
