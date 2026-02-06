import Container from "@/components/common/Container";
import Link from "next/link";
import { cookies } from "next/headers";
import { LogIn, ShieldAlert } from "lucide-react";
import VendorApplicationForm from "./VendorApplicationForm";
import VendorDisabled from "@/components/vendor/VendorDisabled";
import { getVendorConfig, canRegisterAsVendor } from "@/lib/vendorConfig";

export default async function BecomeVendorPage() {
  // Check vendor system configuration
  const vendorConfig = await getVendorConfig();
  const canRegister = canRegisterAsVendor(vendorConfig);

  // If vendor system is disabled or registration not allowed, show disabled message
  if (!canRegister) {
    return <VendorDisabled />;
  }

  // Check if user is authenticated by checking for auth_token cookie
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token");
  const isAuthenticated = !!authToken;

  // If user is not authenticated, show login required message
  if (!isAuthenticated) {
    return (
      <div className="bg-babyshopLightBg min-h-screen py-20">
        <Container>
          <div className="max-w-2xl mx-auto bg-babyshopWhite rounded-xl shadow-lg overflow-hidden">
            <div className="bg-linear-to-r from-gray-900 to-gray-800 px-8 py-12 text-babyshopWhite text-center">
              <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <h1 className="text-3xl font-bold mb-2">
                Authentication Required
              </h1>
              <p className="text-gray-300">
                Please sign in to apply as a vendor
              </p>
            </div>

            <div className="p-8 md:p-12 text-center">
              <h2 className="text-2xl font-bold text-babyshopBlack mb-4">
                Become a Vendor on Babymart
              </h2>
              <p className="text-babyshopTextLight mb-8">
                To apply as a vendor and start selling your baby products on our
                platform, you need to be signed in to your account. If you don't
                have an account yet, you can create one for free.
              </p>

              <div className="space-y-4">
                <Link
                  href="/auth/signin?redirect=/become-vendor"
                  className="inline-flex items-center gap-2 bg-babyshopSky hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-full transition-all duration-300"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In to Apply
                </Link>

                <p className="text-sm text-babyshopTextLight">
                  Don't have an account?{" "}
                  <Link
                    href="/auth/signup?redirect=/become-vendor"
                    className="text-babyshopSky hover:underline font-semibold"
                  >
                    Create one here
                  </Link>
                </p>
              </div>

              <div className="mt-12 pt-8 border-t">
                <p className="text-babyshopTextLight mb-4">
                  Want to learn more about becoming a vendor?
                </p>
                <Link
                  href="/vendor-guide"
                  className="inline-flex items-center gap-2 text-babyshopSky hover:underline font-semibold"
                >
                  View Vendor Guide →
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // If authenticated, show the vendor application form
  return <VendorApplicationForm />;
}
