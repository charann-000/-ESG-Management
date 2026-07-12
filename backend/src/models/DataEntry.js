const mongoose = require("mongoose");

const dataEntrySchema = new mongoose.Schema(
  {
    metric: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ESGMetric",
      required: [true, "Metric reference is required"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department reference is required"],
    },
    value: {
      type: Number,
      required: [true, "Numerical value is required"],
      min: [0, "Value cannot be negative"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [2000, "Year must be 2000 or later"],
      max: [2100, "Year cannot exceed 2100"],
      default: () => new Date().getFullYear(),
    },
    period: {
      type: String,
      required: [true, "Period is required"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date of the period is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date of the period is required"],
      validate: {
        validator: function (value) {
          return this.startDate ? value >= this.startDate : true;
        },
        message: "End date must be greater than or equal to start date",
      },
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Submitter reference is required"],
    },
    evidenceUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["Pending Approval", "Approved", "Rejected", "Audited"],
        message: "{VALUE} is not a valid status",
      },
      default: "Pending Approval",
    },
    // Manager Review Block
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    managerNotes: {
      type: String,
      maxlength: [500, "Manager notes cannot exceed 500 characters"],
      default: "",
    },
    // Auditor Review Block
    auditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    auditedAt: {
      type: Date,
      default: null,
    },
    auditNotes: {
      type: String,
      maxlength: [1000, "Audit notes cannot exceed 1000 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Compound index to check duplicates and speed up departmental analytics
dataEntrySchema.index({ department: 1, metric: 1, year: 1, period: 1 });
dataEntrySchema.index({ status: 1 });
dataEntrySchema.index({ startDate: 1, endDate: 1 });

// Pre-save validations
dataEntrySchema.pre("save", async function (next) {
  const User = mongoose.model("User");
  const ESGMetric = mongoose.model("ESGMetric");

  try {
    // 1. Verify Submitter Role & Department Alignment
    const submitter = await User.findById(this.submittedBy);
    if (!submitter) {
      return next(new Error("Submitter user not found"));
    }

    if (submitter.role === "Employee" || submitter.role === "Department Manager") {
      if (submitter.department.toString() !== this.department.toString()) {
        return next(new Error("Submitter must belong to the reporting department"));
      }
    }

    // 2. Verify Metric requirements (like evidence files)
    const metricDoc = await ESGMetric.findById(this.metric);
    if (!metricDoc) {
      return next(new Error("ESG Metric not found"));
    }
    if (metricDoc.status !== "Active") {
      return next(new Error("Cannot submit data for an Inactive metric"));
    }

    if (metricDoc.isEvidenceRequired && !this.evidenceUrl) {
      return next(new Error(`Evidence document is required for metric: ${metricDoc.name}`));
    }

    // 3. Enforce Single Active Submission (No double entries unless rejected)
    if (this.isNew || this.isModified("status")) {
      const duplicate = await mongoose.model("DataEntry").findOne({
        department: this.department,
        metric: this.metric,
        year: this.year,
        period: this.period,
        status: { $in: ["Pending Approval", "Approved", "Audited"] },
        _id: { $ne: this._id }, // Ignore self when updating
      });

      if (duplicate) {
        return next(
          new Error(
            `A data entry already exists for this period with status: ${duplicate.status}. Reject or delete the existing one first.`
          )
        );
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

const DataEntry = mongoose.model("DataEntry", dataEntrySchema);

module.exports = DataEntry;
