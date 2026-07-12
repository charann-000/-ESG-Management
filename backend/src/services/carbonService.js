const mongoose = require("mongoose");
const Department = require("../models/Department");
const EmissionFactor = require("../models/EmissionFactor");

/**
 * Service handling pure business logic for carbon accounting and Department score caching.
 */

/**
 * Finds an Emission Factor and calculates carbon footprint (CO2 equivalent in kg).
 * Ensures that the unit of measurement is consistent.
 */
const calculateEmission = async (emissionFactorId, quantity, unit) => {
  const factorDoc = await EmissionFactor.findById(emissionFactorId);
  if (!factorDoc) {
    throw new Error("Selected Emission Factor does not exist");
  }

  if (factorDoc.status !== "Active") {
    throw new Error("Selected Emission Factor is inactive and cannot be used");
  }

  if (factorDoc.unit.toLowerCase() !== unit.trim().toLowerCase()) {
    throw new Error(
      `Unit mismatch: Operation unit is '${unit}' but Emission Factor expects '${factorDoc.unit}'`
    );
  }

  // Calculate CO2e: quantity * factor coefficient
  return quantity * factorDoc.factor;
};

/**
 * Aggregates all recorded carbon emissions for a department, recalculates
 * its Environmental and Overall ESG scores, and persists them.
 */
const updateDepartmentESG = async (departmentId) => {
  if (!departmentId) return;

  const DepartmentModel = mongoose.model("Department");
  const OperationModel = mongoose.model("Operation");

  const department = await DepartmentModel.findById(departmentId);
  if (!department) {
    throw new Error("Department not found");
  }

  // 1. Calculate cumulative active carbon emissions (in kg CO2e) for the department
  const aggregationResult = await OperationModel.aggregate([
    {
      $match: {
        department: new mongoose.Types.ObjectId(departmentId),
        status: "Active"
      }
    },
    {
      $group: {
        _id: "$department",
        totalCarbon: { $sum: "$carbonEmission" }
      }
    }
  ]);

  const totalCarbon = aggregationResult.length > 0 ? aggregationResult[0].totalCarbon : 0;

  // 2. Compute Environmental Score:
  // Starts at 100. Deducts 1 point per 1000 kg of CO2e emitted. Capped at a minimum of 0.
  const environmentalScore = Math.max(0, 100 - (totalCarbon / 1000));

  // 3. Compute Overall ESG Score:
  // Simple average of Environmental, Social, and Governance pillars, rounded to the nearest integer.
  const overallEsgScore = Math.round(
    (environmentalScore + department.socialScore + department.governanceScore) / 3
  );

  // 4. Update the department record
  department.environmentalScore = parseFloat(environmentalScore.toFixed(2));
  department.overallEsgScore = overallEsgScore;
  await department.save();

  console.log(
    `📈 Recalculated Department ESG Scores [ID: ${departmentId}]: Environmental: ${department.environmentalScore}, Overall: ${department.overallEsgScore} (Total Carbon: ${totalCarbon} kg)`
  );
  
  return department;
};

module.exports = {
  calculateEmission,
  updateDepartmentESG,
};
