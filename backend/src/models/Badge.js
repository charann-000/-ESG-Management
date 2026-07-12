const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Badge name is required"],
      unique: true,
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Badge description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    imageUrl: {
      type: String,
      required: [true, "Badge image URL is required"],
      trim: true,
    },
    ruleType: {
      type: String,
      required: [true, "Rule type is required"],
      enum: {
        values: ["CSR_COUNT", "XP_COUNT", "CHALLENGE_COUNT"],
        message: "{VALUE} is not a valid rule type",
      },
    },
    ruleValue: {
      type: Number,
      required: [true, "Rule threshold value is required"],
      min: [1, "Rule threshold must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Rule threshold must be an integer",
      },
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
      validate: {
        validator: async function (value) {
          const User = mongoose.model("User");
          const user = await User.findById(value);
          return user && user.role === "Admin";
        },
        message: "Badge rule creator must be an Admin user",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
badgeSchema.index({ name: 1 });
badgeSchema.index({ status: 1 });

const Badge = mongoose.model("Badge", badgeSchema);

module.exports = Badge;
