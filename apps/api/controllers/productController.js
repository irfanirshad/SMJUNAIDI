import asyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import ProductType from "../models/productTypeModel.js";
import uploadService from "../config/uploadService.js";
import {
  extractDominantColors,
  extractColorsFromUrl,
  calculateColorSimilarity,
} from "../utils/imageMatching.js";
import { getCachedProductColors } from "../utils/imageCache.js";

// @desc    Get all products with pagination, sorting, and filtering
// @route   GET /api/products?page=<page>&limit=<limit>&sortOrder=<asc|desc>&category=<categoryId>&priceMin=<min>&priceMax=<max>
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit,
    perPage,
    sortOrder = "asc",
    category,
    brand,
    priceMin,
    priceMax,
    search,
    productType,
    excludeProductType,
    vendor,
    approvalStatus,
  } = req.query;

  // Use perPage if provided, otherwise use limit, default to 10
  const itemsPerPage = perPage || limit || 10;

  // Validate page and limit
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(itemsPerPage);
  if (pageNumber < 1 || limitNumber < 1) {
    res.status(400);
    throw new Error("Page and limit must be positive integers");
  }

  // Validate sortOrder
  if (!["asc", "desc"].includes(sortOrder)) {
    res.status(400);
    throw new Error('Sort order must be "asc" or "desc"');
  }

  // Build query
  const query = {};

  // Handle approval status filter
  if (approvalStatus) {
    query.approvalStatus = approvalStatus;
  } else {
    // Default: Show products that are either approved OR don't have approvalStatus field (legacy/admin products)
    // Only hide pending and rejected vendor products
    query.$or = [
      { approvalStatus: "approved" },
      { approvalStatus: { $exists: false } },
      { approvalStatus: null },
    ];
  }

  if (category) query.category = category;
  if (brand) query.brand = brand;

  // Handle productType filter - lookup ProductType by type field to get ObjectId
  if (productType) {
    const productTypeDoc = await ProductType.findOne({ type: productType });
    if (productTypeDoc) {
      query.productType = productTypeDoc._id;
    }
  }

  if (excludeProductType) {
    const excludeProductTypeDoc = await ProductType.findOne({
      type: excludeProductType,
    });
    if (excludeProductTypeDoc) {
      query.productType = { $ne: excludeProductTypeDoc._id };
    }
  }

  // Handle vendor filter
  if (vendor === "no-vendor") {
    // Filter to show only admin products (no vendor)
    query.vendor = { $in: [null, undefined] };
  } else if (vendor === "vendor-products") {
    // Filter to show all vendor products (any vendor)
    query.vendor = { $exists: true, $ne: null };
  } else if (vendor) {
    // Filter by specific vendor ID
    query.vendor = vendor;
  }

  if (priceMin || priceMax) {
    query.price = {};
    if (priceMin) query.price.$gte = Number(priceMin);
    if (priceMax) {
      query.price.$lte =
        Number(priceMax) === Infinity
          ? Number.MAX_SAFE_INTEGER
          : Number(priceMax);
    }
  }

  if (search) {
    query.name = { $regex: search, $options: "i" }; // Case-insensitive search
  }

  // Pagination
  const skip = (pageNumber - 1) * limitNumber;

  // Fetch products and total count
  const sortValue = sortOrder === "asc" ? 1 : -1;
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("category", "name")
      .populate("brand", "name")
      .populate("vendor", "storeName")
      .populate("productType", "name type color displayOrder")
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: sortValue }),
    Product.countDocuments(query),
  ]);

  res.json({
    products,
    total,
  });
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let product;

  // Check if it's a valid MongoDB ObjectId
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  if (isValidObjectId) {
    // Try to find by ID first
    product = await Product.findById(id)
      .populate("category", "name")
      .populate("brand", "name")
      .populate("productType", "name type color displayOrder");
  }

  // If not found by ID or not a valid ObjectId, try to find by slug
  if (!product) {
    product = await Product.findOne({ slug: id })
      .populate("category", "name")
      .populate("brand", "name")
      .populate("productType", "name type color displayOrder");
  }

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    category,
    brand,
    image,
    images,
    discountPercentage,
    stock,
    productType,
  } = req.body;

  // Check if product with same name exists
  const productExists = await Product.findOne({ name });
  if (productExists) {
    res.status(400);
    throw new Error("Product with this name already exists");
  }

  // Get max images from environment or default to 5
  const maxImages = parseInt(process.env.MAX_PRODUCT_IMAGES) || 5;

  // Handle images array if provided, otherwise use single image
  let uploadedImages = [];

  if (images && Array.isArray(images) && images.length > 0) {
    // Limit to max images
    const imagesToUpload = images.slice(0, maxImages);

    // Upload all images
    for (let i = 0; i < imagesToUpload.length; i++) {
      const result = await uploadService.uploadImage(imagesToUpload[i], {
        folder: "products",
        originalName: `product_${name.replace(/\s+/g, "_").toLowerCase()}_${i + 1}.jpg`,
      });
      uploadedImages.push(result.url);
    }
  } else if (image) {
    // Backward compatibility: if single image provided, use it
    const result = await uploadService.uploadImage(image, {
      folder: "products",
      originalName: `product_${name.replace(/\s+/g, "_").toLowerCase()}.jpg`,
    });
    uploadedImages.push(result.url);
  }

  // Ensure at least one image
  if (uploadedImages.length === 0) {
    res.status(400);
    throw new Error("At least one product image is required");
  }

  // Determine approval status based on user role
  const approvalStatus = req.user.role === "vendor" ? "pending" : "approved";

  // Get vendor ID if user is a vendor
  let vendorId = null;
  if (req.user.role === "vendor") {
    const Vendor = (await import("../models/vendorModel.js")).default;
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (vendor) {
      vendorId = vendor._id;
    }
  }

  const product = await Product.create({
    name,
    description,
    price,
    category,
    brand,
    discountPercentage: discountPercentage || 0,
    stock: stock || 0,
    images: uploadedImages,
    image: uploadedImages[0], // Set first image as primary
    productType: productType || "base",
    approvalStatus,
    vendor: vendorId,
  });

  if (product) {
    res.status(201).json(product);
  } else {
    res.status(400);
    throw new Error("Invalid product data");
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    category,
    brand,
    image,
    images,
    discountPercentage,
    stock,
    productType,
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    // Check if new name is already taken by another product
    if (name !== product.name) {
      const productExists = await Product.findOne({ name });
      if (productExists) {
        res.status(400);
        throw new Error("Product with this name already exists");
      }
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.discountPercentage =
      discountPercentage !== undefined
        ? discountPercentage
        : product.discountPercentage;
    product.stock = stock !== undefined ? stock : product.stock;
    product.productType = productType || product.productType;

    // Get max images from environment or default to 5
    const maxImages = parseInt(process.env.MAX_PRODUCT_IMAGES) || 5;

    // Update images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      const uploadedImages = [];
      const oldImages = product.images || [product.image];

      // Limit to max images
      const imagesToProcess = images.slice(0, maxImages);

      for (let i = 0; i < imagesToProcess.length; i++) {
        const img = imagesToProcess[i];

        // If image URL is already in product images, keep it (no re-upload)
        if (oldImages.includes(img)) {
          uploadedImages.push(img);
        } else {
          // New image - upload it
          try {
            const result = await uploadService.uploadImage(img, {
              folder: "products",
              originalName: `product_${(name || product.name)
                .replace(/\s+/g, "_")
                .toLowerCase()}_${i + 1}.jpg`,
            });
            uploadedImages.push(result.url);
          } catch (error) {
            console.error("Error uploading image:", error);
            // Continue with other images even if one fails
          }
        }
      }

      // Clean up old images that are no longer used
      const imagesToDelete = oldImages.filter(
        (oldImg) => !uploadedImages.includes(oldImg)
      );
      for (const oldImg of imagesToDelete) {
        try {
          await uploadService.deleteImage(oldImg);
        } catch (error) {
          console.error("Error deleting old image:", error);
          // Continue even if deletion fails
        }
      }

      if (uploadedImages.length > 0) {
        product.images = uploadedImages;
        product.image = uploadedImages[0]; // Set first image as primary
      }
    } else if (image && image !== product.image) {
      // Backward compatibility: single image update
      const result = await uploadService.replaceImage(image, product.image, {
        folder: "products",
        originalName: `product_${(name || product.name)
          .replace(/\s+/g, "_")
          .toLowerCase()}.jpg`,
      });
      product.image = result.url;
      product.images = [result.url];
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Rate a product
// @route   POST /api/products/:id/rate
// @access  Private
const rateProduct = asyncHandler(async (req, res) => {
  const { rating } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyRated = product.ratings.find(
      (r) => r.userId.toString() === req.user._id.toString()
    );

    if (alreadyRated) {
      // Update existing rating
      alreadyRated.rating = rating;
    } else {
      // Add new rating
      product.ratings.push({
        userId: req.user._id,
        rating,
      });
    }

    await product.save();
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    // Delete associated image before deleting the product
    if (product.image) {
      try {
        await uploadService.deleteImage(product.image);
      } catch (error) {
        console.error(`Failed to delete product image: ${error.message}`);
        // Continue with product deletion even if image deletion fails
      }
    }

    await product.deleteOne();
    res.json({
      message: "Product and associated image removed successfully",
      deletedImage: product.image || null,
    });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Track product view
// @route   POST /api/products/:id/view
// @access  Public
const trackProductView = asyncHandler(async (req, res) => {
  try {
    // Use atomic update to avoid version conflicts
    const updateData = {
      $inc: { viewCount: 1 },
      $push: {
        views: {
          userId: req.user?._id || null,
          viewedAt: new Date(),
        },
      },
    };

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: false,
    });

    if (product) {
      res.json({ viewCount: product.viewCount });
    } else {
      res.status(404);
      throw new Error("Product not found");
    }
  } catch (error) {
    console.error("Error tracking product view:", error);
    res.status(500);
    throw new Error("Failed to track product view");
  }
});

// @desc    Add a product review
// @route   POST /api/products/:id/review
// @access  Private
const addProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (!rating || !comment) {
    res.status(400);
    throw new Error("Please provide both rating and comment");
  }

  if (rating < 1 || rating > 5) {
    res.status(400);
    throw new Error("Rating must be between 1 and 5");
  }

  // Initialize reviews array if it doesn't exist
  if (!product.reviews) {
    product.reviews = [];
  }

  // Check if user already reviewed this product
  const alreadyReviewed = product.reviews.find(
    (r) => r.userId.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    res.status(400);
    throw new Error("You have already reviewed this product");
  }

  const review = {
    userId: req.user._id,
    userName: req.user.name,
    rating: Number(rating),
    comment,
    isApproved: false, // Requires admin approval
    createdAt: new Date(),
  };

  product.reviews.push(review);
  await product.save();

  res.status(201).json({
    message:
      "Review submitted successfully. It will be visible after admin approval.",
    review,
  });
});

