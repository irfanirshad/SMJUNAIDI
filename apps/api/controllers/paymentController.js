import Razorpay from "razorpay";
import asyncHandler from "express-async-handler";
import crypto from "crypto";
import Order from "../models/orderModel.js";

const getRazorpayClient = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || "";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "";

  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }

  return new Razorpay({ key_id, key_secret });
};

// @desc    Create Razorpay order for payment
// @route   POST /api/payments/razorpay/order
// @access  Private
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing",
      });
    }

    const { orderId, amount, currency } = req.body;
    const paymentCurrency = (currency || process.env.PAYMENT_CURRENCY || "INR").toUpperCase();

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Order ID and amount are required",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.userId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to pay for this order",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This order has already been paid",
      });
    }

    // Convert to gateway currency (INR) using optional rate so USD-priced catalogs can bill correctly
    const conversionRate = Number(process.env.PAYMENT_CURRENCY_RATE || "1");
    const amountInSubunits = Math.round(amount * conversionRate * 100);
    const razorpay = getRazorpayClient();

    const rpOrder = await razorpay.orders.create({
      amount: amountInSubunits,
      currency: paymentCurrency,
      receipt: orderId.toString(),
      notes: {
        orderId: orderId.toString(),
        userId: req.user._id.toString(),
        userEmail: req.user.email,
      },
    });

    await Order.findByIdAndUpdate(orderId, {
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      payment_info: {
        gateway: "razorpay",
        razorpay: {
          orderId: rpOrder.id,
        },
        currency: paymentCurrency,
      },
    });

    return res.status(200).json({
      success: true,
      orderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      message: "Razorpay order created successfully",
    });
  } catch (error) {
    console.error("❌ Razorpay order creation error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create Razorpay order",
    });
  }
});

// @desc    Verify Razorpay payment signature and mark order paid
// @route   POST /api/payments/razorpay/verify
// @access  Private
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
    req.body || {};

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({
      success: false,
      message: "orderId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required",
    });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  if (!order.userId.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to pay for this order",
    });
  }

  if (order.paymentStatus === "paid") {
    return res.status(200).json({
      success: true,
      message: "Order already marked as paid",
    });
  }

  const key_secret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!key_secret) {
    return res.status(500).json({
      success: false,
      message: "Razorpay secret missing on server",
    });
  }

  const hmac = crypto.createHmac("sha256", key_secret);
  hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
  const expectedSignature = hmac.digest("hex");

  if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment signature",
    });
  }

  const updatedOrder = await Order.findByIdAndUpdate(
    orderId,
    {
      paymentStatus: "paid",
      paidAt: new Date(),
      paymentMethod: "razorpay",
      payment_info: {
        gateway: "razorpay",
        razorpay: {
          orderId: razorpayOrderId,
          paymentId: razorpayPaymentId,
          signature: razorpaySignature,
        },
        paidAmount: order.total,
        currency: order.payment_info?.currency || process.env.PAYMENT_CURRENCY || "INR",
        paidAt: new Date(),
      },
    },
    { new: true }
  );

  return res.status(200).json({
    success: true,
    message: "Payment verified and order marked as paid",
    order: updatedOrder,
  });
});
