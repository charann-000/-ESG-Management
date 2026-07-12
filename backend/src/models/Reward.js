const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Reward title is required"],
      unique: true,
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Reward description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    cost: {
      type: Number,
      required: [true, "Coin cost is required"],
      min: [1, "Cost must be at least 1 coin"],
      validate: {
        validator: Number.isInteger,
        message: "Cost must be an integer",
      },
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be an integer",
      },
    },
    imageUrl: {
      type: String,
      default: null,
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
        message: "Reward publisher must be an Admin user",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
rewardSchema.index({ title: 1 });
rewardSchema.index({ status: 1, stock: 1 });

const Reward = mongoose.model("Reward", rewardSchema);

module.exports = Reward;
