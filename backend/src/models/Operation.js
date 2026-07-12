const mongoose = require("mongoose");

const operationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Operation type is required"],
      enum: {
        values: ["Purchase", "Electricity", "Fleet", "Manufacturing", "Waste"],
        message: "{VALUE} is not a valid operation type",
      },
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department reference is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.0001, "Quantity must be greater than zero"],
    },
    unit: {
      type: String,
      required: [true, "Unit of measurement is required"],
      trim: true,
    },
    emissionFactor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmissionFactor",
      required: [true, "Emission Factor reference is required"],
    },
    carbonEmission: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Carbon emissions cannot be negative"],
    },
    evidenceFiles: {
      type: [String],
      required: [true, "At least one evidence file is required"],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: "At least one evidence file URL is required",
      },
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recorder user reference is required"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    date: {
      type: Date,
      required: [true, "Operation date is required"],
      default: Date.now,
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: "Operation date cannot be in the future",
      },
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
  },
  {
    timestamps: true,
  }
);

// Indexes
operationSchema.index({ department: 1, type: 1, date: -1 });
operationSchema.index({ emissionFactor: 1 });
operationSchema.index({ carbonEmission: 1 });

// Pre-save hook to calculate carbon emissions dynamically
operationSchema.pre("save", async function () {
  const EmissionFactor = mongoose.model("EmissionFactor");
  const factorDoc = await EmissionFactor.findById(this.emissionFactor);

  if (!factorDoc) {
    throw new Error("Selected Emission Factor does not exist");
  }

  if (factorDoc.unit.toLowerCase() !== this.unit.toLowerCase()) {
    throw new Error(
      `Unit mismatch: Operation unit is '${this.unit}' but Emission Factor expects '${factorDoc.unit}'`
    );
  }

  // Multiply quantity by emission factor to compute CO2 equivalent (in kg CO2e)
  this.carbonEmission = this.quantity * factorDoc.factor;
});

const Operation = mongoose.model("Operation", operationSchema);

module.exports = Operation;
