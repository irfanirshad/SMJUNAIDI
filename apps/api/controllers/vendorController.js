import Vendor from "../models/vendorModel.js";
import VendorConfig from "../models/vendorConfigModel.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import asyncHandler from "express-async-handler";
import uploadService from "../config/uploadService.js";

// @desc    Register a new vendor
// @route   POST /api/vendors
// @access  Private
const registerVendor = asyncHandler(async (req, res) => {
  const { storeName, description, logo, contactEmail, contactPhone, address } =
    req.body;

  const vendorExists = await Vendor.findOne({ userId: req.user._id });

  if (vendorExists) {
    res.status(400);
    throw new Error("User has already applied to be a vendor");
  }

  const vendor = await Vendor.create({
    userId: req.user._id,
    storeName,
    description,
    logo,
    contactEmail,
    contactPhone,
    address,
  });

  if (vendor) {
    res.status(201).json({
      success: true,
      data: vendor,
      message: "Vendor application submitted successfully",
    });
  } else {
    res.status(400);
    throw new Error("Invalid vendor data");
  }
});

// @desc    Create a new vendor by admin
// @route   POST /api/vendors/create
// @access  Private/Admin
const createVendorByAdmin = asyncHandler(async (req, res) => {
  const {
    userId,
    storeName,
    description,
    logo,
    contactEmail,
    contactPhone,
    address,
    status,
    role,
  } = req.body;

  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Update user role to vendor (or provided role)
  user.role = role || "vendor";
  await user.save();

  // Check if user already has a vendor account
  const vendorExists = await Vendor.findOne({ userId });
  if (vendorExists) {
    res.status(400);
    throw new Error("This user already has a vendor account");
  }

  // Handle logo image upload to Cloudinary if provided
  let logoUrl = "";
  if (logo) {
    const result = await uploadService.uploadImage(logo, {
      folder: "vendors",
      originalName: `vendor_${storeName.replace(/\s+/g, "_").toLowerCase()}.jpg`,
    });
    logoUrl = result.url;
  }

  // Create vendor with provided status or default to approved for admin creation
  const vendor = await Vendor.create({
    userId,
    storeName,
    description,
    logo: logoUrl || undefined,
    contactEmail,
    contactPhone,
    address,
    status: status || "approved", // Admin-created vendors are approved by default
  });

  // Populate userId for response
  await vendor.populate("userId", "name email");

  if (vendor) {
    res.status(201).json({
      success: true,
      data: vendor,
      message: "Vendor created successfully by admin",
    });
  } else {
    res.status(400);
    throw new Error("Invalid vendor data");
  }
});

// @desc    Get all vendor requests
// @route   GET /api/vendors/requests
// @access  Private/Admin
const getVendorRequests = asyncHandler(async (req, res) => {
  // Can filter by status if needed query param exists
  const status = req.query.status;
  const filter = status ? { status } : {};

  const vendors = await Vendor.find(filter).populate(
    "userId",
    "name email role"
  );

  res.json({
    success: true,
    count: vendors.length,
    vendors: vendors,
    data: vendors,
  });
});

// @desc    Get vendor status for current user
// @route   GET /api/vendors/me
// @access  Private
const getMyVendorStatus = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });

  if (!vendor) {
    // Return null instead of 404 for users without vendor profile
    return res.json({
      success: true,
      data: null,
      message: "No vendor profile found",
    });
  }

  res.json({
    success: true,
    data: vendor,
  });
});

// @desc    Update vendor status
// @route   PUT /api/vendors/:id/status
// @access  Private/Admin
const updateVendorStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const vendor = await Vendor.findById(req.params.id);

  if (!vendor) {
    res.status(404);
    throw new Error("Vendor not found");
  }

  vendor.status = status;
  await vendor.save();

  // If approved, update user role to vendor
  if (status === "approved") {
    const user = await User.findById(vendor.userId);
    if (user) {
      user.role = "vendor";
      await user.save();
    }
  } else if (status === "rejected" || status === "pending") {
    // Revert role to user if rejected or pending
    const user = await User.findById(vendor.userId);
    if (user && user.role === "vendor") {
      user.role = "user";
      await user.save();
    }
  }

  res.json({
    success: true,
    data: vendor,
    message: `Vendor status updated to ${status}`,
  });
});

// @desc    Get vendor configuration
// @route   GET /api/vendors/config
// @access  Private/Admin
const getVendorConfig = asyncHandler(async (req, res) => {
  let config = await VendorConfig.findOne();

  // If no config exists, create default
  if (!config) {
    config = await VendorConfig.create({
      vendorEnabled: true,
      defaultCommissionRate: 15,
      minOrderAmount: 0,
      allowVendorRegistration: true,
      requireApproval: true,
      maxProductsPerVendor: 1000,
    });
  }

  res.json({
    success: true,
    data: config,
  });
});

