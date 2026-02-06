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
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Store } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";

const VendorsPage = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();
  const { can } = usePermissions();
  const { toast } = useToast();

  useEffect(() => {
    fetchVendors();
  }, []);

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
        description: "Failed to load vendor requests",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    if (!can("manage_vendors")) {
      // Fallback or just proceed
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
      fetchVendors(); // Refresh list
    } catch (error) {
      console.error("Error updating vendor status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
        </div>

        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Requests</h1>
          <p className="text-muted-foreground mt-2">
            Manage vendor applications and approval status.
          </p>
        </div>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center h-24 text-muted-foreground"
                >
                  No vendor requests found.
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow key={vendor._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{vendor.storeName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{vendor.userId?.name || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">
                        {vendor.userId?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{vendor.contactEmail}</span>
                      <span className="text-muted-foreground">
                        {vendor.contactPhone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        vendor.status === "approved"
                          ? "default"
                          : vendor.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {vendor.status.charAt(0).toUpperCase() +
                        vendor.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {vendor.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatus(vendor._id, "rejected")}
                        >
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateStatus(vendor._id, "approved")}
                        >
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      </div>
                    )}
                    {vendor.status !== "pending" && (
                      <span className="text-sm text-muted-foreground italic">
                        {vendor.status === "approved"
                          ? "Active Vendor"
                          : "Application Rejected"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default VendorsPage;
