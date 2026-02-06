import asyncHandler from "express-async-handler";
import Banner from "../models/bannerModel.js";
import uploadService from "../config/uploadService.js";

// @desc    Get all banners
// @route   GET /api/banners
// @access  Private
const getBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find({});
  res.json(banners);
});

// @desc    Get all banners for admin with advanced filtering
// @route   GET /api/banners/admin
// @access  Private (Admin)
const getBannersAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  const sortOrder = req.query.sortOrder || "desc";
  const search = req.query.search;
  const bannerType = req.query.bannerType;

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
    filter.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { title: { $regex: search.trim(), $options: "i" } },
    ];
  }

  // Banner type filter
  if (bannerType && bannerType !== "all") {
    filter.bannerType = bannerType;
  }

  const skip = (page - 1) * perPage;
  const total = await Banner.countDocuments(filter);
  const sortValue = sortOrder === "asc" ? 1 : -1;

  const banners = await Banner.find(filter)
    .skip(skip)
    .limit(perPage)
    .sort({ createdAt: sortValue });

  const totalPages = Math.ceil(total / perPage);

  res.json({ banners, total, page, perPage, totalPages });
});

// @desc    Get banner by ID
// @route   GET /api/banners/:id
// @access  Private
const getBannerById = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (banner) {
    res.json(banner);
  } else {
    res.status(404);
    throw new Error("Banner not found");
  }
});

// @desc    Create a banner
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = asyncHandler(async (req, res) => {
  const { name, title, startFrom, image, bannerType } = req.body;

  // const bannerExists = await User.findOne({ name });
  // if (bannerExists) {
  //   res.status(400);
  //   throw new Error("Same banner already exists");
  // }

  let imageUrl = "";
  if (image) {
    const result = await uploadService.uploadImage(image, {
      folder: "banners",
      originalName: `banner_${name.replace(/\s+/g, "_").toLowerCase()}.jpg`,
    });
    imageUrl = result.url;
  }

  const banner = new Banner({
    name,
    title,
    startFrom,
    image: imageUrl || undefined,
    bannerType,
  });

  const createdBanner = await banner.save();
  if (createBanner) {
    res.status(201).json(createdBanner);
  } else {
    res.status(400);
    throw new Error("Invalid banner data");
  }
});

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = asyncHandler(async (req, res) => {
  const { name, title, startFrom, image, bannerType } = req.body;

  const banner = await Banner.findById(req.params.id);

  if (banner) {
    banner.name = name || banner.name;
    banner.title = title || banner.title;
    banner.startFrom = startFrom || banner.startFrom;
    banner.bannerType = bannerType || banner.bannerType;

    try {
      if (image !== undefined) {
        if (image) {
          const result = await uploadService.replaceImage(image, banner.image, {
            folder: "banners",
            originalName: `banner_${(name || banner.name)
              .replace(/\s+/g, "_")
              .toLowerCase()}.jpg`,
          });
          banner.image = result.url;
        } else {
          // Delete old image if clearing the field
          if (banner.image) {
            try {
              await uploadService.deleteImage(banner.image);
            } catch (error) {
              console.error(
                `Failed to delete old banner image: ${error.message}`
              );
            }
          }
          banner.image = undefined; // Clear image if empty string is provided
        }
      }
      const updatedBanner = await banner.save();
      res.json(updatedBanner);
    } catch (error) {
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        res.status(400);
        throw new Error(errors.join(", "));
      }
      res.status(400);
      throw new Error("Invalid banner data");
    }
  } else {
    res.status(404);
    throw new Error("Banner not found");
  }
});

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (banner) {
    // Delete associated image before deleting the banner
    if (banner.image) {
      try {
        await uploadService.deleteImage(banner.image);
      } catch (error) {
        console.error(`Failed to delete banner image: ${error.message}`);
        // Continue with banner deletion even if image deletion fails
      }
    }

    await banner.deleteOne();
    res.json({
      message: "Banner and associated image removed successfully",
      deletedImage: banner.image || null,
    });
  } else {
    res.status(404);
    throw new Error("Banner not found");
  }
});

export {
  getBanners,
  getBannersAdmin,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
};
