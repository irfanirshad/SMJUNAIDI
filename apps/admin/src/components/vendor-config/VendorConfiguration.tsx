import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, Loader2 } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { Skeleton } from "@/components/ui/skeleton";

const vendorConfigSchema = z.object({
  vendorEnabled: z.boolean(),
  defaultCommissionRate: z.number().min(0).max(100),
  minOrderAmount: z.number().min(0),
  allowVendorRegistration: z.boolean(),
  requireApproval: z.boolean(),
  maxProductsPerVendor: z.number().min(0).optional(),
});

type VendorConfigFormValues = z.infer<typeof vendorConfigSchema>;

const VendorConfiguration = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { token } = useAuthStore();
  const { can } = usePermissions();
  const { toast } = useToast();

  const form = useForm<VendorConfigFormValues>({
    resolver: zodResolver(vendorConfigSchema),
    defaultValues: {
      vendorEnabled: true,
      defaultCommissionRate: 15,
      minOrderAmount: 0,
      allowVendorRegistration: true,
      requireApproval: true,
      maxProductsPerVendor: 1000,
    },
  });

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(
        `${import.meta.env.VITE_NEXT_PUBLIC_API_URL}/api/vendors/config`,
        config
      );

      if (response.data.success && response.data.data) {
        form.reset(response.data.data);
      }
    } catch (error: any) {
      // If config doesn't exist yet, use defaults
      if (error.response?.status !== 404) {
        console.error("Error fetching vendor configuration:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load vendor configuration",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: VendorConfigFormValues) => {
    if (!can("manage_vendors")) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to update vendor configuration",
      });
      return;
    }

    setSaving(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.put(
        `${import.meta.env.VITE_NEXT_PUBLIC_API_URL}/api/vendors/config`,
        data,
        config
      );

      toast({
        title: "Success",
        description: "Vendor configuration updated successfully",
      });
    } catch (error) {
      console.error("Error updating vendor configuration:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update vendor configuration",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={20} />
            <span>Vendor System Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure global settings for the vendor management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* System Settings Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">System Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Control the overall vendor system functionality
                  </p>
                </div>
                <Separator />

                <FormField
                  control={form.control}
                  name="vendorEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Enable Vendor System
                        </FormLabel>
                        <FormDescription>
                          Turn on/off the entire vendor functionality across the
                          platform
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowVendorRegistration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Allow Vendor Registration
                        </FormLabel>
                        <FormDescription>
                          Allow new users to apply as vendors
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requireApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Require Admin Approval
                        </FormLabel>
                        <FormDescription>
                          New vendor applications require admin approval before
                          activation
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Financial Settings Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Financial Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure commission rates and order minimums
                  </p>
                </div>
                <Separator />

                <FormField
                  control={form.control}
                  name="defaultCommissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Commission Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="15"
                          min="0"
                          max="100"
                          step="0.1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Default commission percentage taken from vendor sales
                        (0-100%)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minOrderAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Order Amount (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum order amount required for vendor products
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Vendor Limits Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Vendor Limits</h3>
                  <p className="text-sm text-muted-foreground">
                    Set limits for vendor accounts
                  </p>
                </div>
                <Separator />

                <FormField
                  control={form.control}
                  name="maxProductsPerVendor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Products Per Vendor</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1000"
                          min="0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of products a vendor can list (leave
                        empty for unlimited)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={saving}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorConfiguration;
