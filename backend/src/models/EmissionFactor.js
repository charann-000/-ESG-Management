const mongoose = require("mongoose");

const emissionFactorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Emission factor name is required"],
      unique: true,
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [150, "Name cannot exceed 150 characters"],
    },
    activityType: {
      type: String,
      required: [true, "Activity type is required"],
      enum: {
        values: ["Purchase", "Electricity", "Fleet", "Manufacturing", "Waste"],
        message: "{VALUE} is not a valid activity type",
      },
    },
    factor: {
      type: Number,
      required: [true, "Factor coefficient is required"],
      min: [0, "Factor cannot be negative"],
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      trim: true,
      lowercase: true,
    },
    source: {
      type: String,
      required: [true, "Regulatory source is required"],
      trim: true,
      minlength: [3, "Source description must be at least 3 characters long"],
      maxlength: [200, "Source description cannot exceed 200 characters"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [2000, "Year must be 2000 or later"],
      max: [2100, "Year cannot exceed 2100"],
      default: () => new Date().getFullYear(),
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["Active", "Inactive"],
        message: "{VALUE} is not a valid status",
      },
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
emissionFactorSchema.index({ activityType: 1, status: 1 });
emissionFactorSchema.index({ year: -1 });

const EmissionFactor = mongoose.model("EmissionFactor", emissionFactorSchema);

module.exports = EmissionFactor;
