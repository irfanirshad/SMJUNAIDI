import ShopPage from "@/components/pages/shop/ShopPageClient";
import { fetchData } from "@/lib/api";
import { Brand, Category } from "@babyshop/types";

interface CategoriesResponse {
  categories: Category[];
}

const ShopPageServer = async () => {
  let brands: Brand[] = [];
  let categories: Category[] = [];
  let error: string | null = null;

  try {
    brands = await fetchData<Brand[]>("/brands");
  } catch (err) {
    console.error("Failed to fetch brands during build:", err);
    // Continue with empty brands array
  }

  try {
    const data = await fetchData<CategoriesResponse>("/categories");
    categories = data.categories;
  } catch (err) {
    error = err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Failed to fetch categories during build:", error);
    // Continue with empty categories array
  }

  return (
    <div>
      <ShopPage categories={categories} brands={brands} />
    </div>
  );
};

export default ShopPageServer;
