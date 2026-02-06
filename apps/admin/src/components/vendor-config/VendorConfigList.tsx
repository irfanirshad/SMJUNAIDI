import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  Store,
  Mail,
  Phone,
  MapPin,
  Eye,
  Building2,
  User,
  Plus,
  Pencil,
} from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";

interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Vendor {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role?: string;
  };
  storeName: string;
  description: string;
  logo?: string;
  status: "pending" | "approved" | "rejected";
  contactEmail: string;
  contactPhone?: string;
  address?: Address;
  createdAt: string;
  updatedAt: string;
}

const VendorConfigList = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [editVendorOpen, setEditVendorOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    userId: "",
    storeName: "",
    description: "",
    logo: "",
    contactEmail: "",
    contactPhone: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
    status: "approved",
    role: "vendor",
  });
  const { token } = useAuthStore();
  const { can } = usePermissions();
  const { toast } = useToast();

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (addVendorOpen && users.length === 0) {
      fetchUsers(1);
    }
  }, [addVendorOpen]);

  const fetchVendors = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(
        `${import.meta.env.VITE_NEXT_PUBLIC_API_URL}/api/vendors/requests`,
        config
      );
      setVendors(response.data.data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load vendors",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page: number = 1, search: string = "") => {
    if (loadingUsers) return;

    try {
      setLoadingUsers(true);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const response = await axios.get(
        `${import.meta.env.VITE_NEXT_PUBLIC_API_URL}/api/users?page=${page}&perPage=20${searchParam}`,
        config
      );
      // Handle response with pagination data
      const usersData = response.data.users || [];
      const hasNext = response.data.hasNextPage || false;

      if (page === 1) {
        setUsers(usersData);
      } else {
        setUsers((prev) => [...prev, ...usersData]);
      }

      setUsersPage(page);
      setHasMoreUsers(hasNext);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (page === 1) {
        setUsers([]); // Set empty array on error for first page
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadMoreUsers = () => {
    if (hasMoreUsers && !loadingUsers) {
      fetchUsers(usersPage + 1, userSearch);
    }
  };

  const isUserAlreadyVendor = (userId: string) => {
    return vendors.some((vendor) => vendor.userId._id === userId);
  };

  const handleUserSearch = (value: string) => {
    setUserSearch(value);
    setUsersPage(1);
    fetchUsers(1, value);
  };

  const handleUserSelect = (userId: string) => {
    const selectedUser = users.find((u) => u._id === userId);
    if (selectedUser) {
      setVendorForm({
        ...vendorForm,
        userId,
        storeName: selectedUser.name + "'s Store",
        contactEmail: selectedUser.email,
      });
    }
  };

  const openEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      userId: vendor.userId._id,
      storeName: vendor.storeName,
      description: vendor.description,
      logo: vendor.logo || "",
      contactEmail: vendor.contactEmail,
      contactPhone: vendor.contactPhone || "",
      address: {
        street: vendor.address?.street || "",
        city: vendor.address?.city || "",
        state: vendor.address?.state || "",
        country: vendor.address?.country || "",
        postalCode: vendor.address?.postalCode || "",
      },
      status: vendor.status,
      role: vendor.userId?.role || "vendor",
    });
    setEditVendorOpen(true);
  };

  const handleCreateVendor = async () => {
    if (
      !vendorForm.userId ||
      !vendorForm.storeName ||
      !vendorForm.description ||
      !vendorForm.contactEmail
    ) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    try {
      setCreating(true);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await axios.post(
        `${import.meta.env.VITE_NEXT_PUBLIC_API_URL}/api/vendors/create`,
        vendorForm,
        config
      );
      toast({
        title: "Success",
        description: "Vendor created successfully",
      });
      setAddVendorOpen(false);
      setVendorForm({
        userId: "",
        storeName: "",
        description: "",
        logo: "",
        contactEmail: "",
        contactPhone: "",
        address: {
          street: "",
          city: "",
          state: "",
          country: "",
          postalCode: "",
        },
        status: "approved",
        role: "vendor",
      });
      fetchVendors();
    } catch (error: any) {
      console.error("Error creating vendor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to create vendor",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateVendor = async () => {
    if (
      !vendorForm.storeName ||
      !vendorForm.description ||
      !vendorForm.contactEmail
    ) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    if (!editingVendor) return;

    try {
      setUpdating(true);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await axios.put(
        `${import.meta.env.VITE_NEXT_PUBLIC_API_URL}/api/vendors/${editingVendor._id}`,
        {
          storeName: vendorForm.storeName,
          description: vendorForm.description,
          logo: vendorForm.logo,
          contactEmail: vendorForm.contactEmail,
          contactPhone: vendorForm.contactPhone,
          address: vendorForm.address,
          status: vendorForm.status,
          role: vendorForm.role,
        },
        config
      );
      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });
      setEditVendorOpen(false);
      setEditingVendor(null);
      setVendorForm({
        userId: "",
        storeName: "",
        description: "",
        logo: "",
        contactEmail: "",
        contactPhone: "",
        address: {
          street: "",
          city: "",
          state: "",
          country: "",
          postalCode: "",
        },
        status: "approved",
        role: "vendor",
      });
      fetchVendors();
    } catch (error: any) {
      console.error("Error updating vendor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update vendor",
      });
    } finally {
      setUpdating(false);
    }
  };

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    if (!can("manage_vendors")) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to update vendor status",
      });
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await axios.put(
        `${import.meta.env.VITE_NEXT_PUBLIC_API_URL}/api/vendors/${id}/status`,
        { status },
        config
      );

      toast({
        title: "Success",
        description: `Vendor ${status} successfully`,
      });
      setDetailsOpen(false);
      fetchVendors();
    } catch (error) {
      console.error("Error updating vendor status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status",
      });
    }
  };

  const viewDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setDetailsOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <>
      {/* Add Vendor Button */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setAddVendorOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add Vendor
        </Button>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-50">Store Name</TableHead>
                <TableHead className="min-w-37.5">Owner</TableHead>
                <TableHead className="min-w-50 hidden md:table-cell">
                  Email
                </TableHead>
                <TableHead className="min-w-37.5 hidden lg:table-cell">
                  Phone
                </TableHead>
                <TableHead className="min-w-30">Status</TableHead>
                <TableHead className="min-w-30 hidden sm:table-cell">
                  Created Date
                </TableHead>
                <TableHead className="text-right min-w-25">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Store size={48} className="opacity-20" />
                      <p>No vendors found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor) => (
                  <TableRow
                    key={vendor._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => viewDetails(vendor)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {vendor.logo ? (
                          <img
                            src={vendor.logo}
                            alt={vendor.storeName}
                            className="h-10 w-10 rounded-md object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                            <Store size={20} className="text-slate-400" />
                          </div>
                        )}
                        <span className="truncate">{vendor.storeName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="truncate">
                      {vendor.userId?.name || "N/A"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Mail
                          size={14}
                          className="text-muted-foreground shrink-0"
                        />
                        <span className="text-sm truncate">
                          {vendor.contactEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {vendor.contactPhone ? (
                        <div className="flex items-center gap-2">
                          <Phone
                            size={14}
                            className="text-muted-foreground shrink-0"
                          />
                          <span className="text-sm truncate">
                            {vendor.contactPhone}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(vendor.status)}>
                        {vendor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewDetails(vendor)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditVendor(vendor)}
                          title="Edit Vendor"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Vendor Sidebar */}
      <Sheet open={addVendorOpen} onOpenChange={setAddVendorOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add New Vendor</SheetTitle>
            <SheetDescription>
              Select a user and fill in vendor details to create a new vendor
              account
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="userId">Select User *</Label>
              <Select
                value={vendorForm.userId}
                onValueChange={handleUserSelect}
                disabled={creating}
              >
                <SelectTrigger id="userId">
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {/* Search Input */}
                  <div className="px-2 pb-2 pt-1 sticky top-0 bg-white z-10 border-b">
                    <Input
                      placeholder="Search users by name or email..."
                      value={userSearch}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      className="h-8 text-sm"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>

                  {users.map((user) => {
                    const isVendor = isUserAlreadyVendor(user._id);
                    return (
                      <SelectItem
                        key={user._id}
                        value={user._id}
                        disabled={isVendor}
                      >
                        <div className="flex items-center gap-2">
                          <User size={14} />
                          <span
                            className={isVendor ? "text-muted-foreground" : ""}
                          >
                            {user.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({user.email})
                          </span>
                          {isVendor && (
                            <span className="text-xs font-medium text-orange-600">
                              • Already Vendor
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                  {hasMoreUsers && (
                    <div
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        loadMoreUsers();
                      }}
                    >
                      <div className="flex items-center gap-2 text-blue-600">
                        {loadingUsers ? (
                          <span className="text-xs">Loading...</span>
                        ) : (
                          <>
                            <Plus size={14} />
                            <span className="text-xs font-medium">
                              Load More Users
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {users.length} user(s) loaded
                {hasMoreUsers ? " • More available" : ""}
              </p>
            </div>

            {/* User Role */}
            <div className="space-y-2">
              <Label htmlFor="role">User Role</Label>
              <Select
                value={vendorForm.role}
                onValueChange={(value) =>
                  setVendorForm({ ...vendorForm, role: value })
                }
                disabled={true}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Role will be automatically set to "vendor" when creating a
                vendor account
              </p>
            </div>

            {/* Store Name */}
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name *</Label>
              <Input
                id="storeName"
                value={vendorForm.storeName}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, storeName: e.target.value })
                }
                placeholder="Enter store name"
                disabled={creating}
              />
            </div>

            {/* Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={vendorForm.contactEmail}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, contactEmail: e.target.value })
                }
                placeholder="store@example.com"
                disabled={creating}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={vendorForm.description}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, description: e.target.value })
                }
                placeholder="Describe the vendor's business"
                rows={4}
                disabled={creating}
              />
            </div>

            {/* Contact Phone */}
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={vendorForm.contactPhone}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, contactPhone: e.target.value })
                }
                placeholder="+1 (555) 000-0000"
                disabled={creating}
              />
            </div>

            {/* Store/Vendor Logo Image */}
            <div className="space-y-2">
              <Label htmlFor="logo">Store Logo/Image</Label>
              <ImageUpload
                value={vendorForm.logo}
                onChange={(base64) =>
                  setVendorForm({ ...vendorForm, logo: base64 })
                }
                disabled={creating}
              />
              <p className="text-xs text-muted-foreground">
                Upload a logo or image for the vendor's store (max 4MB)
              </p>
            </div>

            {/* Address Section */}
            <Separator />
            <h4 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
              <MapPin size={16} />
              Address (Optional)
            </h4>

            <div className="space-y-2">
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                value={vendorForm.address.street}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    address: { ...vendorForm.address, street: e.target.value },
                  })
                }
                placeholder="123 Main St"
                disabled={creating}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={vendorForm.address.city}
                  onChange={(e) =>
                    setVendorForm({
                      ...vendorForm,
                      address: { ...vendorForm.address, city: e.target.value },
                    })
                  }
                  placeholder="New York"
                  disabled={creating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={vendorForm.address.state}
                  onChange={(e) =>
                    setVendorForm({
                      ...vendorForm,
                      address: { ...vendorForm.address, state: e.target.value },
                    })
                  }
                  placeholder="NY"
                  disabled={creating}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={vendorForm.address.country}
                  onChange={(e) =>
                    setVendorForm({
                      ...vendorForm,
                      address: {
                        ...vendorForm.address,
                        country: e.target.value,
                      },
                    })
                  }
                  placeholder="USA"
                  disabled={creating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={vendorForm.address.postalCode}
                  onChange={(e) =>
                    setVendorForm({
                      ...vendorForm,
                      address: {
                        ...vendorForm.address,
                        postalCode: e.target.value,
                      },
                    })
                  }
                  placeholder="10001"
                  disabled={creating}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select
                value={vendorForm.status}
                onValueChange={(value) =>
                  setVendorForm({ ...vendorForm, status: value })
                }
                disabled={creating}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <Separator />
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAddVendorOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateVendor}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Vendor"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Vendor Sidebar */}
      <Sheet open={editVendorOpen} onOpenChange={setEditVendorOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Vendor</SheetTitle>
            <SheetDescription>
              Update vendor details and save changes
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            {/* Display Current User (Read-only) */}
            <div className="space-y-2">
              <Label>Vendor Owner</Label>
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                <User size={16} className="text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {editingVendor?.userId?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {editingVendor?.userId?.email}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Vendor owner cannot be changed
              </p>
            </div>

            {/* User Role */}
            <div className="space-y-2">
              <Label htmlFor="edit-role">User Role</Label>
              <Select
                value={vendorForm.role}
                onValueChange={(value) =>
                  setVendorForm({ ...vendorForm, role: value })
                }
                disabled={updating}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                </SelectContent>
              </Select>
              {vendorForm.role !== "vendor" && (
                <p className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                  ⚠️ It's recommended to set the role to "Vendor" for proper
                  vendor access
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Change the user's role. Recommended: "Vendor" for vendor
                accounts
              </p>
            </div>

            {/* Store Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-storeName">Store Name *</Label>
              <Input
                id="edit-storeName"
                value={vendorForm.storeName}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, storeName: e.target.value })
                }
                placeholder="Enter store name"
                disabled={updating}
              />
            </div>

            {/* Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="edit-contactEmail">Contact Email *</Label>
              <Input
                id="edit-contactEmail"
                type="email"
                value={vendorForm.contactEmail}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, contactEmail: e.target.value })
                }
                placeholder="store@example.com"
                disabled={updating}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={vendorForm.description}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, description: e.target.value })
                }
                placeholder="Describe the vendor's business"
                rows={4}
                disabled={updating}
              />
            </div>

            {/* Contact Phone */}
            <div className="space-y-2">
              <Label htmlFor="edit-contactPhone">Contact Phone</Label>
              <Input
                id="edit-contactPhone"
                type="tel"
                value={vendorForm.contactPhone}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, contactPhone: e.target.value })
                }
                placeholder="+1 (555) 000-0000"
                disabled={updating}
              />
            </div>

            {/* Store/Vendor Logo Image */}
            <div className="space-y-2">
              <Label htmlFor="edit-logo">Store Logo/Image</Label>
              <ImageUpload
                value={vendorForm.logo}
                onChange={(base64) =>
                  setVendorForm({ ...vendorForm, logo: base64 })
                }
                disabled={updating}
              />
              <p className="text-xs text-muted-foreground">
                Upload a logo or image for the vendor's store (max 4MB)
              </p>
            </div>

            {/* Address Section */}
            <Separator />
            <h4 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
              <MapPin size={16} />
              Address (Optional)
            </h4>

            <div className="space-y-2">
              <Label htmlFor="edit-street">Street</Label>
              <Input
                id="edit-street"
                value={vendorForm.address.street}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    address: { ...vendorForm.address, street: e.target.value },
                  })
                }
                placeholder="123 Main St"
                disabled={updating}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={vendorForm.address.city}
                  onChange={(e) =>
                    setVendorForm({
                      ...vendorForm,
                      address: { ...vendorForm.address, city: e.target.value },
                    })
                  }
                  placeholder="New York"
                  disabled={updating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-state">State/Province</Label>
                <Input
                  id="edit-state"
                  value={vendorForm.address.state}
                  onChange={(e) =>
                    setVendorForm({
                      ...vendorForm,
                      address: { ...vendorForm.address, state: e.target.value },
                    })
                  }
                  placeholder="NY"
                  disabled={updating}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <Input
                  id="edit-country"
                  value={vendorForm.address.country}
                  onChange={(e) =>
                    setVendorForm({
                      ...vendorForm,
                      address: {
                        ...vendorForm.address,
                        country: e.target.value,
                      },
                    })
                  }
                  placeholder="USA"
                  disabled={updating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-postalCode">Postal Code</Label>
                <Input
                  id="edit-postalCode"
                  value={vendorForm.address.postalCode}
                  onChange={(e) =>
                    setVendorForm({
                      ...vendorForm,
                      address: {
                        ...vendorForm.address,
                        postalCode: e.target.value,
                      },
                    })
                  }
                  placeholder="10001"
                  disabled={updating}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={vendorForm.status}
                onValueChange={(value) =>
                  setVendorForm({ ...vendorForm, status: value })
                }
                disabled={updating}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <Separator />
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setEditVendorOpen(false);
                  setEditingVendor(null);
                }}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpdateVendor}
                disabled={updating}
              >
                {updating ? "Updating..." : "Update Vendor"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Vendor Details</SheetTitle>
            <SheetDescription>
              Complete information and actions for this vendor
            </SheetDescription>
          </SheetHeader>
          {selectedVendor && (
            <div className="space-y-6 mt-6">
              {/* Vendor Header */}
              <div className="flex items-start gap-4">
                {selectedVendor.logo ? (
                  <img
                    src={selectedVendor.logo}
                    alt={selectedVendor.storeName}
                    className="h-20 w-20 rounded-lg object-cover border shadow-sm shrink-0"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-slate-100 flex items-center justify-center border shrink-0">
                    <Store size={32} className="text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold truncate">
                    {selectedVendor.storeName}
                  </h3>
                  <Badge
                    variant={getStatusBadgeVariant(selectedVendor.status)}
                    className="mt-2"
                  >
                    {selectedVendor.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                  Actions
                </h4>
                <div className="flex flex-col gap-2">
                  {selectedVendor.status === "pending" && (
                    <>
                      <Button
                        onClick={() =>
                          updateStatus(selectedVendor._id, "approved")
                        }
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check size={16} className="mr-2" />
                        Approve Vendor
                      </Button>
                      <Button
                        onClick={() =>
                          updateStatus(selectedVendor._id, "rejected")
                        }
                        variant="destructive"
                        className="w-full"
                      >
                        <X size={16} className="mr-2" />
                        Reject Vendor
                      </Button>
                    </>
                  )}
                  {selectedVendor.status === "approved" && (
                    <Button
                      onClick={() =>
                        updateStatus(selectedVendor._id, "rejected")
                      }
                      variant="destructive"
                      className="w-full"
                    >
                      <X size={16} className="mr-2" />
                      Revoke Approval
                    </Button>
                  )}
                  {selectedVendor.status === "rejected" && (
                    <Button
                      onClick={() =>
                        updateStatus(selectedVendor._id, "approved")
                      }
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check size={16} className="mr-2" />
                      Approve Vendor
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Store Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
                  <Building2 size={16} />
                  Store Information
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Description
                    </label>
                    <p className="mt-1 text-sm">{selectedVendor.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Mail size={12} /> Contact Email
                      </label>
                      <p className="mt-1 text-sm break-all">
                        {selectedVendor.contactEmail}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Phone size={12} /> Contact Phone
                      </label>
                      <p className="mt-1 text-sm">
                        {selectedVendor.contactPhone || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {selectedVendor.address && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MapPin size={12} /> Address
                      </label>
                      <div className="mt-1 text-sm space-y-0.5">
                        {selectedVendor.address.street && (
                          <p>{selectedVendor.address.street}</p>
                        )}
                        <p>
                          {[
                            selectedVendor.address.city,
                            selectedVendor.address.state,
                            selectedVendor.address.postalCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        {selectedVendor.address.country && (
                          <p>{selectedVendor.address.country}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Owner Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
                  <User size={16} />
                  Owner Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Owner Name
                    </label>
                    <p className="mt-1 text-sm">
                      {selectedVendor.userId?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Owner Email
                    </label>
                    <p className="mt-1 text-sm break-all">
                      {selectedVendor.userId?.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Metadata */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                  Metadata
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Created At
                    </label>
                    <p className="mt-1 text-sm">
                      {new Date(selectedVendor.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </label>
                    <p className="mt-1 text-sm">
                      {new Date(selectedVendor.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default VendorConfigList;
