import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        // Password is only required for non-OAuth users
        return !this.isOAuthUser;
      },
    },
    // Development only - stores original password (encrypted)
    // Only populated in NODE_ENV=development
    dev_password: {
      type: String,
      select: false, // Don't include in queries by default
      default: null,
    },
    avatar: {
      type: String,
      default:
        process.env.DEFAULT_USER_IMAGE ||
        "https://res.cloudinary.com/dcs9nphcp/image/upload/v1759859570/defaultUserImage_dzrcwx.png",
    },
    role: {
      type: String,
      enum: ["admin", "user", "employee", "vendor"],
      default: "user",
    },
    // Employee specific role (only applicable when role is 'employee')
    employee_role: {
      type: String,
      enum: ["packer", "deliveryman", "accounts", "incharge", "call_center"],
      default: null,
      validate: {
        validator: function (value) {
          // employee_role is required when role is 'employee'
          if (this.role === "employee" && !value) {
            return false;
          }
          // employee_role should be null when role is not 'employee'
          if (this.role !== "employee" && value) {
            return false;
          }
          return true;
        },
        message:
          "Employee role is required for employees and should be null for non-employees",
      },
    },
    // OAuth specific fields
    isOAuthUser: {
      type: Boolean,
      default: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },
    authUid: {
      type: String,
      default: null,
    },
    // Optional: Track if user has set a password after OAuth registration
    hasSetPassword: {
      type: Boolean,
      default: function () {
        return !this.isOAuthUser;
      },
    },
    // Password reset fields
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },
    addresses: [
      {
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
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    cart: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  // If user has no password set (OAuth user without password), return false
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// Combined pre-save hook for password hashing and address validation
userSchema.pre("save", async function () {
  try {
    // Handle password hashing
    if (this.isModified("password") && this.password) {
      // Store plain password in dev mode only (base64 encoded for simple obfuscation)
      if (process.env.NODE_ENV === "development") {
        this.dev_password = Buffer.from(this.password).toString("base64");
      }

      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);

      // If password is being set, mark hasSetPassword as true
      if (this.isOAuthUser) {
        this.hasSetPassword = true;
      }
    }

    // Ensure only one address is default
    if (this.isModified("addresses") && this.addresses.length > 0) {
      const defaultAddress = this.addresses.find((addr) => addr.isDefault);
      if (defaultAddress) {
        this.addresses.forEach((addr) => {
          if (addr !== defaultAddress) addr.isDefault = false;
        });
      }
    }
  } catch (error) {
    throw error;
  }
});

const User = mongoose.model("User", userSchema);

export default User;
