import express from "express";
import {
  getAdsBanners,
  getAdsBannerById,
  createAdsBanner,
  updateAdsBanner,
  deleteAdsBanner,
  toggleAdsBannerStatus,
} from "../controllers/adsBannerController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { preventReadOnlyActions } from "../middleware/readOnlyMiddleware.js";

const router = express.Router();

// Public routes
router.route("/").get(getAdsBanners);
router.route("/:id").get(getAdsBannerById);

// Protected admin routes
router.use(protect);
router.use(admin);

router.route("/").post(preventReadOnlyActions, createAdsBanner);
router
  .route("/:id")
  .put(preventReadOnlyActions, updateAdsBanner)
  .delete(preventReadOnlyActions, deleteAdsBanner);
router.patch("/:id/toggle", preventReadOnlyActions, toggleAdsBannerStatus);

export default router;
