"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubscriptionModalProps {
  delay?: number; // Delay in milliseconds before showing the modal
  forceShow?: boolean; // Force show the modal for testing
}

export default function SubscriptionModal({
  delay = 3000,
  forceShow = false,
}: SubscriptionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Check if user has already seen or dismissed the modal
    const hasSeenModal = localStorage.getItem("subscription_modal_seen");
    const isSubscribed = localStorage.getItem("user_subscribed");

    if (forceShow || (!hasSeenModal && !isSubscribed)) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [delay, isMounted, forceShow]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("subscription_modal_seen", "true");
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email", {
        className: "bg-red-50 text-gray-800 border-red-200",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address", {
        className: "bg-red-50 text-gray-800 border-red-200",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/subscriptions/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            source: "homepage_modal",
            preferences: {
              newsletter: true,
              promotions: true,
              newProducts: true,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Check if already subscribed
        if (data.message && data.message.includes("already subscribed")) {
          toast.info("Already subscribed", {
            description: "You're already receiving our newsletter updates.",
            className: "bg-blue-50 text-gray-800 border-blue-200",
            duration: 5000,
          });
          setIsOpen(false);
          setEmail("");
          localStorage.setItem("user_subscribed", "true");
          localStorage.setItem("subscription_email", email);
          return;
        }
        throw new Error(data.message || "Subscription failed");
      }

      localStorage.setItem("user_subscribed", "true");
      localStorage.setItem("subscription_email", email);

      toast.success("Successfully subscribed!", {
        description:
          data.message ||
          "You'll receive notifications about our latest posts.",
        className: "bg-green-50 text-gray-800 border-green-200",
        duration: 5000,
      });

      setIsOpen(false);
      setEmail("");
    } catch (error) {
      toast.error("Subscription failed", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
        className: "bg-red-50 text-gray-800 border-red-200",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="subscription-modal-wrapper">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors shadow-md"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>

                {/* Header with Gradient */}
                <div className="relative bg-linear-to-r from-babyshopSky to-babyshopPurple p-8 text-white">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                  >
                    <Bell className="h-8 w-8 text-white" />
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-center mb-2"
                  >
                    Join Our Newsletter
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center text-white/90 text-sm"
                  >
                    Get exclusive deals, new product updates, and special offers
                  </motion.p>
                </div>

                {/* Form Section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="p-8"
                >
                  <form onSubmit={handleSubscribe} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className={cn(
                          "pl-10 h-12 border-gray-300 rounded-lg",
                          "focus:ring-2 focus:ring-babyshopSky focus:border-babyshopSky",
                          "transition-all duration-200"
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className={cn(
                        "w-full h-12 font-semibold rounded-lg shadow-md",
                        "bg-linear-to-r from-babyshopSky to-babyshopPurple",
                        "hover:shadow-lg hover:scale-[1.02]",
                        "transition-all duration-200",
                        "text-white"
                      )}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Subscribing...
                        </div>
                      ) : (
                        "Subscribe Now"
                      )}
                    </Button>
                  </form>

                  <p className="mt-4 text-center text-xs text-gray-500">
                    We respect your privacy. Unsubscribe at any time.
                  </p>
                </motion.div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-babyshopPurple/10 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-babyshopSky/10 rounded-full blur-3xl -z-10" />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reusable subscription hook for use in other components
export const useSubscribe = () => {
  const [isLoading, setIsLoading] = useState(false);

  const subscribe = async (email: string, source: string = "footer") => {
    if (!email) {
      toast.error("Please enter your email", {
        className: "bg-red-50 text-gray-800 border-red-200",
      });
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address", {
        className: "bg-red-50 text-gray-800 border-red-200",
      });
      return false;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/subscriptions/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            source,
            preferences: {
              newsletter: true,
              promotions: true,
              newProducts: true,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Check if already subscribed
        if (data.message && data.message.includes("already subscribed")) {
          toast.info("Already subscribed", {
            description: "You're already receiving our newsletter updates.",
            className: "bg-blue-50 text-gray-800 border-blue-200",
            duration: 5000,
          });
          localStorage.setItem("user_subscribed", "true");
          localStorage.setItem("subscription_email", email);
          return true;
        }
        throw new Error(data.message || "Subscription failed");
      }

      localStorage.setItem("user_subscribed", "true");
      localStorage.setItem("subscription_email", email);

      toast.success("Successfully subscribed!", {
        description:
          data.message || "You'll receive our latest updates and offers.",
        className: "bg-green-50 text-gray-800 border-green-200",
        duration: 5000,
      });

      return true;
    } catch (error) {
      toast.error("Subscription failed", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
        className: "bg-red-50 text-gray-800 border-red-200",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { subscribe, isLoading };
};
