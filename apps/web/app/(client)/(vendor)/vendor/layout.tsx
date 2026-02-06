import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import VendorDashboardLayout from "@/components/vendor/VendorDashboardLayout";

export const metadata = {
  title: "Vendor Dashboard - BabyMart",
  description: "Manage your vendor account and products",
};

async function checkVendorAccess() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    // Check if user is authenticated
    const userResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || process.env.API_ENDPOINT}/api/auth/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!userResponse.ok) {
      return null;
    }

    const userData = await userResponse.json();

    if (!userData || !userData._id) {
      return null;
    }

    // Check vendor status
    const vendorResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || process.env.API_ENDPOINT}/api/vendors/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!vendorResponse.ok) {
      return { needsApplication: true };
    }

    const vendorData = await vendorResponse.json();

    // API returns { success: true, data: vendor }
    const vendor = vendorData.data || vendorData.vendor;

    if (!vendor) {
      return { needsApplication: true };
    }

    if (vendor.status !== "approved") {
      return {
        needsApplication: false,
        status: vendor.status,
      };
    }

    return {
      approved: true,
      vendor: vendor,
    };
  } catch (error) {
    console.error("Error checking vendor access:", error);
    return null;
  }
}

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const vendorAccess = await checkVendorAccess();

  if (!vendorAccess) {
    redirect("/auth/signin?redirect=/vendor");
  }

  if (vendorAccess.needsApplication) {
    redirect("/become-vendor");
  }

  if (vendorAccess.status === "pending" || vendorAccess.status === "rejected") {
    redirect("/vendor-guide");
  }

  return <VendorDashboardLayout>{children}</VendorDashboardLayout>;
}
