const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Policy title is required"],
      unique: true,
      trim: true,
      minlength: [5, "Title must be at least 5 characters long"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Policy description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    documentUrl: {
      type: String,
      required: [true, "Policy document URL is required"],
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["Active", "Archived"],
        message: "{VALUE} is not a valid status",
      },
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
      validate: {
        validator: async function (value) {
          const User = mongoose.model("User");
          const user = await User.findById(value);
          return user && user.role === "Admin";
        },
        message: "Policy publisher must be an Admin user",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
policySchema.index({ title: 1 });
policySchema.index({ status: 1 });

const Policy = mongoose.model("Policy", policySchema);

module.exports = Policy;
