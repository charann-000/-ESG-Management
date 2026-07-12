const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee reference is required"],
    },
    proof: {
      type: String,
      required: [true, "Proof file URL is required"],
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["Pending Approval", "Approved", "Rejected"],
        message: "{VALUE} is not a valid verification status",
      },
      default: "Pending Approval",
    },
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const csrActivitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "CSR Activity title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters long"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "CSR Activity description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [1500, "Description cannot exceed 1500 characters"],
    },
    date: {
      type: Date,
      required: [true, "Activity schedule date is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [150, "Location cannot exceed 150 characters"],
    },
    xpReward: {
      type: Number,
      required: [true, "XP reward value is required"],
      min: [0, "XP reward cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "XP reward must be an integer",
      },
      default: 0,
    },
    coinReward: {
      type: Number,
      required: [true, "Coin reward value is required"],
      min: [0, "Coin reward cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Coin reward must be an integer",
      },
      default: 0,
    },
    badgeReward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge",
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department reference is required"],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["Upcoming", "Active", "Completed", "Cancelled"],
        message: "{VALUE} is not a valid status",
      },
      default: "Upcoming",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
      validate: {
        validator: async function (value) {
          const User = mongoose.model("User");
          const user = await User.findById(value);
          return user && user.role === "Department Manager";
        },
        message: "CSR activity organizer must be a Department Manager",
      },
    },
    participants: [participantSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes
csrActivitySchema.index({ department: 1, status: 1 });
csrActivitySchema.index({ date: 1 });
csrActivitySchema.index({ "participants.employee": 1 });

const CSRActivity = mongoose.model("CSRActivity", csrActivitySchema);

module.exports = CSRActivity;
