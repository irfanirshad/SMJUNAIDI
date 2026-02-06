import express from "express";
import {
  registerVendor,
  createVendorByAdmin,
  getVendorRequests,
  updateVendorStatus,
  updateVendorDetails,
  getMyVendorStatus,
  getVendorConfig,
  updateVendorConfig,
  createVendorProduct,
  getVendorProducts,
  updateVendorProduct,
  deleteVendorProduct,
  getVendorDashboardStats,
  getApprovedVendors,
} from "../controllers/vendorController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, registerVendor);
router.route("/").get(protect, admin, getVendorRequests);
router.route("/create").post(protect, admin, createVendorByAdmin);
router.route("/requests").get(protect, admin, getVendorRequests);
router.route("/me").get(protect, getMyVendorStatus);
router.route("/approved").get(getApprovedVendors); // Public endpoint to get approved vendors
router.route("/config").get(getVendorConfig); // Public endpoint to check vendor system status
router.route("/config").put(protect, admin, updateVendorConfig); // Admin only for updates
router.route("/:id/status").put(protect, admin, updateVendorStatus);
router.route("/:id").put(protect, admin, updateVendorDetails);

// Vendor Product Routes
router.route("/products").post(protect, createVendorProduct);
router.route("/products").get(protect, getVendorProducts);
router.route("/products/:id").put(protect, updateVendorProduct);
router.route("/products/:id").delete(protect, deleteVendorProduct);

// Vendor Dashboard
router.route("/dashboard/stats").get(protect, getVendorDashboardStats);

export default router;
