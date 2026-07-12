const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userPolicyAcceptanceSchema = new mongoose.Schema(
  {
    policy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
      required: [true, "Policy reference is required"],
    },
    acceptedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

const userBadgeEarnedSchema = new mongoose.Schema(
  {
    badge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge",
      required: [true, "Badge reference is required"],
    },
    earnedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

const userRedemptionSchema = new mongoose.Schema(
  {
    reward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reward",
      required: [true, "Reward reference is required"],
    },
    redeemedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    coinsSpent: {
      type: Number,
      required: true,
      min: [0, "Coins spent cannot be negative"],
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: ["Admin", "Department Manager", "Employee", "Auditor"],
        message: "{VALUE} is not a valid role",
      },
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      validate: {
        validator: function (value) {
          // If the role is Department Manager or Employee, department is required
          if (["Department Manager", "Employee"].includes(this.role)) {
            return value !== null && value !== undefined;
          }
          return true;
        },
        message: "Department is required for Department Managers and Employees",
      },
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["Pending", "Active", "Suspended"],
        message: "{VALUE} is not a valid status",
      },
      default: "Pending",
    },
    isPasswordChangeRequired: {
      type: Boolean,
      required: true,
      default: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
    xp: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "XP cannot be negative"],
    },
    coins: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Coins cannot be negative"],
    },
    badges: [userBadgeEarnedSchema],
    redemptions: [userRedemptionSchema],
    acceptedPolicies: [userPolicyAcceptanceSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Indexes for departmental filtering
userSchema.index({ department: 1 });
userSchema.index({ role: 1 });
// Indexes for global and departmental leaderboards
userSchema.index({ xp: -1 });
userSchema.index({ department: 1, xp: -1 });
// Indexes to quickly scan acceptances, badges, and redemptions
userSchema.index({ "acceptedPolicies.policy": 1 });
userSchema.index({ "badges.badge": 1 });
userSchema.index({ "redemptions.reward": 1 });

// Pre-save hook to hash passwords
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password hashes
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
