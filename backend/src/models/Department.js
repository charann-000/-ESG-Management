const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Department name must be at least 2 characters long"],
      maxlength: [100, "Department name cannot exceed 100 characters"],
    },
    code: {
      type: String,
      required: [true, "Department code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, "Code must be at least 3 characters long"],
      maxlength: [15, "Code cannot exceed 15 characters"],
      match: [/^[A-Z0-9-]+$/, "Code can only contain uppercase letters, numbers, and hyphens"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      unique: true, // A manager can only lead one department
      validate: {
        validator: async function (value) {
          if (!value) return true; // Manager can be null initially
          const User = mongoose.model("User");
          const user = await User.findById(value);
          return user && user.role === "Department Manager";
        },
        message: "Assigned manager must exist and have the role 'Department Manager'",
      },
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      minlength: [2, "Location must be at least 2 characters long"],
      maxlength: [150, "Location cannot exceed 150 characters"],
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
departmentSchema.index({ code: 1 });
departmentSchema.index({ manager: 1 });
departmentSchema.index({ status: 1 });

const Department = mongoose.model("Department", departmentSchema);

module.exports = Department;