// @desc    Get pending reviews (Admin)
// @route   GET /api/products/reviews/pending
// @access  Private/Admin
const getPendingReviews = asyncHandler(async (req, res) => {
  const products = await Product.find({
    "reviews.isApproved": false,
  }).select("name reviews");

  const pendingReviews = [];
  products.forEach((product) => {
    product.reviews.forEach((review) => {
      if (!review.isApproved) {
        pendingReviews.push({
          productId: product._id,
          productName: product.name,
          reviewId: review._id,
          userId: review.userId,
          userName: review.userName,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        });
      }
    });
  });

  res.json(pendingReviews);
});

// @desc    Get approved reviews (Admin)
// @route   GET /api/products/reviews/approved
// @access  Private/Admin
const getApprovedReviews = asyncHandler(async (req, res) => {
  const products = await Product.find({
    "reviews.isApproved": true,
  }).select("name reviews");

  const approvedReviews = [];
  products.forEach((product) => {
    product.reviews.forEach((review) => {
      if (review.isApproved) {
        approvedReviews.push({
          productId: product._id,
          productName: product.name,
          reviewId: review._id,
          userId: review.userId,
          userName: review.userName,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        });
      }
    });
  });

  res.json(approvedReviews);
});

// @desc    Approve/Reject product review
// @route   PUT /api/products/:productId/review/:reviewId
// @access  Private/Admin
const approveReview = asyncHandler(async (req, res) => {
  const { approve } = req.body; // true to approve, false to reject
  const product = await Product.findById(req.params.productId);

  if (product) {
    const review = product.reviews.id(req.params.reviewId);

    if (review) {
      if (approve) {
        review.isApproved = true;
        await product.save();
        res.json({ message: "Review approved successfully", review });
      } else {
        // Remove the review if rejected
        product.reviews.pull(req.params.reviewId);
        await product.save();
        res.json({ message: "Review rejected and removed" });
      }
    } else {
      res.status(404);
      throw new Error("Review not found");
    }
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Get pending products (Admin)
// @route   GET /api/products/pending
// @access  Private/Admin
const getPendingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ approvalStatus: "pending" })
    .populate("category", "name")
    .populate("brand", "name")
    .populate("vendor", "storeName contactEmail")
    .populate("productType", "name type color displayOrder");

  res.json({
    success: true,
    count: products.length,
    products,
  });
});

