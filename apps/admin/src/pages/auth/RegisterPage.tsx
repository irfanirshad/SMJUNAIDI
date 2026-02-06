import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import useAuthStore from "@/store/useAuthStore";
import { registerSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserPlus, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
// import {
//   GoogleSignInButton,
//   GitHubSignInButton,
// } from "@/components/auth/OAuthButtons";

type FormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuthStore();

  const form = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "user",
    },
  });

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true);
      setErrorMessage("");
      await register(data);
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
      navigate("/login");
    } catch (error: unknown) {
      const errorMsg =
        (
          error as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        "Failed to register. Please try again.";
      setErrorMessage(errorMsg);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-linear-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-indigo-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md px-4 relative z-10"
      >
        <Card className="w-full bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-200/50">
          <CardHeader className="text-center space-y-3 pb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex justify-center"
            >
              <div className="bg-linear-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                <UserPlus className="h-12 w-12 text-white" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <CardTitle className="text-3xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Create Admin Account
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Register to access the administration panel
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-6">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-semibold">Error</p>
                <p>{errorMessage}</p>
              </div>
            )}
            <Form {...form}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const isValid = await form.trigger();
                  if (!isValid) {
                    return false;
                  }

                  await onSubmit(form.getValues());
                  return false;
                }}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          disabled={isLoading}
                          className="h-11 border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs mt-1" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin@example.com"
                          type="email"
                          disabled={isLoading}
                          className="h-11 border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs mt-1" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Create a strong password"
                            type={showPassword ? "text" : "password"}
                            disabled={isLoading}
                            className="h-11 border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 rounded-lg pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs mt-1" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-11 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  disabled={isLoading}
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
                    <span className="flex items-center justify-center gap-2">
                      <UserPlus size={18} />
                      Create Account
                    </span>
                  )}
                </Button>
              </form>
            </Form>

            {/* Divider */}
            {/* <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  Or sign up with
                </span>
              </div>
            </div> */}

            {/* OAuth Signup Section */}
            {/* <div className="grid grid-cols-2 gap-3">
              <GoogleSignInButton
                disabled={isLoading}
                onSuccess={() => {
                  toast({
                    title: "Registration successful",
                    description: "Your account has been created with OAuth",
                  });
                }}
              />
              <GitHubSignInButton
                disabled={isLoading}
                onSuccess={() => {
                  toast({
                    title: "Registration successful",
                    description: "Your account has been created with OAuth",
                  });
                }}
              />
            </div> */}
          </CardContent>
          <CardFooter className="justify-center border-t pt-6">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-all duration-200"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="text-center mt-6 text-sm text-gray-300"
        >
          <ShieldCheck className="inline h-4 w-4 mr-1" />
          Secure admin registration with encrypted communication
        </motion.p>
      </motion.div>
    </div>
  );
}
