/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { useToast } from "@/hooks/use-toast";
import useAuthStore from "@/store/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { userSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Edit,
  Trash,
  Trash2,
  Plus,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";

type User = {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  role: "admin" | "user" | "employee" | "vendor";
  employee_role?:
    | "packer"
    | "deliveryman"
    | "accounts"
    | "incharge"
    | "call_center"
    | null;
  createdAt: string;
};

type FormData = z.infer<typeof userSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [passwordInfo, setPasswordInfo] = useState<any>(null);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [showPlainPassword, setShowPlainPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [bypassOldPassword, setBypassOldPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [customPerPage, setCustomPerPage] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  const axiosPrivate = useAxiosPrivate();
  const { toast } = useToast();
  const { user, checkIsAdmin } = useAuthStore();
  const { canPerformCRUD, isReadOnly } = usePermissions();
  const isAdmin = checkIsAdmin();
  const location = useLocation();
  const isCustomersPage = location.pathname === "/dashboard/customers";

  // Auto-set role filter based on page
  useEffect(() => {
    if (isCustomersPage) {
      setRoleFilter("user");
    }
  }, [isCustomersPage]);

  const formAdd = useForm<FormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "user",
      employee_role: null,
      avatar: "",
    },
  });

  const formEdit = useForm<FormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      employee_role: null,
      avatar: "",
    },
  });

  const fetchUsers = async (resetPage = false) => {
    setLoading(true);
    try {
      const currentPage = resetPage ? 1 : page;

      const response = await axiosPrivate.get("/users", {
        params: {
          page: currentPage,
          perPage,
          sortOrder,
          role: roleFilter === "all" ? undefined : roleFilter,
          employee_role:
            employeeRoleFilter === "all" ? undefined : employeeRoleFilter,
          search: searchTerm.trim() || undefined,
        },
      });

      // Handle paginated response from updated server
      if (response.data.users) {
        setUsers(response.data.users);
        setTotal(response.data.total || 0);
        setTotalPages(response.data.totalPages || 1);

        // If we reset the page, update the page state
        if (resetPage) {
          setPage(1);
        }
      } else {
        // Fallback for non-paginated response
        setUsers(response.data || []);
        setTotal(response.data?.length || 0);
        setTotalPages(1);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await axiosPrivate.get("/users", {
        params: {
          page,
          perPage,
          sortOrder: "desc",
          role: roleFilter === "all" ? undefined : roleFilter,
          employee_role:
            employeeRoleFilter === "all" ? undefined : employeeRoleFilter,
          search: searchTerm.trim() || undefined,
        },
      });

      // Handle paginated response
      if (response.data.users) {
        setUsers(response.data.users);
        setTotal(response.data.total || 0);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setUsers(response.data || []);
        setTotal(response.data?.length || 0);
        setTotalPages(1);
      }

      toast({
        title: "Success",
        description: "Users refreshed successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh users",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, employeeRoleFilter, perPage, sortOrder]);

  // Add debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== "") {
        fetchUsers(true); // Reset to page 1 when searching
      } else {
        fetchUsers();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPage(1); // Reset to first page when changing filter
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Don't reset page here, let the useEffect handle it
  };

  const handlePerPageChange = (value: string) => {
    if (value === "all") {
      setPerPage(10000); // Set to a very large number for "all" - server will handle it appropriately
      setPage(1); // Reset to first page
      setCustomPerPage(""); // Hide custom input
    } else if (value === "custom") {
      setCustomPerPage("1"); // Show custom input with placeholder value
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue > 0) {
        setPerPage(numValue);
        setPage(1); // Reset to first page when changing perPage
        setCustomPerPage(""); // Hide custom input
      }
    }
  };

  const handleCustomPerPageChange = (value: string) => {
    setCustomPerPage(value);
  };

  const handleCustomPerPageSubmit = () => {
    const numValue = parseInt(customPerPage);
    if (!isNaN(numValue) && numValue > 0) {
      setPerPage(numValue);
      setPage(1); // Reset to first page
      setCustomPerPage(""); // Clear the custom input
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please enter a valid number greater than 0",
      });
    }
  };

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value);
    setPage(1); // Reset to first page when changing sort order
  };

  const handleSelectUser = (userId: string, checked?: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId]);
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(displayUsers.map((user) => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) {
      toast({
        variant: "destructive",
        title: "No Selection",
        description: "Please select users to delete",
      });
      return;
    }
    setIsBulkDeleteModalOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);

      // Delete users in parallel
      await Promise.all(
        selectedUsers.map((userId) => axiosPrivate.delete(`/users/${userId}`))
      );

      toast({
        title: "Success",
        description: `${selectedUsers.length} user(s) deleted successfully`,
      });

      setSelectedUsers([]);
      setIsBulkDeleteModalOpen(false);
      fetchUsers(true); // Reset to page 1 and refetch
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete selected users",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // No need for client-side filtering anymore since we're doing server-side filtering
  const displayUsers = users;

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    formEdit.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      employee_role: user.employee_role || null,
      avatar: user.avatar,
    });
    setOldPassword("");
    setBypassOldPassword(false);
    setShowOldPassword(false);
    setShowNewPassword(false);
    setIsEditSheetOpen(true);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setPasswordInfo(null);
    setShowPasswordInfo(false);
    setIsViewSheetOpen(true);
  };

  const handleViewPassword = async () => {
    if (!selectedUser) return;

    setLoadingPassword(true);
    try {
      const response = await axiosPrivate.get(
        `/users/${selectedUser._id}/password`
      );
      setPasswordInfo(response.data);
      setShowPasswordInfo(true);
      toast({
        title: "Password Info Retrieved",
        description: "Viewing password information (dev mode only)",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to retrieve password information. Make sure you're in development mode.",
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "employee":
        return "bg-purple-100 text-purple-800";
      case "user":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEmployeeRoleColor = (employeeRole: string) => {
    switch (employeeRole) {
      case "packer":
        return "bg-blue-100 text-blue-800";
      case "deliveryman":
        return "bg-orange-100 text-orange-800";
      case "accounts":
        return "bg-emerald-100 text-emerald-800";
      case "incharge":
        return "bg-indigo-100 text-indigo-800";
      case "call_center":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddUser = async (data: FormData) => {
    setFormLoading(true);
    try {
      await axiosPrivate.post("/users", data);
      toast({
        title: "Success",
        description: "User created successfully",
      });
      formAdd.reset();
      setShowAddPassword(false);
      setIsAddSheetOpen(false);
      fetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create user",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (data: FormData) => {
    if (!selectedUser) return;

    // Check if password is being updated
    if (data.password && data.password.trim() !== "") {
      // If admin in dev mode can bypass old password check
      const isDev = import.meta.env.DEV;
      if (!bypassOldPassword) {
        // Require old password verification
        if (!oldPassword || oldPassword.trim() === "") {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Please enter the current password to update it",
          });
          return;
        }
      } else if (!isDev || !isAdmin) {
        // Only allow bypass in dev mode for admins
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "Bypass mode is only available for admins in development",
        });
        return;
      }
    }

    setFormLoading(true);
    try {
      const updateData = { ...data };

      // Add old password if provided and not bypassing
      if (data.password && data.password.trim() !== "" && !bypassOldPassword) {
        updateData.oldPassword = oldPassword;
      }

      await axiosPrivate.put(`/users/${selectedUser._id}`, updateData);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setIsEditSheetOpen(false);
      setOldPassword("");
      setBypassOldPassword(false);
      fetchUsers();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to update user";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setDeleteLoading(true);
    try {
      await axiosPrivate.delete(`/users/${selectedUser._id}`);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {isCustomersPage ? "Customers Management" : "Users Management"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 md:mt-2">
            <p className="text-gray-600">
              {isCustomersPage
                ? "Manage all customer accounts and information"
                : isAdmin
                  ? "Manage all system users, roles, and permissions"
                  : user?.role === "employee" && user?.employee_role
                    ? `View users as ${user.employee_role.replace("_", " ")}`
                    : "View system users"}
            </p>
            {user?.role === "employee" && user?.employee_role && (
              <Badge
                className={cn(
                  "capitalize text-xs",
                  (() => {
                    switch (user.employee_role) {
                      case "packer":
                        return "bg-blue-500/90 hover:bg-blue-600 text-white";
                      case "deliveryman":
                        return "bg-green-500/90 hover:bg-green-600 text-white";
                      case "accounts":
                        return "bg-yellow-500/90 hover:bg-yellow-600 text-white";
                      case "incharge":
                        return "bg-purple-500/90 hover:bg-purple-600 text-white";
                      case "call_center":
                        return "bg-pink-500/90 hover:bg-pink-600 text-white";
                      default:
                        return "bg-gray-500/90 hover:bg-gray-600 text-white";
                    }
                  })()
                )}
              >
                {user.employee_role.replace("_", " ")}
              </Badge>
            )}
            {isAdmin && (
              <Badge className="bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xs">
                Admin
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            {loading || refreshing ? (
              <RefreshCw className="h-5 w-5 md:h-6 md:w-6 text-blue-600 animate-spin" />
            ) : (
              <span className="text-xl md:text-2xl font-bold text-blue-600">
                {total}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {refreshing ? "Refreshing..." : "Refresh"}
            </span>
          </Button>
          {isAdmin && canPerformCRUD && (
            <Button
              onClick={() => setIsAddSheetOpen(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )}
          {isAdmin && isReadOnly && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <span className="text-xs text-amber-700 dark:text-amber-400">
                👁️ Read-only mode
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-4 rounded-lg shadow-sm border space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Search */}
          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
            <Search className="h-4 w-4 text-gray-500 shrink-0" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
            </SelectContent>
          </Select>

          {/* Employee Role Filter (conditional) */}
          {roleFilter === "employee" && (
            <Select
              value={employeeRoleFilter}
              onValueChange={setEmployeeRoleFilter}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by employee role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employee Roles</SelectItem>
                <SelectItem value="call_center">Call Center</SelectItem>
                <SelectItem value="packer">Packer</SelectItem>
                <SelectItem value="deliveryman">Delivery Person</SelectItem>
                <SelectItem value="accounts">Accounts</SelectItem>
                <SelectItem value="incharge">Incharge</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Sort Order */}
          <Select value={sortOrder} onValueChange={handleSortOrderChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          {/* Per Page */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Per Page:
            </Label>
            <Select
              value={
                perPage >= 10000
                  ? "all"
                  : customPerPage !== ""
                    ? "custom"
                    : ![10, 20, 30, 50, 100].includes(perPage)
                      ? "custom"
                      : perPage.toString()
              }
              onValueChange={handlePerPageChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Per Page Input */}
        {customPerPage !== "" && (
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm text-gray-600">Custom:</Label>
            <Input
              type="number"
              placeholder="Enter number"
              value={customPerPage}
              onChange={(e) => handleCustomPerPageChange(e.target.value)}
              className="w-32"
              min="1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCustomPerPageSubmit();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCustomPerPageSubmit}
            >
              Apply
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCustomPerPage("")}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && canPerformCRUD && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Users className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">
                {selectedUsers.length} user(s) selected
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUsers([])}
                className="flex items-center gap-2 flex-1 sm:flex-initial"
              >
                Unselect All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="flex items-center gap-2 flex-1 sm:flex-initial"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Bulk Delete Confirmation Modal */}
      <Dialog
        open={isBulkDeleteModalOpen}
        onOpenChange={setIsBulkDeleteModalOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Bulk Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUsers.length} selected
              user(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteModalOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete Users"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Sheet */}
      <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <SheetContent className="sm:max-w-[550px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add User</SheetTitle>
            <SheetDescription>Create a new user account</SheetDescription>
          </SheetHeader>
          <Form {...formAdd}>
            <form
              onSubmit={formAdd.handleSubmit(handleAddUser)}
              className="space-y-6 mt-4"
            >
              <FormField
                control={formAdd.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={formLoading}
                        className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={formAdd.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        disabled={formLoading}
                        className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={formAdd.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showAddPassword ? "text" : "password"}
                          {...field}
                          disabled={formLoading}
                          className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowAddPassword(!showAddPassword)}
                        >
                          {showAddPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={formAdd.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Role
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset employee_role when changing role
                        if (value !== "employee") {
                          formAdd.setValue("employee_role", null);
                        }
                      }}
                      defaultValue={field.value}
                      disabled={formLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />
              {formAdd.watch("role") === "employee" && (
                <FormField
                  control={formAdd.control}
                  name="employee_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Employee Role
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                        disabled={formLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200">
                            <SelectValue placeholder="Select employee role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="call_center">
                            Call Center
                          </SelectItem>
                          <SelectItem value="packer">Packer</SelectItem>
                          <SelectItem value="deliveryman">
                            Delivery Person
                          </SelectItem>
                          <SelectItem value="accounts">Accounts</SelectItem>
                          <SelectItem value="incharge">Incharge</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={formAdd.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Avatar
                    </FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={formLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />
              <SheetFooter className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddSheetOpen(false)}
                  disabled={formLoading}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
                >
                  {formLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
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
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Edit User Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-[550px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit User</SheetTitle>
            <SheetDescription>Update user information</SheetDescription>
          </SheetHeader>
          <Form {...formEdit}>
            <form
              onSubmit={formEdit.handleSubmit(handleUpdateUser)}
              className="space-y-6 mt-4"
            >
              <FormField
                control={formEdit.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={formLoading}
                        className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={formEdit.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        disabled={formLoading}
                        className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />

              {/* Old Password Field - Required when updating password */}
              {formEdit.watch("password") &&
                formEdit.watch("password")?.trim() !== "" &&
                !bypassOldPassword && (
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">
                      Current Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showOldPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Enter current password"
                        disabled={formLoading}
                        className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                      >
                        {showOldPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Required to verify it's you before changing password
                    </p>
                  </div>
                )}

              {/* New Password Field with Show/Hide */}
              <FormField
                control={formEdit.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      New Password (leave empty to keep current)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          {...field}
                          placeholder="Leave empty to keep current password"
                          disabled={formLoading}
                          className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />

              {/* Bypass Old Password - Admin Only in Dev Mode */}
              {formEdit.watch("password") &&
                formEdit.watch("password")?.trim() !== "" &&
                isAdmin &&
                import.meta.env.DEV && (
                  <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <Checkbox
                      id="bypassPassword"
                      checked={bypassOldPassword}
                      onCheckedChange={(checked) =>
                        setBypassOldPassword(checked === true)
                      }
                      disabled={formLoading}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="bypassPassword"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-amber-600" />
                          <span className="text-amber-900">
                            Bypass old password verification (Dev Mode)
                          </span>
                        </div>
                      </label>
                      <p className="text-xs text-amber-700 mt-1">
                        Admin privilege: Update password without current
                        password verification
                      </p>
                    </div>
                  </div>
                )}

              <FormField
                control={formEdit.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Role
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset employee_role when changing role
                        if (value !== "employee") {
                          formEdit.setValue("employee_role", null);
                        }
                      }}
                      defaultValue={field.value}
                      disabled={formLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />
              {formEdit.watch("role") === "employee" && (
                <FormField
                  control={formEdit.control}
                  name="employee_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Employee Role
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                        disabled={formLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200">
                            <SelectValue placeholder="Select employee role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="call_center">
                            Call Center
                          </SelectItem>
                          <SelectItem value="packer">Packer</SelectItem>
                          <SelectItem value="deliveryman">
                            Delivery Person
                          </SelectItem>
                          <SelectItem value="accounts">Accounts</SelectItem>
                          <SelectItem value="incharge">Incharge</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={formEdit.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Avatar
                    </FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={formLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />
              <SheetFooter className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditSheetOpen(false)}
                  disabled={formLoading}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
                >
                  {formLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
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
                    </>
                  ) : (
                    "Update User"
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Delete User Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold">{selectedUser?.name}</span>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? "Deleting..." : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Users Table - Desktop View (hidden on mobile) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="hidden lg:block bg-white rounded-lg shadow-sm border overflow-hidden"
      >
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold w-12">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
                <TableHead className="font-semibold">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="font-semibold">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="font-semibold">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="font-semibold">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="font-semibold">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="font-semibold">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(perPage)].map((_, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {canPerformCRUD && (
                  <TableHead className="font-semibold w-12">
                    <Checkbox
                      checked={
                        displayUsers.length > 0 &&
                        selectedUsers.length === displayUsers.length
                      }
                      onCheckedChange={handleSelectAllUsers}
                      aria-label="Select all users"
                    />
                  </TableHead>
                )}
                <TableHead className="font-semibold">Avatar</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold">Created At</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayUsers.length > 0 ? (
                displayUsers.map((user) => (
                  <TableRow key={user._id} className="hover:bg-gray-50">
                    {canPerformCRUD && (
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user._id)}
                          onCheckedChange={(checked) =>
                            handleSelectUser(user._id, checked === true)
                          }
                          aria-label={`Select ${user.name}`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold shadow-sm overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-gray-600">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          className={cn("capitalize", getRoleColor(user.role))}
                        >
                          {user.role}
                        </Badge>
                        {user.role === "employee" && user.employee_role && (
                          <Badge
                            className={cn(
                              "capitalize text-xs",
                              getEmployeeRoleColor(user.employee_role)
                            )}
                          >
                            {user.employee_role}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(user)}
                          title="View user details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isAdmin && canPerformCRUD && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(user)}
                              title="Edit user"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete user"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {isAdmin && isReadOnly && (
                          <span className="text-xs text-muted-foreground px-2">
                            View only
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <Users className="h-12 w-12 text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          No users found
                        </p>
                        <p className="text-sm text-gray-500">
                          {searchTerm || roleFilter !== "all"
                            ? "Try adjusting your search or filters"
                            : "Users will appear here when they register"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </motion.div>

      {/* Users Cards - Mobile/Tablet View (hidden on desktop) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:hidden space-y-4"
      >
        {loading ? (
          // Loading skeleton for mobile cards
          [...Array(perPage)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border p-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-16 w-16 rounded-full" />
                </div>
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-24 mt-2" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-16" />
              </div>
            </div>
          ))
        ) : displayUsers.length > 0 ? (
          displayUsers.map((user) => (
            <div
              key={user._id}
              className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Avatar and Checkbox */}
                <div className="flex flex-col items-center gap-2">
                  <Checkbox
                    checked={selectedUsers.includes(user._id)}
                    onCheckedChange={(checked) =>
                      handleSelectUser(user._id, checked === true)
                    }
                    aria-label={`Select ${user.name}`}
                  />
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold shadow-sm overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* User Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>

                  {/* Roles */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge
                      className={cn("capitalize", getRoleColor(user.role))}
                    >
                      {user.role}
                    </Badge>
                    {user.role === "employee" && user.employee_role && (
                      <Badge
                        className={cn(
                          "capitalize text-xs",
                          getEmployeeRoleColor(user.employee_role)
                        )}
                      >
                        {user.employee_role}
                      </Badge>
                    )}
                  </div>

                  {/* Created Date */}
                  <p className="text-xs text-gray-500 mt-2">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(user)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user)}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-12">
            <div className="flex flex-col items-center gap-4">
              <Users className="h-12 w-12 text-gray-400" />
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">
                  No users found
                </p>
                <p className="text-sm text-gray-500">
                  {searchTerm || roleFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Users will appear here when they register"}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Pagination Controls */}
      {loading ? (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ) : (
        total > perPage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium">{(page - 1) * perPage + 1}</span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(page * perPage, total)}
                </span>{" "}
                of <span className="font-medium">{total}</span> users
              </div>
              <div className="text-sm text-gray-600">
                Page <span className="font-medium">{page}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={page === 1}
                className="disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page >= totalPages}
                className="disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )
      )}

      {/* Simple message for single page */}
      {!loading && total > 0 && total <= perPage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-gray-600 bg-white rounded-lg border border-gray-200 px-4 py-3"
        >
          Showing all <span className="font-medium">{total}</span> users
        </motion.div>
      )}

      {/* View User Sheet */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>View complete user information</SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold shadow-sm overflow-hidden">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedUser.name}
                  </h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge
                      className={cn(
                        "capitalize",
                        getRoleColor(selectedUser.role)
                      )}
                    >
                      {selectedUser.role}
                    </Badge>
                    {selectedUser.role === "employee" &&
                      selectedUser.employee_role && (
                        <Badge
                          className={cn(
                            "capitalize",
                            getEmployeeRoleColor(selectedUser.employee_role)
                          )}
                        >
                          {selectedUser.employee_role}
                        </Badge>
                      )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    User ID
                  </Label>
                  <p className="text-lg font-semibold">{selectedUser._id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Created At
                  </Label>
                  <p>{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Password Information Section (Dev Mode Only) */}
              {isAdmin && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Password Information (Dev Mode)
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewPassword}
                      disabled={loadingPassword}
                      className="flex items-center gap-2"
                    >
                      {loadingPassword ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : showPasswordInfo ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          View Password Info
                        </>
                      )}
                    </Button>
                  </div>

                  {showPasswordInfo && passwordInfo && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="bg-yellow-100 rounded-full p-1">
                          <Key className="h-4 w-4 text-yellow-700" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-800 mb-2">
                            {passwordInfo.message}
                          </p>
                          {passwordInfo.warning && (
                            <p className="text-xs text-red-600 mb-3 font-semibold">
                              {passwordInfo.warning}
                            </p>
                          )}

                          <div className="bg-white rounded border border-yellow-200 p-3 space-y-3">
                            <div>
                              <Label className="text-xs text-gray-600">
                                Email:
                              </Label>
                              <p className="text-sm font-mono">
                                {passwordInfo.email}
                              </p>
                            </div>

                            {/* Plain Password Display */}
                            {passwordInfo.available &&
                              passwordInfo.plainPassword && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <Label className="text-xs text-gray-600">
                                      Plain Password:
                                    </Label>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setShowPlainPassword(!showPlainPassword)
                                      }
                                      className="h-6 px-2 text-xs"
                                    >
                                      {showPlainPassword ? (
                                        <>
                                          <EyeOff className="h-3 w-3 mr-1" />
                                          Hide
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="h-3 w-3 mr-1" />
                                          Show
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                  <div className="bg-green-50 border border-green-300 p-2 rounded">
                                    <p className="text-sm font-mono font-semibold text-green-800">
                                      {showPlainPassword
                                        ? passwordInfo.plainPassword
                                        : "••••••••"}
                                    </p>
                                  </div>
                                </div>
                              )}

                            {/* Hashed Password */}
                            <div>
                              <Label className="text-xs text-gray-600">
                                Hashed Password (bcrypt):
                              </Label>
                              <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                                {passwordInfo.hashedPassword}
                              </p>
                            </div>

                            {/* Tip */}
                            {passwordInfo.tip && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                                <p className="text-xs text-blue-700">
                                  💡 <strong>Tip:</strong> {passwordInfo.tip}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
