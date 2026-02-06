import express from "express";
import {
  getBrands,
  getBrandsAdmin,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../controllers/brandController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { preventReadOnlyActions } from "../middleware/readOnlyMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(getBrands)
  .post(protect, admin, preventReadOnlyActions, createBrand);
router.route("/admin").get(protect, admin, getBrandsAdmin);

router
  .route("/:id")
  .get(getBrandById)
  .put(protect, admin, preventReadOnlyActions, updateBrand)
  .delete(protect, admin, preventReadOnlyActions, deleteBrand);

export default router;
