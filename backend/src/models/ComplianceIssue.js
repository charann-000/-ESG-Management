const mongoose = require("mongoose");

const complianceIssueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Issue title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters long"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Issue description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Responsible Department is required"],
    },
    audit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Audit",
      default: null,
    },
    severity: {
      type: String,
      required: true,
      enum: {
        values: ["Low", "Medium", "High", "Critical"],
        message: "{VALUE} is not a valid severity level",
      },
      default: "Medium",
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["Open", "Resolved", "Verified"],
        message: "{VALUE} is not a valid status",
      },
      default: "Open",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporting auditor reference is required"],
      validate: {
        validator: async function (value) {
          const User = mongoose.model("User");
          const user = await User.findById(value);
          return user && user.role === "Auditor";
        },
        message: "Compliance issue reporter must have the role 'Auditor'",
      },
    },
    // Resolution Details
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionDetails: {
      type: String,
      maxlength: [2000, "Resolution details cannot exceed 2000 characters"],
      default: "",
    },
    // Verification Details
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verificationDetails: {
      type: String,
      maxlength: [2000, "Verification details cannot exceed 2000 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
complianceIssueSchema.index({ department: 1, status: 1 });
complianceIssueSchema.index({ audit: 1 });
complianceIssueSchema.index({ status: 1 });

// Pre-save validations to enforce workflow logic
complianceIssueSchema.pre("save", async function () {
  const User = mongoose.model("User");

  // 1. Resolve State Validations
  if (this.status === "Resolved") {
    if (!this.resolvedBy || !this.resolutionDetails.trim()) {
      throw new Error("Resolution details and resolver reference are required to mark issue as Resolved");
    }
    const resolver = await User.findById(this.resolvedBy);
    if (!resolver || resolver.role !== "Department Manager") {
      throw new Error("Assigned resolver must be a Department Manager");
    }
    if (!this.resolvedAt) {
      this.resolvedAt = new Date();
    }
  }

  // 2. Verified State Validations
  if (this.status === "Verified") {
    if (!this.resolvedBy || !this.resolvedAt) {
      throw new Error("An issue must be resolved before it can be verified");
    }
    if (!this.verifiedBy || !this.verificationDetails.trim()) {
      throw new Error("Verification details and auditor reference are required to mark issue as Verified");
    }
    const verifier = await User.findById(this.verifiedBy);
    if (!verifier || verifier.role !== "Auditor") {
      throw new Error("Assigned verifier must be an Auditor");
    }
    if (!this.verifiedAt) {
      this.verifiedAt = new Date();
    }
  }
});

const ComplianceIssue = mongoose.model("ComplianceIssue", complianceIssueSchema);

module.exports = ComplianceIssue;
