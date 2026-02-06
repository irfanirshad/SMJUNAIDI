import express from "express";
import { globalSearch } from "../controllers/searchController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, globalSearch);

export default router;
