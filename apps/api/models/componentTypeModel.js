import mongoose from "mongoose";

const componentTypeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Component type name is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    label: {
      type: String,
      required: [true, "Display label is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      default: "component",
    },
    structure: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
componentTypeSchema.index({ name: 1 });
componentTypeSchema.index({ isActive: 1 });

const ComponentType = mongoose.model("ComponentType", componentTypeSchema);

export default ComponentType;