// @desc    Get vendor products (Admin: all vendor products, Vendor: own products)
// @route   GET /api/products/vendor (Admin)
// @route   GET /api/products/vendor/me (Vendor)
// @access  Private/Admin or Private/Vendor
const getVendorProducts = asyncHandler(async (req, res) => {
  // If admin is requesting, get all vendor products
  if (req.user.role === "admin") {
    const { status, vendor } = req.query;

    // Build query filter
    const filter = { vendor: { $exists: true } };

    // Add status filter if provided
    if (status && status !== "all") {
      filter.approvalStatus = status;
    }

    // Add vendor filter if provided
    if (vendor && vendor !== "all") {
      filter.vendor = vendor;
    }

    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("brand", "name")
      .populate("vendor", "businessName email")
      .populate("productType", "name type color displayOrder")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: products.length,
      products,
    });
  }

  // If vendor is requesting, get their own products
  const Vendor = (await import("../models/vendorModel.js")).default;
  const vendor = await Vendor.findOne({ userId: req.user._id });

  if (!vendor) {
    res.status(404);
    throw new Error("Vendor profile not found");
  }

  const products = await Product.find({ vendor: vendor._id })
    .populate("category", "name")
    .populate("brand", "name")
    .populate("productType", "name type color displayOrder")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: products.length,
    products,
  });
});

