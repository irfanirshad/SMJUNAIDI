import AdsBanner from "../models/adsBannerModel.js";
import asyncHandler from "express-async-handler";

// @desc    Get all ads banners with pagination
// @route   GET /api/ads-banners
// @access  Public
export const getAdsBanners = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const perPage = Number(req.query.perPage) || 10;
  const bannerType = req.query.bannerType;
  const isActive = req.query.isActive;

  const query = {};

  if (bannerType) {
    query.bannerType = bannerType;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  const count = await AdsBanner.countDocuments(query);
  const adsBanners = await AdsBanner.find(query)
    .sort({ order: 1, createdAt: -1 })
    .limit(perPage)
    .skip(perPage * (page - 1));

  res.json({
    adsBanners,
    page,
    perPage,
    totalPages: Math.ceil(count / perPage),
    total: count,
  });
});

// @desc    Get single ads banner
// @route   GET /api/ads-banners/:id
// @access  Public
export const getAdsBannerById = asyncHandler(async (req, res) => {
  const adsBanner = await AdsBanner.findById(req.params.id);

  if (adsBanner) {
    res.json(adsBanner);
  } else {
    res.status(404);
    throw new Error("Ads banner not found");
  }
});

// @desc    Create new ads banner
// @route   POST /api/ads-banners
// @access  Private/Admin
export const createAdsBanner = asyncHandler(async (req, res) => {
  const { name, title, description, image, link, bannerType, isActive, order } =
    req.body;

  const adsBanner = await AdsBanner.create({
    name,
    title,
    description,
    image,
    link,
    bannerType,
    isActive,
    order,
  });

  res.status(201).json(adsBanner);
});

// @desc    Update ads banner
// @route   PUT /api/ads-banners/:id
// @access  Private/Admin
export const updateAdsBanner = asyncHandler(async (req, res) => {
  const { name, title, description, image, link, bannerType, isActive, order } =
    req.body;

  const adsBanner = await AdsBanner.findById(req.params.id);

  if (adsBanner) {
    adsBanner.name = name || adsBanner.name;
    adsBanner.title = title || adsBanner.title;
    adsBanner.description =
      description !== undefined ? description : adsBanner.description;
    adsBanner.image = image || adsBanner.image;
    adsBanner.link = link !== undefined ? link : adsBanner.link;
    adsBanner.bannerType = bannerType || adsBanner.bannerType;
    adsBanner.isActive = isActive !== undefined ? isActive : adsBanner.isActive;
    adsBanner.order = order !== undefined ? order : adsBanner.order;

    const updatedAdsBanner = await adsBanner.save();
    res.json(updatedAdsBanner);
  } else {
    res.status(404);
    throw new Error("Ads banner not found");
  }
});

// @desc    Delete ads banner
// @route   DELETE /api/ads-banners/:id
// @access  Private/Admin
export const deleteAdsBanner = asyncHandler(async (req, res) => {
  const adsBanner = await AdsBanner.findById(req.params.id);

  if (adsBanner) {
    await AdsBanner.deleteOne({ _id: req.params.id });
    res.json({ message: "Ads banner removed" });
  } else {
    res.status(404);
    throw new Error("Ads banner not found");
  }
});

// @desc    Toggle ads banner active status
// @route   PATCH /api/ads-banners/:id/toggle
// @access  Private/Admin
export const toggleAdsBannerStatus = asyncHandler(async (req, res) => {
  const adsBanner = await AdsBanner.findById(req.params.id);

  if (adsBanner) {
    adsBanner.isActive = !adsBanner.isActive;
    const updatedAdsBanner = await adsBanner.save();
    res.json(updatedAdsBanner);
  } else {
    res.status(404);
    throw new Error("Ads banner not found");
  }
});
