const express = require("express");
const router = express.Router();

const emissionFactorController = require("../controllers/emissionFactorController");
const emissionFactorValidation = require("../validations/emissionFactorValidation");
const {
  verifyJWT,
  authorize,
  requirePasswordChange,
} = require("../middleware/authMiddleware");

// Enforce authentication, completed password updates, and Admin-only roles globally for all emission factors
router.use(verifyJWT);
router.use(requirePasswordChange);
router.use(authorize("Admin"));

// GET /emission-factors - Retrieve active listing
// POST /emission-factors - Register new factor
router
  .route("/")
  .get(emissionFactorController.getAllEmissionFactors)
  .post(
    emissionFactorValidation.createEmissionFactorValidation,
    emissionFactorController.createEmissionFactor
  );

// GET /emission-factors/:id - Get details
// PATCH /emission-factors/:id - Modify attributes
// DELETE /emission-factors/:id - Soft-delete (Inactive status)
router
  .route("/:id")
  .get(
    emissionFactorValidation.emissionFactorIdValidation,
    emissionFactorController.getEmissionFactorById
  )
  .patch(
    emissionFactorValidation.updateEmissionFactorValidation,
    emissionFactorController.updateEmissionFactor
  )
  .delete(
    emissionFactorValidation.emissionFactorIdValidation,
    emissionFactorController.deleteEmissionFactor
  );

module.exports = router;
