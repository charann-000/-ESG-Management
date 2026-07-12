const mongoose = require("mongoose");

const challengeParticipantSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee reference is required"],
    },
    proofUrl: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["Joined", "Pending Approval", "Completed", "Rejected"],
        message: "{VALUE} is not a valid participant status",
      },
      default: "Joined",
    },
    joinedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Challenge title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters long"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Challenge description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [1500, "Description cannot exceed 1500 characters"],
    },
    startDate: {
      type: Date,
      required: [true, "Challenge start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "Challenge end date is required"],
      validate: {
        validator: function (value) {
          return this.startDate ? value >= this.startDate : true;
        },
        message: "End date must be greater than or equal to start date",
      },
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
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null, // Null indicates a company-wide challenge
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
        message: "Challenge organizer must be a Department Manager",
      },
    },
    participants: [challengeParticipantSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes
challengeSchema.index({ department: 1, status: 1 });
challengeSchema.index({ startDate: 1, endDate: 1 });
challengeSchema.index({ "participants.employee": 1 });

const Challenge = mongoose.model("Challenge", challengeSchema);

module.exports = Challenge;
