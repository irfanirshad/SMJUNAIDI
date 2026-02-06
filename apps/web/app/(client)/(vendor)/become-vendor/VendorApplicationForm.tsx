"use client";

import Container from "@/components/common/Container";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle, Clock, XCircle, Store } from "lucide-react";
import { useUserStore } from "@/lib/store";
import Link from "next/link";

interface VendorFormData {
  storeName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface VendorStatus {
  _id: string;
  status: "pending" | "approved" | "rejected";
  storeName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  createdAt: string;
}

export default function VendorApplicationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [vendorStatus, setVendorStatus] = useState<VendorStatus | null>(null);
  const { authUser: user, auth_token } = useUserStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VendorFormData>({
    defaultValues: {
      contactEmail: user?.email || "",
    },
  });

  // Fetch vendor status on component mount
  useEffect(() => {
    const fetchVendorStatus = async () => {
      if (!user || !auth_token) {
        setCheckingStatus(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/me`,
          {
            headers: {
              Authorization: `Bearer ${auth_token}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          setVendorStatus(result.data);

          // If rejected, pre-fill form with previous data
          if (result.data.status === "rejected") {
            reset({
              storeName: result.data.storeName,
              description: result.data.description,
              contactEmail: result.data.contactEmail,
              contactPhone: result.data.contactPhone,
              street: result.data.address.street,
              city: result.data.address.city,
              state: result.data.address.state,
              country: result.data.address.country,
              postalCode: result.data.address.postalCode,
            });
          }
        } else if (response.status === 404) {
          // No vendor application found - this is fine
          setVendorStatus(null);
        }
      } catch (error) {
        console.error("Error fetching vendor status:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    fetchVendorStatus();
  }, [user, auth_token, reset]);

  const onSubmit = async (data: VendorFormData) => {
    if (!user || !auth_token) {
      toast.error("Please login to apply as a vendor");
      router.push("/auth/signin?redirect=/become-vendor");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        storeName: data.storeName,
        description: data.description,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode,
        },
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendors`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error(
          "Server returned an invalid response. Please try again later."
        );
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      toast.success("Application Submitted Successfully!", {
        description:
          "Your vendor application is now pending approval. We'll notify you once it's reviewed.",
        duration: 6000,
      });

      // Refresh the page to show the new status
      window.location.reload();
    } catch (error: any) {
      console.error("Vendor registration error:", error);
      toast.error("Application Failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit application. Please try again.",
        duration: 7000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking vendor status
  if (checkingStatus) {
    return (
      <div className="bg-babyshopLightBg min-h-screen py-10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-babyshopSky" />
          <p className="text-babyshopTextLight">
            Checking your vendor status...
          </p>
        </div>
      </div>
    );
  }

  // If user is already an approved vendor
  if (vendorStatus?.status === "approved") {
    return (
      <div className="bg-babyshopLightBg min-h-screen py-10">
        <Container>
          <div className="max-w-2xl mx-auto bg-babyshopWhite rounded-xl shadow-xs overflow-hidden">
            <div className="bg-green-600 px-8 py-6 text-babyshopWhite text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-2xl font-bold">You're Already a Vendor!</h1>
              <p className="text-green-100 mt-2">
                Your vendor account is active and approved
              </p>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Store Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">
                      Store Name:
                    </span>
                    <p className="text-gray-900">{vendorStatus.storeName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Contact Email:
                    </span>
                    <p className="text-gray-900">{vendorStatus.contactEmail}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Contact Phone:
                    </span>
                    <p className="text-gray-900">{vendorStatus.contactPhone}</p>
                  </div>
                </div>
              </div>

              <Link
                href="/vendor"
                className="block w-full bg-babyshopSky hover:bg-opacity-90 text-babyshopWhite font-bold py-3 px-4 rounded-md transition duration-300 text-center"
              >
                Go to Vendor Dashboard
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // If application is pending
  if (vendorStatus?.status === "pending") {
    return (
      <div className="bg-babyshopLightBg min-h-screen py-10">
        <Container>
          <div className="max-w-2xl mx-auto bg-babyshopWhite rounded-xl shadow-xs overflow-hidden">
            <div className="bg-yellow-500 px-8 py-6 text-babyshopWhite text-center">
              <Clock className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-2xl font-bold">Application Under Review</h1>
              <p className="text-yellow-100 mt-2">
                Your vendor application is currently being reviewed
              </p>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-2">What's Next?</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Our team is reviewing your application. This typically takes
                  1-3 business days. We'll send you an email notification once a
                  decision has been made.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Submitted Application
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">
                      Store Name:
                    </span>
                    <p className="text-gray-900">{vendorStatus.storeName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Description:
                    </span>
                    <p className="text-gray-900">{vendorStatus.description}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Contact Email:
                    </span>
                    <p className="text-gray-900">{vendorStatus.contactEmail}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Contact Phone:
                    </span>
                    <p className="text-gray-900">{vendorStatus.contactPhone}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Submitted On:
                    </span>
                    <p className="text-gray-900">
                      {new Date(vendorStatus.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/user/profile"
                className="block w-full bg-gray-600 hover:bg-gray-700 text-babyshopWhite font-bold py-3 px-4 rounded-md transition duration-300 text-center"
              >
                Back to Profile
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // If application was rejected, show form with message
  const isRejected = vendorStatus?.status === "rejected";

  return (
    <div className="bg-babyshopLightBg min-h-screen py-10">
      <Container>
        <div className="max-w-3xl mx-auto bg-babyshopWhite rounded-xl shadow-xs overflow-hidden">
          {isRejected && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-0">
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">
                    Previous Application Rejected
                  </h3>
                  <p className="text-sm text-red-700">
                    Your previous vendor application was not approved. You can
                    submit a new application with updated information. Please
                    ensure all details are accurate and complete.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-gray-900 px-8 py-6 text-babyshopWhite text-center">
            <h1 className="text-2xl font-bold">
              {isRejected ? "Reapply as Vendor" : "Vendor Registration"}
            </h1>
            <p className="text-gray-300 mt-2">
              {isRejected
                ? "Submit a new application with updated information"
                : "Start selling your products on Babymart today"}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Store Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Name</label>
                  <input
                    {...register("storeName", {
                      required: "Store name is required",
                    })}
                    disabled={loading}
                    className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="My Baby Shop"
                  />
                  {errors.storeName && (
                    <p className="text-red-500 text-xs">
                      {errors.storeName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Email</label>
                  <input
                    {...register("contactEmail", {
                      required: "Contact email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    disabled={loading}
                    className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="contact@myshop.com"
                  />
                  {errors.contactEmail && (
                    <p className="text-red-500 text-xs">
                      {errors.contactEmail.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  {...register("description", {
                    required: "Description is required",
                  })}
                  disabled={loading}
                  className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 min-h-25 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Tell us about your store and products..."
                ></textarea>
                {errors.description && (
                  <p className="text-red-500 text-xs">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Phone</label>
                <input
                  {...register("contactPhone", {
                    required: "Phone number is required",
                  })}
                  disabled={loading}
                  className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="+1 234 567 890"
                />
                {errors.contactPhone && (
                  <p className="text-red-500 text-xs">
                    {errors.contactPhone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Business Address
              </h3>

              <div className="space-y-2">
                <label className="text-sm font-medium">Street Address</label>
                <input
                  {...register("street", { required: "Street is required" })}
                  disabled={loading}
                  className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="123 Business Rd"
                />
                {errors.street && (
                  <p className="text-red-500 text-xs">
                    {errors.street.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <input
                    {...register("city", { required: "City is required" })}
                    disabled={loading}
                    className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs">
                      {errors.city.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">State/Province</label>
                  <input
                    {...register("state", { required: "State is required" })}
                    disabled={loading}
                    className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.state && (
                    <p className="text-red-500 text-xs">
                      {errors.state.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Postal Code</label>
                  <input
                    {...register("postalCode", {
                      required: "Postal Code is required",
                    })}
                    disabled={loading}
                    className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.postalCode && (
                    <p className="text-red-500 text-xs">
                      {errors.postalCode.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <input
                    {...register("country", {
                      required: "Country is required",
                    })}
                    disabled={loading}
                    className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.country && (
                    <p className="text-red-500 text-xs">
                      {errors.country.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-babyshopSky hover:bg-opacity-90 text-babyshopWhite font-bold py-3 px-4 rounded-md transition duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </Container>
    </div>
  );
}
