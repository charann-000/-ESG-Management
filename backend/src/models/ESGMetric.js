const mongoose = require("mongoose");

const esgMetricSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Metric name is required"],
      unique: true,
      trim: true,
      minlength: [3, "Metric name must be at least 3 characters long"],
      maxlength: [150, "Metric name cannot exceed 150 characters"],
    },
    code: {
      type: String,
      required: [true, "Metric code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, "Code must be at least 3 characters long"],
      maxlength: [20, "Code cannot exceed 20 characters"],
      match: [/^[A-Z0-9-]+$/, "Code can only contain uppercase letters, numbers, and hyphens"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["Environmental", "Social", "Governance"],
        message: "{VALUE} is not a valid category",
      },
    },
    unit: {
      type: String,
      required: [true, "Unit of measurement is required"],
      trim: true,
      maxlength: [20, "Unit label cannot exceed 20 characters"],
    },
    frequency: {
      type: String,
      required: [true, "Reporting frequency is required"],
      enum: {
        values: ["Monthly", "Quarterly", "Annually"],
        message: "{VALUE} is not a valid reporting frequency",
      },
      default: "Monthly",
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    isEvidenceRequired: {
      type: Boolean,
      required: true,
      default: true,
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
esgMetricSchema.index({ code: 1 });
esgMetricSchema.index({ category: 1 });
esgMetricSchema.index({ status: 1 });

const ESGMetric = mongoose.model("ESGMetric", esgMetricSchema);

module.exports = ESGMetric;
