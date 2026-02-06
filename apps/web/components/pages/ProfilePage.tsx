"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useUserStore, useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  User,
  ShoppingCart,
  Package,
  Save,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  LogOut,
  Mail,
  Shield,
  Upload,
} from "lucide-react";
import authApi from "@/lib/authApi";
import Link from "next/link";
import Image from "next/image";
import { OAuthUserSection } from "./auth/OAuthUserSection";
import Container from "../common/Container";
import { AddressSheet, type AddressFormData } from "../shared/AddressSheet";
import { getUserOrders, Order } from "@/lib/orderApi";
import type { Address as AddressType, User as UserType } from "@babyshop/types";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof updateProfileSchema>;
type PasswordFormData = z.infer<typeof changePasswordSchema>;
type Address = AddressType;
type AddressWithOptionalId = Omit<Address, "_id"> & { _id?: string };

const getStatusColor = (status: string) => {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    address_confirmed: "bg-blue-100 text-blue-800 border-blue-300",
    confirmed: "bg-blue-100 text-blue-800 border-blue-300",
    processing: "bg-purple-100 text-purple-800 border-purple-300",
    packed: "bg-indigo-100 text-indigo-800 border-indigo-300",
    shipped: "bg-cyan-100 text-cyan-800 border-cyan-300",
    delivering: "bg-orange-100 text-orange-800 border-orange-300",
    delivered: "bg-green-100 text-green-800 border-green-300",
    completed: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
  };
  return statusColors[status] || "bg-gray-100 text-gray-800 border-gray-300";
};

const ProfilePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAddressSidebarOpen, setIsAddressSidebarOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false);
  const [isPasswordSidebarOpen, setIsPasswordSidebarOpen] = useState(false);
  const router = useRouter();
  const { authUser, updateUser, logoutUser } = useUserStore();
  const { cartItems, syncCartFromServer } = useCartStore();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: authUser?.name || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form defaults when authUser changes
  useEffect(() => {
    if (authUser) {
      profileForm.reset({
        name: authUser.name,
      });
    }
  }, [authUser, profileForm]);

  // Fetch recent orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!authUser) return;

      setIsLoadingOrders(true);
      try {
        const auth_token = localStorage.getItem("auth_token");
        if (auth_token) {
          const orders = await getUserOrders(auth_token);
          // Get first 10 orders
          setRecentOrders(orders.slice(0, 10));
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [authUser]);

  // Fetch cart items
  useEffect(() => {
    const fetchCart = async () => {
      if (!authUser) return;

      try {
        await syncCartFromServer();
      } catch (error) {
        console.error("Failed to fetch cart items:", error);
      }
    };

    fetchCart();
  }, [authUser, syncCartFromServer]);

  const handleLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", {
        description: "Please upload an image file.",
        className: "bg-red-50 text-gray-800 border-red-200",
        duration: 5000,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload an image smaller than 5MB.",
        className: "bg-red-50 text-gray-800 border-red-200",
        duration: 5000,
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarPreview(base64String);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Avatar preview error:", error);
      toast.error("Preview failed", {
        description: "Failed to preview image.",
        className: "bg-red-50 text-gray-800 border-red-200",
        duration: 5000,
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const confirmLogout = async () => {
    setIsLoading(true);
    try {
      const response = await authApi.post("/auth/logout", {});
      if (response.success) {
        logoutUser();
        toast.success("Logged out", {
          description: "You have been logged out successfully.",
          className: "bg-green-50 text-gray-800 border-green-200",
          duration: 5000,
        });
        router.push("/");
      } else {
        throw new Error(response.error?.message || "Failed to log out.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed", {
        description:
          error instanceof Error ? error.message : "Failed to log out.",
        className: "bg-red-50 text-gray-800 border-red-200",
        duration: 7000,
      });
    }
    setIsLoading(false);
    setIsLogoutDialogOpen(false);
  };

  if (!authUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">
                Not Signed In
              </h3>
              <p className="text-gray-500">
                Please sign in to view your profile.
              </p>
              <Button onClick={() => router.push("/auth/signin")}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    const updateData: { name: string; avatar?: string } = {
      name: data.name,
    };
    if (avatarPreview) {
      updateData.avatar = avatarPreview;
    }

    if (!authUser?._id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      const response = await authApi.put(`/users/${authUser._id}`, updateData);
      if (response.success && response.data) {
        const userData = response.data as UserType;
        updateUser({
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          role: userData.role,
          addresses: userData.addresses || [],
          isOAuthUser: userData.isOAuthUser,
          authProvider: userData.authProvider,
          hasSetPassword: userData.hasSetPassword,
        });
        toast.success("Profile updated", {
          description: "Your profile has been updated successfully.",
          className: "bg-green-50 text-gray-800 border-green-200",
          duration: 5000,
        });
        profileForm.reset({ name: userData.name || "" });
        setAvatarPreview(null);
        setIsProfileSidebarOpen(false);
      } else {
        throw new Error(response.error?.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Update failed", {
        description:
          error instanceof Error ? error.message : "Failed to update profile.",
        className: "bg-red-50 text-gray-800 border-red-200",
        duration: 7000,
      });
    }
    setIsLoading(false);
  };

  const onAddressSubmit = async (data: AddressFormData) => {
    if (!authUser) {
      toast.error("User not authenticated");
      return;
    }

    setIsLoading(true);
    const newAddresses: AddressWithOptionalId[] = [
      ...(authUser.addresses || []),
    ];

    if (editingAddress && selectedAddressId !== null) {
      // Update existing address
      const index = parseInt(selectedAddressId);
      const existingId = authUser.addresses?.[index]?._id;
      newAddresses[index] = {
        ...data,
        ...(existingId && { _id: existingId }), // Only include _id if it exists
      } as AddressWithOptionalId;
    } else {
      // Add new address - don't include _id field at all
      newAddresses.push(data as AddressWithOptionalId);
    }

    // If the new/edited address is default, reset others
    if (data.isDefault) {
      newAddresses.forEach((addr: AddressWithOptionalId, i: number) => {
        addr.isDefault =
          i ===
          (editingAddress
            ? parseInt(selectedAddressId!)
            : newAddresses.length - 1);
      });
    }

    try {
      const response = await authApi.put(`/users/${authUser._id}`, {
        addresses: newAddresses,
      });
      if (response.success && response.data) {
        const userData = response.data as UserType;
        updateUser({
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          role: userData.role,
          addresses: userData.addresses || [],
          isOAuthUser: userData.isOAuthUser,
          authProvider: userData.authProvider,
          hasSetPassword: userData.hasSetPassword,
        });
        toast.success("Address saved", {
          description: editingAddress
            ? "Address updated successfully."
            : "Address added successfully.",
          className: "bg-green-50 text-gray-800 border-green-200",
          duration: 5000,
        });
        setIsAddressSidebarOpen(false);
        setEditingAddress(null);
        setSelectedAddressId(null);
      } else {
        throw new Error(response.error?.message || "Failed to save address.");
      }
    } catch (error) {
      console.error("Address save error:", error);
      toast.error("Address save failed", {
        description:
          error instanceof Error ? error.message : "Failed to save address.",
        className: "bg-red-50 text-gray-800 border-red-200",
        duration: 7000,
      });
    }
    setIsLoading(false);
  };

  const handleEditAddress = (address: Address, index: number) => {
    setEditingAddress(address);
    setSelectedAddressId(index.toString());
    setIsAddressSidebarOpen(true);
  };

  const handleDeleteAddress = async () => {
    if (selectedAddressId === null || !authUser) return;
    setIsLoading(true);
    const newAddresses = (authUser.addresses ?? []).filter(
      (_: Address, i: number) => i !== parseInt(selectedAddressId)
    );

    try {
      const response = await authApi.put(`/users/${authUser._id}`, {
        addresses: newAddresses,
      });
      if (response.success && response.data) {
        const userData = response.data as UserType;
        updateUser({
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          role: userData.role,
          addresses: userData.addresses || [],
          isOAuthUser: userData.isOAuthUser,
          authProvider: userData.authProvider,
          hasSetPassword: userData.hasSetPassword,
        });
        toast.success("Address deleted", {
          description: "Address removed successfully.",
          className: "bg-green-50 text-gray-800 border-green-200",
          duration: 5000,
        });
        setIsDeleteDialogOpen(false);
        setSelectedAddressId(null);
      } else {
        throw new Error(response.error?.message || "Failed to delete address.");
      }
    } catch (error) {
      console.error("Address delete error:", error);
      toast.error("Address deletion failed", {
        description:
          error instanceof Error ? error.message : "Failed to delete address.",
        className: "bg-red-50 text-gray-800 border-red-200",
        duration: 7000,
      });
    }
    setIsLoading(false);
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setSelectedAddressId(null);
    setIsAddressSidebarOpen(true);
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!authUser) {
      toast.error("User not authenticated");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.put(`/users/${authUser._id}/password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (response.success) {
        toast.success("Password changed", {
          description: "Your password has been changed successfully.",
          className: "bg-green-50 text-gray-800 border-green-200",
          duration: 5000,
        });
        passwordForm.reset({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setIsPasswordSidebarOpen(false);
      } else {
        throw new Error(
          response.error?.message || "Failed to change password."
        );
      }
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("Password change failed", {
        description:
          error instanceof Error ? error.message : "Failed to change password.",
        className: "bg-red-50 text-gray-800 border-red-200",
        duration: 7000,
      });
    }
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen bg-babyshopLightBg py-8 px-4 sm:px-6 lg:px-8"
    >
      <Container className="max-w-7xl space-y-6">
        {/* Header Section with Profile Overview */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-lg border-0 bg-linear-to-r from-babyshopSky to-babyshopPurple text-babyshopWhite overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  {authUser.avatar ? (
                    <div className="relative h-24 w-24 ring-4 ring-white/50 rounded-full overflow-hidden">
                      <Image
                        src={authUser.avatar}
                        alt={authUser.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-sm ring-4 ring-white/50 flex items-center justify-center text-4xl font-bold">
                      {authUser?.name &&
                        authUser?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-green-500 rounded-full border-4 border-white"></div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-2">{authUser.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                    <div className="flex items-center gap-2 text-white/90">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{authUser.email}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-white/20 backdrop-blur-sm text-white border-white/30"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {authUser.role}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => setIsProfileSidebarOpen(true)}
                    variant="secondary"
                    disabled={isLoading}
                    className="bg-babyshopWhite/20 hover:bg-babyshopWhite/30 backdrop-blur-sm text-babyshopWhite border-babyshopWhite/30 transition-all"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  {!authUser.isOAuthUser || authUser.hasSetPassword ? (
                    <Button
                      onClick={() => setIsPasswordSidebarOpen(true)}
                      variant="secondary"
                      disabled={isLoading}
                      className="bg-babyshopWhite/20 hover:bg-babyshopWhite/30 backdrop-blur-sm text-babyshopWhite border-babyshopWhite/30 transition-all"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  ) : null}
                  <Button
                    onClick={handleLogout}
                    variant="secondary"
                    disabled={isLoading}
                    className="bg-babyshopWhite/20 hover:bg-babyshopWhite/30 backdrop-blur-sm text-babyshopWhite border-babyshopWhite/30 transition-all"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* OAuth User Section */}
        {authUser.isOAuthUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <OAuthUserSection user={authUser} />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Update Profile Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-md hover:shadow-lg transition-shadow border border-babyshopTextLight/20">
                <CardHeader className="border-b bg-linear-to-r from-babyshopSky/5 to-babyshopPurple/5">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold text-babyshopBlack">
                    <Save className="h-5 w-5 text-babyshopSky" />
                    Update Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Form {...profileForm}>
                    <form
                      onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                      className="space-y-5"
                    >
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-babyshopBlack font-medium">
                              Full Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isLoading}
                                className="border-babyshopTextLight/30 rounded-lg focus:ring-2 focus:ring-babyshopSky focus:border-babyshopSky h-11"
                                placeholder="Enter your name"
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Avatar Upload */}
                      <div className="space-y-2">
                        <FormLabel className="text-gray-700 font-medium">
                          Profile Picture
                        </FormLabel>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {avatarPreview || authUser?.avatar ? (
                              <div className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-babyshopSky">
                                <Image
                                  src={avatarPreview || authUser?.avatar || ""}
                                  alt="Avatar preview"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-20 w-20 rounded-full bg-linear-to-r from-babyshopSky to-babyshopPurple flex items-center justify-center text-2xl font-bold text-babyshopWhite ring-2 ring-babyshopSky">
                                {authUser?.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {isUploadingAvatar && (
                              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              disabled={isLoading || isUploadingAvatar}
                              className="hidden"
                              id="avatar-upload"
                            />
                            <label htmlFor="avatar-upload">
                              <Button
                                type="button"
                                variant="outline"
                                disabled={isLoading || isUploadingAvatar}
                                className="border-babyshopSky text-babyshopSky hover:bg-babyshopSky/10 cursor-pointer transition-all"
                                onClick={() =>
                                  document
                                    .getElementById("avatar-upload")
                                    ?.click()
                                }
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {avatarPreview
                                  ? "Change Photo"
                                  : "Upload Photo"}
                              </Button>
                            </label>
                            <p className="text-xs text-gray-500 mt-2">
                              JPG, PNG or GIF. Max size 5MB.
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-babyshopSky hover:bg-babyshopSky/90 text-babyshopWhite font-semibold rounded-lg shadow-md h-11 transition-all"
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
                            Updating...
                          </span>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Update Profile
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Addresses Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="shadow-md hover:shadow-lg transition-shadow border border-babyshopTextLight/20">
                <CardHeader className="border-b bg-linear-to-r from-babyshopSky/5 to-babyshopPurple/5">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xl font-bold text-babyshopBlack">
                      <MapPin className="h-5 w-5 text-babyshopSky" />
                      Delivery Addresses
                    </div>
                    <Button
                      onClick={handleAddNewAddress}
                      size="sm"
                      className="bg-babyshopSky hover:bg-babyshopSky/90 text-babyshopWhite transition-all"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {!(authUser.addresses && authUser.addresses.length > 0) ? (
                    <div className="text-center py-12">
                      <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-4">
                        No addresses added yet.
                      </p>
                      <Button
                        onClick={handleAddNewAddress}
                        variant="outline"
                        className="border-babyshopSky text-babyshopSky hover:bg-babyshopSky/10 transition-all"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Address
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {authUser.addresses.map(
                        (address: Address, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all bg-white"
                          >
                            {address.isDefault && (
                              <Badge className="absolute top-2 right-2 bg-green-100 text-green-800 border-green-300">
                                Default
                              </Badge>
                            )}
                            <div className="space-y-1 pr-20">
                              <p className="font-medium text-gray-900">
                                {address.street}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.city}, {address.country}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.postalCode}
                              </p>
                            </div>
                            <div className="absolute bottom-4 right-4 flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleEditAddress(address, index)
                                }
                                className="text-babyshopSky hover:text-babyshopSky/80 hover:bg-babyshopSky/10 transition-all"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAddressId(index.toString());
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-babyshopRed hover:text-babyshopRed/80 hover:bg-babyshopRed/10 transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Quick Info */}
          <div className="space-y-6">
            {/* Cart Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-md hover:shadow-lg transition-shadow border border-babyshopTextLight/20">
                <CardHeader className="border-b bg-linear-to-r from-babyshopSky/5 to-babyshopPurple/5">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-babyshopBlack">
                    <ShoppingCart className="h-5 w-5 text-babyshopSky" />
                    Cart Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                      <p className="text-gray-500 text-sm">
                        Your cart is empty
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Total Items
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-indigo-100 text-indigo-800"
                        >
                          {cartItems.length}
                        </Badge>
                      </div>
                      <Separator />
                      <Link href="/user/cart">
                        <Button
                          variant="outline"
                          className="w-full border-babyshopSky text-babyshopSky hover:bg-babyshopSky/10 transition-all"
                        >
                          View Cart
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="shadow-md hover:shadow-lg transition-shadow border border-babyshopTextLight/20">
                <CardHeader className="border-b bg-linear-to-r from-babyshopSky/5 to-babyshopPurple/5">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-babyshopBlack">
                    <Package className="h-5 w-5 text-babyshopSky" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoadingOrders ? (
                    <div className="text-center py-8">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-babyshopSky border-r-transparent"></div>
                      <p className="text-sm text-babyshopTextLight mt-3">
                        Loading orders...
                      </p>
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                      <p className="text-gray-500 text-sm">No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <Link
                          key={order._id}
                          href={`/user/orders/${order._id}`}
                          className="block"
                        >
                          <div className="p-3 border border-gray-200 rounded-lg hover:border-babyshopSky/50 hover:shadow-md transition-all bg-babyshopWhite">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  #{order._id?.slice(-8).toUpperCase()}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(order.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </p>
                              </div>
                              <Badge
                                className={`text-xs shrink-0 ${getStatusColor(order.status)}`}
                              >
                                {order.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">
                                {order.items.length} item
                                {order.items.length > 1 ? "s" : ""}
                              </span>
                              <span className="font-semibold text-gray-900">
                                ${order.total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                      <Link href="/user/orders">
                        <Button
                          variant="outline"
                          className="w-full border-babyshopSky text-babyshopSky hover:bg-babyshopSky/10 mt-2 transition-all"
                        >
                          View All Orders
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Address Sidebar */}
        <AddressSheet
          open={isAddressSidebarOpen}
          onOpenChange={setIsAddressSidebarOpen}
          onSubmit={onAddressSubmit}
          editingAddress={
            editingAddress
              ? {
                  street: editingAddress.street,
                  city: editingAddress.city,
                  state: editingAddress.state,
                  country: editingAddress.country,
                  postalCode: editingAddress.postalCode,
                  isDefault: editingAddress.isDefault ?? false,
                }
              : null
          }
          title={editingAddress ? "Edit Address" : "Add New Address"}
        />

        {/* Delete Address Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Address</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this address? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAddress}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
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
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Logout Confirmation Dialog */}
        <AlertDialog
          open={isLogoutDialogOpen}
          onOpenChange={setIsLogoutDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out? You will need to sign in again
                to access your profile.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmLogout}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
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
                    Logging out...
                  </span>
                ) : (
                  "Log Out"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Profile Sidebar */}
        <Sheet
          open={isProfileSidebarOpen}
          onOpenChange={setIsProfileSidebarOpen}
        >
          <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Edit Profile</SheetTitle>
              <SheetDescription>
                Update your profile information and avatar
              </SheetDescription>
            </SheetHeader>

            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-6 mt-6"
              >
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isLoading}
                          placeholder="Enter your name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Avatar Upload in Sidebar */}
                <div className="space-y-2">
                  <FormLabel>Profile Picture</FormLabel>
                  <div className="flex flex-col gap-4">
                    <div className="relative mx-auto">
                      {avatarPreview || authUser?.avatar ? (
                        <div className="relative h-24 w-24 rounded-full overflow-hidden ring-2 ring-babyshopSky">
                          <Image
                            src={avatarPreview || authUser?.avatar || ""}
                            alt="Avatar preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-24 w-24 rounded-full bg-linear-to-r from-babyshopSky to-babyshopPurple flex items-center justify-center text-2xl font-bold text-babyshopWhite ring-2 ring-babyshopSky">
                          {authUser?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={isLoading || isUploadingAvatar}
                        className="hidden"
                        id="avatar-upload-sidebar"
                      />
                      <label htmlFor="avatar-upload-sidebar" className="w-full">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isLoading || isUploadingAvatar}
                          className="w-full border-babyshopSky text-babyshopSky hover:bg-babyshopSky/10 cursor-pointer transition-all"
                          onClick={() =>
                            document
                              .getElementById("avatar-upload-sidebar")
                              ?.click()
                          }
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {avatarPreview ? "Change Photo" : "Upload Photo"}
                        </Button>
                      </label>
                      <p className="text-xs text-gray-500 text-center">
                        Max size: 5MB. Formats: JPG, PNG, GIF
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || isUploadingAvatar}
                  className="w-full bg-babyshopSky hover:bg-babyshopSky/90 text-babyshopWhite transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
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
                      Saving...
                    </span>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>

        {/* Change Password Sidebar */}
        <Sheet
          open={isPasswordSidebarOpen}
          onOpenChange={setIsPasswordSidebarOpen}
        >
          <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Change Password</SheetTitle>
              <SheetDescription>
                Enter your current password to set a new one
              </SheetDescription>
            </SheetHeader>

            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-6 mt-6"
              >
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showCurrentPassword ? "text" : "password"}
                            disabled={isLoading}
                            placeholder="Enter current password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showNewPassword ? "text" : "password"}
                            disabled={isLoading}
                            placeholder="Enter new password (min 8 characters)"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            disabled={isLoading}
                            placeholder="Confirm new password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-babyshopSky hover:bg-babyshopSky/90 text-babyshopWhite transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
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
                      Changing...
                    </span>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </Container>
    </motion.div>
  );
};

export default ProfilePage;
