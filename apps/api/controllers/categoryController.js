import asyncHandler from "express-async-handler";
import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import uploadService from "../config/uploadService.js";

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 20;
  const sortOrder = req.query.sortOrder || "asc";
  const parentId = req.query.parent;
  const categoryType = req.query.categoryType;

  // Validate page and perPage
  if (page < 1 || perPage < 1) {
    res.status(400);
    throw new Error("Page and perPage must be positive integers");
  }

  // Validate sortOrder
  if (!["asc", "desc"].includes(sortOrder)) {
    res.status(400);
    throw new Error('Sort order must be "asc" or "desc"');
  }

  const filter = {
    isActive: true,
  };

  // Only filter by parent if explicitly specified
  if (parentId !== undefined) {
    filter.parent = parentId === "null" ? null : parentId;
  }

  // Filter by categoryType if specified
  if (categoryType) {
    filter.categoryType = categoryType;
  }


  const skip = (page - 1) * perPage;
  const total = await Category.countDocuments(filter);
  const sortValue = sortOrder === "asc" ? 1 : -1;
  const categories = await Category.find(filter)
    .populate("parent", "name slug")
    .skip(skip)
    .limit(perPage)
    .sort({ order: 1, createdAt: sortValue });


  const totalPages = Math.ceil(total / perPage);

  res.json({ categories, total, page, perPage, totalPages });
});

// @desc    Get category tree (hierarchical structure)
// @route   GET /api/categories/tree
// @access  Public
const getCategoryTree = asyncHandler(async (req, res) => {
  const tree = await Category.getTree();
  res.json(tree);
});

// @desc    Get all subcategories of a category
// @route   GET /api/categories/:id/subcategories
// @access  Public
const getSubcategories = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const subcategories = await Category.find({
    parent: category._id,
    isActive: true,
  }).sort({ order: 1, name: 1 });

  res.json(subcategories);
});

