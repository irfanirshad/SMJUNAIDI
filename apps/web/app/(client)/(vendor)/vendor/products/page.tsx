"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Cookies from "js-cookie";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  PackageX,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  X as XIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  discountPercentage?: number;
  stock: number;
  image: string;
  images?: string[];
  productType?: string;
  category: {
    _id: string;
    name: string;
  };
  brand: {
    _id: string;
    name: string;
  };
  approvalStatus: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
}

interface Brand {
  _id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  discountPercentage: string;
  stock: string;
  category: string;
  brand: string;
  productType: string;
}

export default function VendorProductsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams?.get("status");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>(
    statusFilter || "all"
  );
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    discountPercentage: "10",
    stock: "",
    category: "",
    brand: "",
    productType: "base",
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, [filterStatus]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/categories`
      );
      if (response.ok) {
        const data = await response.json();
        // Handle different response formats
        const categoriesData = Array.isArray(data)
          ? data
          : data.categories || data.data || [];
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategories([]);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/brands`
      );
      if (response.ok) {
        const data = await response.json();
        // Handle different response formats
        const brandsData = Array.isArray(data)
          ? data
          : data.brands || data.data || [];
        setBrands(brandsData);
      }
    } catch (error) {
      console.error("Failed to fetch brands:", error);
      setBrands([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = Cookies.get("auth_token");
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/products`;

      if (filterStatus && filterStatus !== "all") {
        url += `?status=${filterStatus}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      alert("You can only upload up to 5 images");
      return;
    }

    setImages([...images, ...files]);

    // Create preview URLs
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreview([...imagePreview, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreview(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEditing = !!editingProduct;

    // For new products, require at least one new image
    // For editing, images are optional if product already has images
    if (!isEditing && images.length === 0 && imagePreview.length === 0) {
      alert("Please upload at least one product image");
      return;
    }

    setUploading(true);

    try {
      const token = Cookies.get("auth_token");

      // Upload new images if any
      const uploadedImages: string[] = [];
      for (const image of images) {
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });

        const base64Image = await base64Promise;

        const uploadResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              image: base64Image,
              folder: "vendor/products",
              originalName: image.name,
            }),
          }
        );

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          uploadedImages.push(url);
        } else {
          throw new Error("Failed to upload image");
        }
      }

      // Combine existing images (from imagePreview that are URLs) with newly uploaded ones
      const existingImages = imagePreview.filter((img) =>
        img.startsWith("http")
      );
      const allImages = [...existingImages, ...uploadedImages];

      // Create/Update product with images
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        discountPercentage: formData.discountPercentage
          ? parseFloat(formData.discountPercentage)
          : 10,
        stock: parseInt(formData.stock),
        category: formData.category,
        brand: formData.brand,
        productType: formData.productType,
        image: allImages[0],
        images: allImages,
        ...(isEditing ? {} : { approvalStatus: "pending" }),
      };

      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/products/${editingProduct._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/products`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          name: "",
          description: "",
          price: "",
          discountPercentage: "10",
          stock: "",
          category: "",
          brand: "",
          productType: "base",
        });
        setImages([]);
        setImagePreview([]);
        setIsAddProductOpen(false);
        setIsEditProductOpen(false);
        setEditingProduct(null);
        fetchProducts();

        toast.success(
          isEditing
            ? "Product Updated Successfully!"
            : "Product Added Successfully!",
          {
            description: isEditing
              ? `${formData.name} has been updated.`
              : `${formData.name} has been submitted and is pending admin approval.`,
            duration: 4000,
          }
        );
      } else {
        const error = await response.json();
        toast.error(
          isEditing ? "Failed to Update Product" : "Failed to Add Product",
          {
            description: error.message || "Please try again later.",
            duration: 4000,
          }
        );
      }
    } catch (error) {
      console.error(
        `Failed to ${isEditing ? "update" : "create"} product:`,
        error
      );
      toast.error(
        isEditing ? "Failed to Update Product" : "Failed to Add Product",
        {
          description: "An unexpected error occurred. Please try again.",
          duration: 4000,
        }
      );
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      discountPercentage: product.discountPercentage?.toString() || "10",
      stock: product.stock.toString(),
      category: product.category?._id || "",
      brand: product.brand?._id || "",
      productType: product.productType || "base",
    });
    // Set existing images
    if (product.images && product.images.length > 0) {
      setImagePreview(product.images);
    } else if (product.image) {
      setImagePreview([product.image]);
    }
    setImages([]);
    setIsEditProductOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      setDeleting(true);
      const token = Cookies.get("auth_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/products/${productToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Product Deleted", {
          description: `${productToDelete.name} has been deleted successfully.`,
          duration: 3000,
        });
        fetchProducts();
        setDeleteModalOpen(false);
        setProductToDelete(null);
      } else {
        const error = await response.json();
        toast.error("Failed to Delete Product", {
          description: error.message || "Please try again later.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to Delete Product", {
        description: "An unexpected error occurred. Please try again.",
        duration: 4000,
      });
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-babyshopSky/10 text-babyshopSky border-babyshopSky/20",
      rejected: "bg-babyshopRed/10 text-babyshopRed border-babyshopRed/20",
    };

    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
    };

    const StatusIcon = icons[status as keyof typeof icons];

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          styles[status as keyof typeof styles]
        }`}
      >
        <StatusIcon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-babyShopLightWhite rounded animate-pulse"></div>
        <div className="h-64 bg-babyShopLightWhite rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-babyshopBlack">My Products</h1>
        <button
          onClick={() => setIsAddProductOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-babyshopPurple hover:bg-babyshopPurple/90 text-babyshopWhite px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-babyshopWhite rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-babyshopTextLight" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="bg-babyshopWhite rounded-lg shadow p-12 text-center">
          <PackageX className="h-16 w-16 text-babyshopTextLight mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-babyshopBlack mb-2">
            No products found
          </h3>
          <p className="text-babyshopTextLight mb-6">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Start by adding your first product"}
          </p>
          <button
            onClick={() => setIsAddProductOpen(true)}
            className="inline-flex items-center gap-2 bg-babyshopPurple hover:bg-babyshopPurple/90 text-babyshopWhite px-6 py-3 rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="h-5 w-5" />
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="bg-babyshopWhite rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative h-10 w-10 shrink-0">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="rounded object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.brand?.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.category?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${product.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.stock}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(product.approvalStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/product/${product._id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          title="View Product"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </Link>
                        <button
                          onClick={() => handleEditClick(product)}
                          className="p-1.5 rounded-lg text-babyshopSky hover:text-babyshopSky/80 hover:bg-babyshopSky/10 transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="h-4.5 w-4.5" />
                        </button>
                        {product.approvalStatus === "pending" && (
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Product Sheet */}
      <Sheet open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-babyshopWhite border-b px-6 py-4">
            <SheetHeader>
              <SheetTitle className="text-babyshopBlack text-xl">
                Edit Product
              </SheetTitle>
              <SheetDescription className="text-babyshopTextLight">
                Update your product details. Changes will be saved immediately.
              </SheetDescription>
            </SheetHeader>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Product Images */}
            <div>
              <label className="block text-sm font-medium text-babyshopBlack mb-2">
                Product Images (Max 5) *
              </label>
              <div className="grid grid-cols-5 gap-3">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-babyshopRed text-babyshopWhite rounded-full p-1 hover:bg-babyshopRed/90"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {imagePreview.length < 5 && (
                  <label className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-babyshopPurple cursor-pointer flex flex-col items-center justify-center bg-babyShopLightWhite">
                    <Upload className="h-6 w-6 text-babyshopTextLight" />
                    <span className="text-xs text-babyshopTextLight mt-1">
                      Upload
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-babyshopBlack mb-2">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                placeholder="Enter product name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-babyshopBlack mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                placeholder="Enter product description"
              />
            </div>

            {/* Category & Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-babyshopBlack mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-babyshopBlack mb-2">
                  Brand *
                </label>
                <select
                  required
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                >
                  <option value="">Select brand</option>
                  {brands.map((brand) => (
                    <option key={brand._id} value={brand._id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price & Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-babyshopBlack mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-babyshopBlack mb-2">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountPercentage: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Stock & Product Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-babyshopBlack mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-babyshopBlack mb-2">
                  Product Type *
                </label>
                <select
                  required
                  value={formData.productType}
                  onChange={(e) =>
                    setFormData({ ...formData, productType: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                >
                  <option value="base">Base</option>
                  <option value="trending">Trending</option>
                  <option value="featured">Featured</option>
                  <option value="deals">Deals</option>
                  <option value="new-arrival">New Arrival</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-babyshopWhite -mx-6 px-6 pb-6 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsEditProductOpen(false);
                  setEditingProduct(null);
                  setFormData({
                    name: "",
                    description: "",
                    price: "",
                    discountPercentage: "10",
                    stock: "",
                    category: "",
                    brand: "",
                    productType: "base",
                  });
                  setImages([]);
                  setImagePreview([]);
                }}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-babyshopBlack rounded-lg hover:bg-babyShopLightWhite transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-4 py-2.5 bg-babyshopPurple text-babyshopWhite rounded-lg hover:bg-babyshopPurple/90 transition-all disabled:opacity-50 shadow-sm hover:shadow-md font-medium"
              >
                {uploading ? "Updating..." : "Update Product"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Add Product Sheet */}
      <Sheet open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-babyshopWhite border-b px-6 py-4">
            <SheetHeader>
              <SheetTitle className="text-babyshopBlack text-xl">
                Add New Product
              </SheetTitle>
              <SheetDescription className="text-babyshopTextLight">
                Add a new product to your store. All products require admin
                approval before going live.
              </SheetDescription>
            </SheetHeader>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Product Images */}
            <div>
              <label className="block text-sm font-medium text-babyshopBlack mb-2">
                Product Images (Max 5) *
              </label>
              <div className="grid grid-cols-5 gap-3">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-babyshopRed text-babyshopWhite rounded-full p-1 hover:bg-babyshopRed/90"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-babyshopPurple cursor-pointer flex flex-col items-center justify-center bg-babyShopLightWhite">
                    <Upload className="h-6 w-6 text-babyshopTextLight" />
                    <span className="text-xs text-babyshopTextLight mt-1">
                      Upload
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-babyshopBlack mb-2">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                placeholder="Enter product name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-babyshopBlack mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                placeholder="Enter product description"
              />
            </div>

            {/* Category & Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-babyshopBlack mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-babyshopBlack mb-2">
                  Brand *
                </label>
                <select
                  required
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                >
                  <option value="">Select brand</option>
                  {brands.map((brand) => (
                    <option key={brand._id} value={brand._id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price & Compare Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-babyshopBlack mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-babyshopBlack mb-2">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountPercentage: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Stock & Product Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-babyshopBlack mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-babyshopBlack mb-2">
                  Product Type *
                </label>
                <select
                  required
                  value={formData.productType}
                  onChange={(e) =>
                    setFormData({ ...formData, productType: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-babyshopPurple focus:border-transparent"
                >
                  <option value="base">Base</option>
                  <option value="trending">Trending</option>
                  <option value="featured">Featured</option>
                  <option value="deals">Deals</option>
                  <option value="new-arrival">New Arrival</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-babyshopWhite -mx-6 px-6 pb-6 mt-6">
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-babyshopBlack rounded-lg hover:bg-babyShopLightWhite transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-4 py-2.5 bg-babyshopPurple text-babyshopWhite rounded-lg hover:bg-babyshopPurple/90 transition-all disabled:opacity-50 shadow-sm hover:shadow-md font-medium"
              >
                {uploading ? "Creating..." : "Create Product"}
              </button>
            </div>

            {/* Info Message */}
            <div className="bg-babyshopSky/10 border border-babyshopSky/20 rounded-lg p-4 mx-0">
              <p className="text-sm text-babyshopSky">
                <strong>Note:</strong> Your product will be submitted for admin
                approval. Once approved, it will be visible to customers in the
                store.
              </p>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="bg-babyshopWhite">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-babyshopBlack flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription className="text-babyshopTextLight">
              {productToDelete && (
                <>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-babyshopBlack">
                    {productToDelete.name}
                  </span>
                  ? This action cannot be undone and will permanently remove the
                  product from your store.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <XCircle className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Product
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
