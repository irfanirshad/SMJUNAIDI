import asyncHandler from "express-async-handler";
// Legacy gateway removed. These stubs remain only to prevent accidental imports.
export const initSSLCommerzPayment = () => {
  throw new Error("SSLCommerz has been removed. Use Razorpay or COD instead.");
};
export const handleSSLCommerzSuccess = initSSLCommerzPayment;
export const handleSSLCommerzFail = initSSLCommerzPayment;
export const handleSSLCommerzCancel = initSSLCommerzPayment;
export const handleSSLCommerzIPN = initSSLCommerzPayment;
        return res.redirect(
          `${process.env.CLIENT_URL}/success?orderId=${orderId}&payment=success`
        );
      } else {
        console.error("❌ Order not found:", orderId);
        return res.redirect(
          `${process.env.CLIENT_URL}/checkout?payment=failed`
        );
      }
    } else {
      console.error("❌ Payment validation failed:", validationData2);
      return res.redirect(`${process.env.CLIENT_URL}/checkout?payment=failed`);
    }
  } catch (error) {
    console.error("❌ SSLCommerz success handler error:", error);
    return res.redirect(`${process.env.CLIENT_URL}/checkout?payment=error`);
  }
});

// @desc    Handle SSLCommerz fail callback
// @route   POST /api/payments/sslcommerz/fail
// @access  Public (SSLCommerz callback)
export const handleSSLCommerzFail = asyncHandler(async (req, res) => {
  const { value_a: orderId } = req.body;

  if (orderId) {
    await Order.findByIdAndUpdate(orderId, {
      $set: {
        "paymentDetails.status": "failed",
        "paymentDetails.failureReason": req.body.error || "Payment failed",
      },
    });
  }

  res.redirect(
    `${process.env.CLIENT_URL}/checkout?payment=failed&orderId=${orderId || ""}`
  );
});

// @desc    Handle SSLCommerz cancel callback
// @route   POST /api/payments/sslcommerz/cancel
// @access  Public (SSLCommerz callback)
export const handleSSLCommerzCancel = asyncHandler(async (req, res) => {
  const { value_a: orderId } = req.body;

  if (orderId) {
    await Order.findByIdAndUpdate(orderId, {
      $set: {
        "paymentDetails.status": "cancelled",
      },
    });
  }

  res.redirect(`${process.env.CLIENT_URL}/user/orders/${orderId || ""}`);
});

// @desc    Handle SSLCommerz IPN (Instant Payment Notification)
// @route   POST /api/payments/sslcommerz/ipn
// @access  Public (SSLCommerz callback)
export const handleSSLCommerzIPN = asyncHandler(async (req, res) => {
  // Process IPN for additional payment status updates
  // This is useful for asynchronous payment confirmations

  res.status(200).json({ status: "OK" });
});
