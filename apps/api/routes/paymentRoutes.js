import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentIntent:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         clientSecret:
 *           type: string
 *         paymentIntentId:
 *           type: string
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /api/payments/razorpay/order:
 *   post:
 *     summary: Create a Razorpay order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: ID of the order to pay for
 *               amount:
 *                 type: number
 *                 description: Payment amount in the order currency
 *               currency:
 *                 type: string
 *                 default: INR
 *     responses:
 *       200:
 *         description: Razorpay order created successfully
 *       400:
 *         description: Bad request - missing required fields or order already paid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to pay for this order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post("/razorpay/order", protect, createRazorpayOrder);

/**
 * @swagger
 * /api/payments/razorpay/verify:
 *   post:
 *     summary: Verify a Razorpay payment signature and mark order as paid
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - razorpayOrderId
 *               - razorpayPaymentId
 *               - razorpaySignature
 *             properties:
 *               orderId:
 *                 type: string
 *               razorpayOrderId:
 *                 type: string
 *               razorpayPaymentId:
 *                 type: string
 *               razorpaySignature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified and order marked as paid
 *       400:
 *         description: Invalid payload or signature
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post("/razorpay/verify", protect, verifyRazorpayPayment);

export default router;
