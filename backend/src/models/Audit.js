const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Audit title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters long"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department reference is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Audit coverage start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "Audit coverage end date is required"],
      validate: {
        validator: function (value) {
          return this.startDate ? value >= this.startDate : true;
        },
        message: "End date must be greater than or equal to start date",
      },
    },
    auditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Auditor reference is required"],
      validate: {
        validator: async function (value) {
          const User = mongoose.model("User");
          const user = await User.findById(value);
          return user && user.role === "Auditor";
        },
        message: "Assigned auditor must have the role 'Auditor'",
      },
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["Scheduled", "In Progress", "Completed", "Approved", "Rejected"],
        message: "{VALUE} is not a valid audit status",
      },
      default: "Scheduled",
    },
    findings: {
      type: String,
      maxlength: [3000, "Findings text cannot exceed 3000 characters"],
      default: "",
    },
    operationsAudited: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Operation",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
auditSchema.index({ department: 1, status: 1 });
auditSchema.index({ auditedBy: 1 });
auditSchema.index({ startDate: 1, endDate: 1 });

const Audit = mongoose.model("Audit", auditSchema);

module.exports = Audit;
