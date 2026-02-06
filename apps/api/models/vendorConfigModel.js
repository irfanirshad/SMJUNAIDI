import mongoose from "mongoose";

const vendorConfigSchema = mongoose.Schema(
  {
    vendorEnabled: {
      type: Boolean,
      default: true,
    },
    defaultCommissionRate: {
      type: Number,
      default: 15,
      min: 0,
      max: 100,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    allowVendorRegistration: {
      type: Boolean,
      default: true,
    },
    requireApproval: {
      type: Boolean,
      default: true,
    },
    maxProductsPerVendor: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const VendorConfig = mongoose.model("VendorConfig", vendorConfigSchema);

export default VendorConfig;