// @desc    Update vendor details by admin
// @route   PUT /api/vendors/:id
// @access  Private/Admin
const updateVendorDetails = asyncHandler(async (req, res) => {
  const {
    storeName,
    description,
    logo,
    contactEmail,
    contactPhone,
    address,
    status,
    role,
  } = req.body;

  const vendor = await Vendor.findById(req.params.id);

  if (!vendor) {
    res.status(404);
    throw new Error("Vendor not found");
  }

  // Update user role if provided
  if (role) {
    const user = await User.findById(vendor.userId);
    if (user) {
      user.role = role;
      await user.save();
    }
  }

  // Handle logo image upload to Cloudinary if provided and it's base64
  let logoUrl = vendor.logo; // Keep existing logo by default

  if (logo && logo !== vendor.logo) {
    // If logo is provided and different from current, check if it's base64
    if (logo.startsWith("data:image")) {
      // Replace old image with new one
      const result = await uploadService.replaceImage(logo, vendor.logo, {
        folder: "vendors",
        originalName: `vendor_${storeName.replace(/\s+/g, "_").toLowerCase()}.jpg`,
      });
      logoUrl = result.url;
    } else {
      // If it's already a URL, use it as-is
      logoUrl = logo;
    }
  }

  // Update vendor fields
  vendor.storeName = storeName || vendor.storeName;
  vendor.description = description || vendor.description;
  vendor.logo = logoUrl;
  vendor.contactEmail = contactEmail || vendor.contactEmail;
  vendor.contactPhone =
    contactPhone !== undefined ? contactPhone : vendor.contactPhone;
  vendor.address = address || vendor.address;
  vendor.status = status || vendor.status;

  const updatedVendor = await vendor.save();
  await updatedVendor.populate("userId", "name email role");

  res.json({
    success: true,
    data: updatedVendor,
    message: "Vendor updated successfully",
  });
});

// @desc    Update vendor configuration
// @route   PUT /api/vendors/config
// @access  Private/Admin
const updateVendorConfig = asyncHandler(async (req, res) => {
  const {
    vendorEnabled,
    defaultCommissionRate,
    minOrderAmount,
    allowVendorRegistration,
    requireApproval,
    maxProductsPerVendor,
  } = req.body;

  let config = await VendorConfig.findOne();

  if (!config) {
    // Create new config if it doesn't exist
    config = await VendorConfig.create(req.body);
  } else {
    // Update existing config
    config.vendorEnabled = vendorEnabled ?? config.vendorEnabled;
    config.defaultCommissionRate =
      defaultCommissionRate ?? config.defaultCommissionRate;
    config.minOrderAmount = minOrderAmount ?? config.minOrderAmount;
    config.allowVendorRegistration =
      allowVendorRegistration ?? config.allowVendorRegistration;
    config.requireApproval = requireApproval ?? config.requireApproval;
    config.maxProductsPerVendor =
      maxProductsPerVendor ?? config.maxProductsPerVendor;

    await config.save();
  }

  res.json({
    success: true,
    data: config,
    message: "Vendor configuration updated successfully",
  });
});

// @desc    Create a new product as vendor
// @route   POST /api/vendors/products
// @access  Private (Approved Vendors only)
const createVendorProduct = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });

  if (!vendor) {
    res.status(404);
    throw new Error("Vendor not found");
  }

  if (vendor.status !== "approved") {
    res.status(403);
    throw new Error("Only approved vendors can create products");
  }

  // Check vendor config for max products
  const config = await VendorConfig.findOne();
  if (config && config.maxProductsPerVendor) {
    const productCount = await Product.countDocuments({ vendor: vendor._id });
    if (productCount >= config.maxProductsPerVendor) {
      res.status(400);
      throw new Error(
        `Maximum product limit reached (${config.maxProductsPerVendor} products)`
      );
    }
  }

  const {
    name,
    description,
    price,
    comparePrice,
    purchasePrice,
    stock,
    image,
    images,
    category,
    brand,
    sku,
    productType = "base",
    discountPercentage,
  } = req.body;

  // Calculate profit margin if purchasePrice is provided
  let profitMargin = 0;
  if (purchasePrice && price) {
    profitMargin = ((price - purchasePrice) / price) * 100;
  }

  const product = await Product.create({
    name,
    description,
    price,
    purchasePrice: purchasePrice || 0,
    profitMargin,
    discountPercentage: discountPercentage || 0,
    stock,
    image,
    images: images || [image],
    category,
    brand,
    productType,
    vendor: vendor._id,
    approvalStatus: "pending", // Vendor products need admin approval
  });

  if (product) {
    res.status(201).json({
      success: true,
      data: product,
      message: "Product submitted successfully. Waiting for admin approval.",
    });
  } else {
    res.status(400);
    throw new Error("Invalid product data");
  }
});

