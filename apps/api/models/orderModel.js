import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: {
    type: String,
  },
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    total: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "address_confirmed",
        "confirmed",
        "packed",
        "delivering",
        "delivered",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "cod_collected"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod"],
      default: "razorpay",
    },
    // Comprehensive payment information for all payment gateways
    payment_info: {
      gateway: {
        type: String,
        enum: ["razorpay", "cod"],
      },
      // Razorpay specific fields
      razorpay: {
        orderId: String,
        paymentId: String,
        signature: String,
        method: String,
        cardLast4: String,
        cardNetwork: String,
        vpa: String,
      },
      // Common fields
      paidAmount: Number,
      currency: String,
      paidAt: Date,
    },
    shippingAddress: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
    },
    paidAt: {
      type: Date,
    },
    // Comprehensive status update tracking
    status_updates: {
      address_confirmed: {
        by: {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          name: String,
        },
        at: Date,
        notes: String,
      },
      order_confirmed: {
        by: {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          name: String,
        },
        at: Date,
      },
      packed: {
        by: {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          name: String,
        },
        at: Date,
      },
      delivering: {
        by: {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          name: String,
        },
        at: Date,
      },
      delivered: {
        by: {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          name: String,
        },
        at: Date,
      },
      completed: {
        by: {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          name: String,
        },
        at: Date,
      },
    },
    // Employee assignments
    assignedPacker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedDeliveryman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // COD tracking
    codAmount: {
      type: Number,
      default: 0,
    },
    codCollectedAt: {
      type: Date,
    },
    codCollectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    codReturnedAt: {
      type: Date,
    },
    codReturnedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Status history for audit trail - tracks all status changes with user info
    status_history: [
      {
        status: {
          type: String,
          required: true,
        },
        changed_at: {
          type: Date,
          default: Date.now,
        },
        changed_by: {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
        },
        notes: {
          type: String,
          default: "",
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
