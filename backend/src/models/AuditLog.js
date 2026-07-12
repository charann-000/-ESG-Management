const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, "Action type is required"],
      enum: {
        values: [
          "CREATE",
          "UPDATE",
          "DELETE",
          "APPROVE",
          "REJECT",
          "LOGIN",
          "PASSWORD_CHANGE",
          "ROLE_CHANGE",
          "ACCEPT",
          "JOIN",
        ],
        message: "{VALUE} is not a valid action",
      },
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Actor is required"],
    },
    actorRole: {
      type: String,
      required: [true, "Actor role at time of action is required"],
    },
    targetModel: {
      type: String,
      required: [true, "Target model type is required"],
      enum: [
        "User",
        "Department",
        "EmissionFactor",
        "Operation",
        "Policy",
        "CSRActivity",
        "Challenge",
        "Reward",
        "Badge",
        "Audit",
        "ComplianceIssue",
        "Notification",
      ],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Target ID is required"],
      refPath: "targetModel", // Dynamic reference based on targetModel field
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Audit logs are write-once
  }
);

// Indexes
auditLogSchema.index({ targetModel: 1, targetId: 1 });
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: 1 });

// Prevent updates and deletes on Audit Logs to ensure immutability
auditLogSchema.pre("save", function () {
  if (!this.isNew) {
    throw new Error("Audit logs are immutable and cannot be updated.");
  }
});

// Block updates, deletes, and removes
const preventModification = function () {
  throw new Error("Audit logs are immutable and cannot be modified or deleted.");
};

auditLogSchema.pre("updateOne", preventModification);
auditLogSchema.pre("updateMany", preventModification);
auditLogSchema.pre("findOneAndUpdate", preventModification);
auditLogSchema.pre("findOneAndDelete", preventModification);
auditLogSchema.pre("deleteOne", preventModification);
auditLogSchema.pre("deleteMany", preventModification);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
