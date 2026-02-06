import VendorProductsList from "@/components/vendor-config/VendorProductsList";

export const metadata = {
  title: "Vendor Products - BabyMart Admin",
  description: "Manage vendor products and approvals",
};

export default function VendorProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendor Products</h1>
        <p className="text-gray-600 mt-1">
          Review and approve products submitted by vendors
        </p>
      </div>
      <VendorProductsList />
    </div>
  );
}
