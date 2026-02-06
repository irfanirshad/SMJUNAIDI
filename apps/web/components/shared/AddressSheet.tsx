"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MapPin, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const addressSchema = z.object({
  country: z.string().min(2, "Country is required"),
  state: z.string().optional(),
  city: z.string().min(2, "City is required"),
  street: z.string().min(3, "Street address is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  isDefault: z.boolean(),
});

export type AddressFormData = z.infer<typeof addressSchema>;

interface AddressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddressFormData) => Promise<void>;
  editingAddress?: AddressFormData | null;
  title?: string;
  description?: string;
}

export function AddressSheet({
  open,
  onOpenChange,
  onSubmit,
  editingAddress,
  title = "Add New Address",
  description = "Fill in your delivery address details",
}: AddressSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [openCountry, setOpenCountry] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");

  // Get available countries from environment variable
  const availableCountries = process.env.NEXT_PUBLIC_AVAILABLE_COUNTRIES
    ? JSON.parse(process.env.NEXT_PUBLIC_AVAILABLE_COUNTRIES)
    : [];

  // Get filtered countries based on search
  const filteredCountries = countrySearchQuery
    ? availableCountries.filter((country: string) =>
        country.toLowerCase().includes(countrySearchQuery.toLowerCase())
      )
    : availableCountries;

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      country: "",
      state: "",
      city: "",
      street: "",
      postalCode: "",
      isDefault: false,
    },
  });

  // Update form when editing address changes
  useEffect(() => {
    if (editingAddress) {
      form.reset(editingAddress);
    } else {
      form.reset({
        country: "",
        state: "",
        city: "",
        street: "",
        postalCode: "",
        isDefault: false,
      });
    }
  }, [editingAddress, form]);

  const handleSubmit = async (data: AddressFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Address submission error:", error);
      toast.error("Failed to save address");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            {title}
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5 mt-6 p-5"
          >
            {/* Country */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Country *</FormLabel>
                  <Popover open={openCountry} onOpenChange={setOpenCountry}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          type="button"
                          className={cn(
                            "w-full justify-between border-2 hover:bg-gray-50",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value || "Select country..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-100 p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search country..."
                          className="h-9"
                          onValueChange={setCountrySearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            {filteredCountries.map((country: string) => (
                              <CommandItem
                                key={country}
                                value={country}
                                onSelect={(value) => {
                                  form.setValue("country", country);
                                  setCountrySearchQuery("");
                                  setOpenCountry(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    country === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {country}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* State/Province */}
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., California, Dhaka, Maharashtra"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Los Angeles, Dhaka, Mumbai"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Street Address */}
            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 123 Main Street, Apt 4B"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Postal Code */}
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 10001, SW1A 1AA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Default Address Checkbox */}
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium">
                      Set as default address
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Use this address as your primary delivery location
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <SheetFooter className="gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAddress ? "Update Address" : "Save Address"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