// @desc    Get vendor's own products
// @route   GET /api/vendors/products?status=pending
// @access  Private (Vendor)
const getVendorProducts = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });

  if (!vendor) {
    res.status(404);
    throw new Error("Vendor not found");
  }

  const { status } = req.query;
  const filter = { vendor: vendor._id };

  if (status && status !== "all") {
    filter.approvalStatus = status;
  }

  const products = await Product.find(filter)
    .populate("category", "name")
    .populate("brand", "name")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    products,
  });
});

// @desc    Update vendor product
// @route   PUT /api/vendors/products/:id
// @access  Private (Vendor - own products only)
const updateVendorProduct = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });

  if (!vendor) {
    res.status(404);
    throw new Error("Vendor not found");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if product belongs to this vendor
  if (product.vendor.toString() !== vendor._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this product");
  }

  // Update fields
  const {
    name,
    description,
    price,
    purchasePrice,
    stock,
    image,
    images,
    category,
    brand,
  } = req.body;

  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price !== undefined ? price : product.price;
  product.purchasePrice =
    purchasePrice !== undefined ? purchasePrice : product.purchasePrice;
  product.stock = stock !== undefined ? stock : product.stock;
  product.image = image || product.image;
  product.images = images || product.images;
  product.category = category || product.category;
  product.brand = brand || product.brand;

  // Reset to pending if approved product is edited
  if (product.approvalStatus === "approved") {
    product.approvalStatus = "pending";
  }

  const updatedProduct = await product.save();

  res.json({
    success: true,
    data: updatedProduct,
    message: "Product updated successfully. Waiting for admin approval.",
  });
});

// @desc    Delete vendor product
// @route   DELETE /api/vendors/products/:id
// @access  Private (Vendor - own products only)
const deleteVendorProduct = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });

  if (!vendor) {
    res.status(404);
    throw new Error("Vendor not found");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if product belongs to this vendor
  if (product.vendor.toString() !== vendor._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this product");
  }

  // Delete associated images
  try {
    // Delete main image
    if (product.image) {
      await uploadService.deleteImage(product.image).catch((err) => {
        console.error("Failed to delete main image:", err.message);
      });
    }

    // Delete additional images
    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        await uploadService.deleteImage(imageUrl).catch((err) => {
          console.error("Failed to delete image:", err.message);
        });
      }
    }
  } catch (error) {
    console.error("Error deleting product images:", error.message);
    // Continue with product deletion even if image deletion fails
  }

  await product.deleteOne();

  res.json({
    success: true,
    message: "Product and associated images deleted successfully",
  });
});

// @desc    Get vendor dashboard statistics
// @route   GET /api/vendors/dashboard/stats
// @access  Private (Vendor)
const getVendorDashboardStats = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });

  if (!vendor) {
    res.status(404);
    throw new Error("Vendor not found");
  }

  // Get product counts
  const totalProducts = await Product.countDocuments({ vendor: vendor._id });
  const pendingProducts = await Product.countDocuments({
    vendor: vendor._id,
    approvalStatus: "pending",
  });

  // Get orders with vendor products
  const orders = await Order.find({
    "orderItems.vendor": vendor._id,
  });

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum, order) =>
      sum +
      order.orderItems
        .filter((item) => item.vendor?.toString() === vendor._id.toString())
        .reduce((itemSum, item) => itemSum + item.price * item.qty, 0),
    0
  );

  res.json({
    success: true,
    totalProducts,
    pendingProducts,
    totalOrders,
    totalRevenue,
  });
});

// @desc    Get approved vendors (public)
// @route   GET /api/vendors/approved
// @access  Public
const getApprovedVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find({ status: "approved" }).select(
    "_id storeName logo description"
  );

  res.json(vendors);
});

export {
  registerVendor,
  createVendorByAdmin,
  getVendorRequests,
  getMyVendorStatus,
  updateVendorStatus,
  updateVendorDetails,
  getVendorConfig,
  updateVendorConfig,
  createVendorProduct,
  getVendorProducts,
  updateVendorProduct,
  deleteVendorProduct,
  getVendorDashboardStats,
  getApprovedVendors,
};
