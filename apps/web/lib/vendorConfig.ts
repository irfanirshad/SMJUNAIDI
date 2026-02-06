import { fetchWithConfig } from "./config";

export interface VendorConfig {
  vendorEnabled: boolean;
  allowVendorRegistration: boolean;
  requireApproval: boolean;
  defaultCommissionRate: number;
  minOrderAmount: number;
  maxProductsPerVendor: number;
}

let cachedConfig: VendorConfig | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 10 * 1000; // 10 seconds - shorter cache for faster config updates

export async function getVendorConfig(): Promise<VendorConfig> {
  const now = Date.now();

  // Return cached config if still valid
  if (cachedConfig && now - lastFetchTime < CACHE_DURATION) {
    return cachedConfig;
  }

  try {
    const data = await fetchWithConfig<{
      success?: boolean;
      data?: VendorConfig;
    }>("/vendors/config", {
      cache: "no-store",
      next: { revalidate: 0 }, // Disable Next.js caching
    });

    cachedConfig = data.data || (data as unknown as VendorConfig);
    lastFetchTime = now;

    return cachedConfig;
  } catch (error) {
    console.error("❌ Failed to fetch vendor config:", error);
  }

  // Return default config with vendors DISABLED if fetch fails
  console.warn("⚠️ Using default vendor config (DISABLED)");
  return {
    vendorEnabled: false,
    allowVendorRegistration: false,
    requireApproval: true,
    defaultCommissionRate: 10,
    minOrderAmount: 0,
    maxProductsPerVendor: 100,
  };
}

export function isVendorSystemEnabled(config: VendorConfig): boolean {
  return config.vendorEnabled;
}

export function canRegisterAsVendor(config: VendorConfig): boolean {
  return config.vendorEnabled && config.allowVendorRegistration;
}
