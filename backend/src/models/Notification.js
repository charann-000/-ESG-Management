const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient reference is required"],
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ["In-App", "Email", "Both"],
        message: "{VALUE} is not a valid delivery type",
      },
      default: "In-App",
    },
    event: {
      type: String,
      required: true,
      enum: {
        values: ["Policy", "Reward", "Badge", "CSR", "Challenge", "Compliance", "Audit"],
        message: "{VALUE} is not a valid event classification",
      },
    },
    isRead: {
      type: Boolean,
      required: true,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    targetModel: {
      type: String,
      enum: ["Policy", "Reward", "Badge", "CSRActivity", "Challenge", "ComplianceIssue", "Audit"],
      default: null,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "targetModel",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ event: 1 });

// Pre-save hook to populate readAt automatically on status toggle
notificationSchema.pre("save", function () {
  if (this.isModified("isRead") && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