// @desc    Approve/Reject product (for vendor products)
// @route   PUT /api/products/:id/approve
// @route   PUT /api/products/:id/approval
// @access  Private/Admin
const approveProduct = asyncHandler(async (req, res) => {
  const { approve, approvalStatus } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Handle both formats: { approve: true/false } and { approvalStatus: "approved"/"rejected" }
  if (approvalStatus) {
    product.approvalStatus = approvalStatus;
    await product.save();
    res.json({
      message: `Product ${approvalStatus} successfully`,
      product,
    });
  } else if (approve !== undefined) {
    product.approvalStatus = approve ? "approved" : "rejected";
    await product.save();
    res.json({
      message: `Product ${approve ? "approved" : "rejected"} successfully`,
      product,
    });
  } else {
    res.status(400);
    throw new Error("Please provide either 'approve' or 'approvalStatus'");
  }
});

// @desc    Bulk create products
// @route   POST /api/products/bulk
// @access  Private/Admin
const bulkCreateProducts = asyncHandler(async (req, res) => {
  const { products } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    res.status(400);
    throw new Error("Products array is required");
  }

  if (products.length > 100) {
    res.status(400);
    throw new Error("Cannot upload more than 100 products at once");
  }

  const results = {
    successful: [],
    failed: [],
  };

  for (const [index, productData] of products.entries()) {
    try {
      // Validate required fields
      if (
        !productData.name ||
        !productData.description ||
        !productData.category ||
        !productData.brand
      ) {
        results.failed.push({
          index: index + 1,
          data: productData,
          error: "Missing required fields",
        });
        continue;
      }

      // Check if product already exists
      const existingProduct = await Product.findOne({ name: productData.name });
      if (existingProduct) {
        results.failed.push({
          index: index + 1,
          data: productData,
          error: `Product "${productData.name}" already exists`,
        });
        continue;
      }

      // Create product
      const product = await Product.create({
        name: productData.name,
        description: productData.description,
        price: productData.price || 0,
        discountPercentage: productData.discountPercentage || 0,
        stock: productData.stock || 0,
        category: productData.category,
        brand: productData.brand,
        images: productData.images || [],
        image: productData.images?.[0] || "",
        productType: productData.productType || "base",
      });

      results.successful.push({
        index: index + 1,
        product: product,
      });
    } catch (error) {
      results.failed.push({
        index: index + 1,
        data: productData,
        error: error.message,
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `Successfully created ${results.successful.length} of ${products.length} products`,
    results,
  });
});

// @desc    Search products by image
// @route   POST /api/products/search-by-image
// @access  Public
const searchProductsByImage = asyncHandler(async (req, res) => {
  // Check if image was uploaded
  if (!req.file) {
    res.status(400);
    throw new Error("Please upload an image");
  }

  try {
    // Extract dominant colors from uploaded image
    const uploadedImageColors = await extractDominantColors(req.file.buffer);

    if (uploadedImageColors.length === 0) {
      console.warn("Could not extract colors from uploaded image");
    }

    // Get all products with images
    const allProducts = await Product.find({
      image: { $exists: true, $ne: "" },
    })
      .populate("category", "name")
      .populate("brand", "name")
      .populate("productType", "name type color displayOrder")
      .select(
        "name description price image images category brand stock averageRating numReviews discountPercentage"
      )
      .lean();

    // Calculate similarity for each product
    const productsWithSimilarity = await Promise.all(
      allProducts.map(async (product) => {
        try {
          // Extract colors from product's main image (with caching)
          const productColors = await getCachedProductColors(
            product.image,
            extractColorsFromUrl
          );

          if (productColors.length === 0) {
            return { ...product, similarity: 0 };
          }

          // Calculate similarity score
          const similarity = calculateColorSimilarity(
            uploadedImageColors,
            productColors
          );

          return { ...product, similarity };
        } catch (error) {
          console.error(
            `Error processing product ${product._id}:`,
            error.message
          );
          return { ...product, similarity: 0 };
        }
      })
    );

    // Sort by similarity (highest first) and filter out low similarity scores
    const similarProducts = productsWithSimilarity
      .filter((product) => product.similarity > 60) // Only products with >60% similarity (stricter matching)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 8); // Return top 8 matches

    // If less than 3 very similar products, try relaxed threshold
    if (similarProducts.length < 3) {
      const relaxedProducts = productsWithSimilarity
        .filter((product) => product.similarity > 45)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 8);

      // If still no matches, return empty result - don't show unrelated products
      if (relaxedProducts.length === 0) {
        return res.json({
          products: [],
          total: 0,
          message:
            "No matching products found for this image. Please try uploading a product image.",
          similaritySearch: false,
        });
      }

      // Use relaxed results
      const cleanProducts = relaxedProducts.map(
        ({ similarity, ...product }) => ({
          ...product,
          matchScore: Math.round(similarity),
        })
      );

      return res.json({
        products: cleanProducts,
        total: cleanProducts.length,
        message: "Products with moderate visual similarity",
        similaritySearch: true,
      });
    }

    // Remove similarity field before sending response
    const cleanProducts = similarProducts.map(({ similarity, ...product }) => ({
      ...product,
      matchScore: Math.round(similarity), // Include match score for reference
    }));

    res.json({
      products: cleanProducts,
      total: cleanProducts.length,
      message: "Products matched by visual similarity",
      similaritySearch: true,
    });
  } catch (error) {
    console.error("Image search error:", error);

    // Return empty result on error - don't show unrelated products
    res.json({
      products: [],
      total: 0,
      message:
        "Image analysis failed. Please try again with a different image.",
      error: error.message,
      similaritySearch: false,
    });
  }
});

export {
  getProducts,
  getProductById,
  getProductById as getSingleProduct,
  createProduct,
  updateProduct,
  rateProduct,
  deleteProduct,
  trackProductView,
  addProductReview,
  getPendingReviews,
  getApprovedReviews,
  approveReview,
  getPendingProducts,
  getVendorProducts,
  approveProduct,
  bulkCreateProducts,
  searchProductsByImage,
};