// @desc    Get all categories for admin with advanced filtering
// @route   GET /api/categories/admin
// @access  Private (Admin)
const getCategoriesAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  const sortOrder = req.query.sortOrder || "desc";
  const search = req.query.search;
  const categoryType = req.query.categoryType;
  const parentId = req.query.parent;
  const level = req.query.level;

  // Validate page and perPage
  if (page < 1 || perPage < 1) {
    res.status(400);
    throw new Error("Page and perPage must be positive integers");
  }

  // Validate sortOrder
  if (!["asc", "desc"].includes(sortOrder)) {
    res.status(400);
    throw new Error('Sort order must be "asc" or "desc"');
  }

  // Build filter object
  const filter = {};

  // Search filter
  if (search && search.trim()) {
    filter.name = { $regex: search.trim(), $options: "i" };
  }

  // Category type filter
  if (categoryType && categoryType !== "all") {
    filter.categoryType = categoryType;
  }

  // Parent filter
  if (parentId !== undefined) {
    filter.parent = parentId === "null" || parentId === "" ? null : parentId;
  }

  // Level filter
  if (level !== undefined) {
    filter.level = parseInt(level);
  }

  const skip = (page - 1) * perPage;
  const total = await Category.countDocuments(filter);
  const sortValue = sortOrder === "asc" ? 1 : -1;

  const categories = await Category.find(filter)
    .populate("parent", "name slug level")
    .skip(skip)
    .limit(perPage)
    .sort({ level: 1, order: 1, createdAt: sortValue });

  // Add children count to each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const childrenCount = await Category.countDocuments({
        parent: category._id,
      });
      const productCount = await Product.countDocuments({
        category: category._id,
      });
      return {
        ...category.toObject(),
        childrenCount,
        productCount,
      };
    })
  );

  const totalPages = Math.ceil(total / perPage);

  res.json({
    categories: categoriesWithCount,
    total,
    page,
    perPage,
    totalPages,
  });
});

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Private
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).populate(
    "parent",
    "name slug level"
  );

  if (category) {
    // Get ancestors
    const ancestors = await category.getAncestors();
    // Get children
    const children = await Category.find({ parent: category._id }).sort({
      order: 1,
      name: 1,
    });

    res.json({
      ...category.toObject(),
      ancestors,
      children,
    });
  } else {
    res.status(404);
    throw new Error("Category not found");
  }
});

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  const { name, image, categoryType, parent, order, description } = req.body;

  // Validate inputs
  if (!name || typeof name !== "string") {
    res.status(400);
    throw new Error("Category name is required and must be a string");
  }

  // Validate categoryType
  const validCategoryTypes = ["Featured", "Hot Categories", "Top Categories"];
  if (!validCategoryTypes.includes(categoryType)) {
    res.status(400);
    throw new Error("Invalid category type");
  }

  // Validate parent if provided
  if (parent) {
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      res.status(400);
      throw new Error("Parent category not found");
    }
    // Optional: Add max depth validation
    if (parentCategory.level >= 3) {
      res.status(400);
      throw new Error("Maximum category depth (4 levels) exceeded");
    }
  }

  // Check for duplicate name at the same level
  const duplicateFilter = { name };
  if (parent) {
    duplicateFilter.parent = parent;
  } else {
    duplicateFilter.parent = null;
  }
  const categoryExists = await Category.findOne(duplicateFilter);

  if (categoryExists) {
    res.status(400);
    throw new Error("Category with this name already exists at this level");
  }

  let imageUrl = "";
  if (image) {
    const result = await uploadService.uploadImage(image, {
      folder: "categories",
      originalName: `category_${name.replace(/\s+/g, "_").toLowerCase()}.jpg`,
    });
    imageUrl = result.url;
  }

  const category = await Category.create({
    name,
    image: imageUrl || undefined,
    categoryType,
    parent: parent || null,
    order: order || 0,
    description: description || "",
  });

  // Populate parent before sending response
  await category.populate("parent", "name slug level");

  if (category) {
    res.status(201).json(category);
  } else {
    res.status(400);
    throw new Error("Invalid category data");
  }
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  const { name, image, categoryType, parent, order, description, isActive } =
    req.body;

  // Validate categoryType
  const validCategoryTypes = ["Featured", "Hot Categories", "Top Categories"];
  if (categoryType && !validCategoryTypes.includes(categoryType)) {
    res.status(400);
    throw new Error("Invalid category type");
  }

  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Validate parent change
  if (parent !== undefined && parent !== category.parent?.toString()) {
    // Prevent circular reference
    if (parent === category._id.toString()) {
      res.status(400);
      throw new Error("Category cannot be its own parent");
    }

    // Prevent setting a descendant as parent
    if (parent) {
      const descendants = await category.getDescendants();
      const descendantIds = descendants.map((d) => d._id.toString());
      if (descendantIds.includes(parent)) {
        res.status(400);
        throw new Error("Cannot set a descendant category as parent");
      }

      // Validate parent exists
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        res.status(400);
        throw new Error("Parent category not found");
      }

      // Check max depth
      if (parentCategory.level >= 3) {
        res.status(400);
        throw new Error("Maximum category depth (4 levels) exceeded");
      }
    }

    category.parent = parent || null;
  }

  // Update other fields
  if (name) category.name = name;
  if (categoryType) category.categoryType = categoryType;
  if (order !== undefined) category.order = order;
  if (description !== undefined) category.description = description;
  if (isActive !== undefined) category.isActive = isActive;

  // Handle image update
  if (image !== undefined) {
    if (image) {
      const result = await uploadService.replaceImage(image, category.image, {
        folder: "categories",
        originalName: `category_${(name || category.name)
          .replace(/\s+/g, "_")
          .toLowerCase()}.jpg`,
      });
      category.image = result.url;
    } else {
      // Delete old image if clearing the field
      if (category.image) {
        try {
          await uploadService.deleteImage(category.image);
        } catch (error) {
          console.error(
            `Failed to delete old category image: ${error.message}`
          );
        }
      }
      category.image = undefined;
    }
  }

  const updatedCategory = await category.save();
  await updatedCategory.populate("parent", "name slug level");

  res.json(updatedCategory);
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Check if category has children
  const hasChildren = await category.hasChildren();
  if (hasChildren) {
    res.status(400);
    throw new Error(
      "Cannot delete category with subcategories. Please delete or reassign subcategories first."
    );
  }

  // Check if category has products
  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    res.status(400);
    throw new Error(
      `Cannot delete category with ${productCount} associated product(s). Please reassign or delete products first.`
    );
  }

  // Delete associated image before deleting the category
  if (category.image) {
    try {
      await uploadService.deleteImage(category.image);
    } catch (error) {
      console.error(`Failed to delete category image: ${error.message}`);
      // Continue with category deletion even if image deletion fails
    }
  }

  await category.deleteOne();
  res.json({
    message: "Category and associated image removed successfully",
    deletedImage: category.image || null,
  });
});

// @desc    Bulk create categories
// @route   POST /api/categories/bulk
// @access  Private/Admin
const bulkCreateCategories = asyncHandler(async (req, res) => {
  const { categories } = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    res.status(400);
    throw new Error("Categories array is required");
  }

  const results = {
    successful: [],
    failed: [],
  };

  for (const categoryData of categories) {
    try {
      // Validate required fields
      if (!categoryData.name) {
        results.failed.push({
          data: categoryData,
          error: "Category name is required",
        });
        continue;
      }

      // Check if parent exists if provided
      if (categoryData.parent) {
        const parentCategory = await Category.findById(categoryData.parent);
        if (!parentCategory) {
          results.failed.push({
            data: categoryData,
            error: "Parent category not found",
          });
          continue;
        }

        // Check max depth
        if (parentCategory.level >= 3) {
          results.failed.push({
            data: categoryData,
            error: "Maximum category depth exceeded (max 4 levels)",
          });
          continue;
        }
      }

      // Create category
      const category = await Category.create({
        name: categoryData.name,
        categoryType: categoryData.categoryType || "Featured",
        parent: categoryData.parent || null,
        order: categoryData.order || 0,
        description: categoryData.description || "",
        isActive: true,
      });

      results.successful.push(category);
    } catch (error) {
      results.failed.push({
        data: categoryData,
        error: error.message,
      });
    }
  }

  res.status(201).json({
    message: `Bulk upload completed: ${results.successful.length} successful, ${results.failed.length} failed`,
    successful: results.successful,
    failed: results.failed,
  });
});

export {
  getCategories,
  getCategoryTree,
  getSubcategories,
  getCategoriesAdmin,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkCreateCategories,
};
