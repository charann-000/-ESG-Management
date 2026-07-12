const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const Policy = require("../models/Policy");
const Department = require("../models/Department");
const { sendGovernanceEmail } = require("../utils/emailService");

/**
 * Centrally records audit logs.
 */
const recordAudit = async ({
  action,
  actor,
  actorRole,
  targetModel,
  targetId,
  changes = {},
  ipAddress,
  userAgent,
}) => {
  try {
    await AuditLog.create({
      action,
      actor,
      actorRole,
      targetModel,
      targetId,
      changes,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("⚠️ EventService failed to log audit:", error.message);
  }
};

/**
 * Calculates and caches the Department Governance rating.
 * Governed by Policy Acceptance rates (40% weight) and Compliance resolution rates (60% weight).
 */
const recalculateDepartmentGovernance = async (departmentId) => {
  if (!departmentId) return;

  try {
    const ComplianceIssue = mongoose.model("ComplianceIssue");
    const department = await Department.findById(departmentId);
    if (!department) return;

    // 1. Calculate Policy Acceptance rate
    const activePolicies = await Policy.find({ status: "Active" });
    const P = activePolicies.length;
    
    const employees = await User.find({
      department: departmentId,
      role: "Employee",
      status: "Active",
    });
    const E = employees.length;

    let PolicyAcceptanceScore = 100;
    if (P > 0 && E > 0) {
      let acceptancesCount = 0;
      const policyIds = activePolicies.map((p) => p._id.toString());
      
      for (const emp of employees) {
        const acceptedIds = emp.acceptedPolicies.map((ap) => ap.policy.toString());
        const count = policyIds.filter((id) => acceptedIds.includes(id)).length;
        acceptancesCount += count;
      }
      PolicyAcceptanceScore = (acceptancesCount / (P * E)) * 100;
    }

    // 2. Calculate Compliance Resolution rate
    const totalIssues = await ComplianceIssue.countDocuments({ department: departmentId });
    const verifiedIssues = await ComplianceIssue.countDocuments({
      department: departmentId,
      status: "Verified",
    });

    let ComplianceResolutionScore = 100;
    if (totalIssues > 0) {
      ComplianceResolutionScore = (verifiedIssues / totalIssues) * 100;
    }

    // 3. Compute overall Governance Score
    const governanceScore = Math.round(
      0.4 * PolicyAcceptanceScore + 0.6 * ComplianceResolutionScore
    );

    // 4. Update the department record and re-average overall ESG score
    department.governanceScore = parseFloat(governanceScore.toFixed(2));
    department.overallEsgScore = Math.round(
      (department.environmentalScore + department.socialScore + department.governanceScore) / 3
    );

    await department.save();

    console.log(
      `📊 Recalculated Department Governance Ratings [ID: ${departmentId}]: Policy Acceptance: ${PolicyAcceptanceScore.toFixed(1)}%, Compliance Resolution: ${ComplianceResolutionScore.toFixed(1)}% -> Governance Score: ${department.governanceScore}`
    );
  } catch (error) {
    console.error("⚠️ Failed to recalculate department governance scores:", error.message);
  }
};

/**
 * Central Event Service Dispatcher.
 * Handles all notification, email sending, audit logging, and score triggers.
 */
const emit = async (eventName, payload) => {
  console.log(`📡 Event emitted: [${eventName}]`);

  const { ipAddress, userAgent } = payload;

  try {
    switch (eventName) {
      case "Policy Published": {
        const { policy, actor } = payload;

        // Log audit log
        await recordAudit({
          action: "CREATE",
          actor: actor._id,
          actorRole: actor.role,
          targetModel: "Policy",
          targetId: policy._id,
          changes: { title: policy.title },
          ipAddress,
          userAgent,
        });

        // Find all active employees to notify
        const employees = await User.find({ role: "Employee", status: "Active" });

        for (const emp of employees) {
          // Record In-App notification
          await Notification.create({
            recipient: emp._id,
            title: "New Corporate Policy Published 📜",
            message: `A new policy '${policy.title}' has been published. Please review and accept it.`,
            type: "In-App",
            event: "Policy",
            targetModel: "Policy",
            targetId: policy._id,
          });

          // Email notify (failures are logged silently)
          try {
            await sendGovernanceEmail(
              emp.email,
              "New Policy Published",
              "New Corporate Policy Notice",
              `Hello ${emp.name},<br><br>The administration has published a new corporate compliance policy: <strong>${policy.title}</strong>.<br><br>Please log in to your dashboard to read and accept this policy.`
            );
          } catch (emailErr) {
            console.warn(`⚠️ Failed to email policy notice to ${emp.email}: ${emailErr.message}`);
          }
        }
        break;
      }

      case "Policy Accepted": {
        const { user, policy } = payload;

        // Log audit log
        await recordAudit({
          action: "UPDATE",
          actor: user._id,
          actorRole: user.role,
          targetModel: "User",
          targetId: user._id,
          changes: { acceptedPolicy: policy._id },
          ipAddress,
          userAgent,
        });

        // Recalculate Department Governance
        if (user.department) {
          await recalculateDepartmentGovernance(user.department);
        }
        break;
      }

      case "Audit Created": {
        const { audit, actor } = payload;

        // Log audit log
        await recordAudit({
          action: "CREATE",
          actor: actor._id,
          actorRole: actor.role,
          targetModel: "Audit",
          targetId: audit._id,
          changes: { title: audit.title, department: audit.department },
          ipAddress,
          userAgent,
        });

        // Notify assigned auditor
        const auditor = await User.findById(audit.auditedBy);
        if (auditor) {
          await Notification.create({
            recipient: auditor._id,
            title: "New ESG Audit Scheduled 🔍",
            message: `You have been assigned to conduct an audit: '${audit.title}'.`,
            type: "In-App",
            event: "Audit",
            targetModel: "Audit",
            targetId: audit._id,
          });

          try {
            await sendGovernanceEmail(
              auditor.email,
              "New Audit Assigned",
              "Assigned ESG Audit Notice",
              `Hello ${auditor.name},<br><br>You have been assigned as the lead auditor for: <strong>${audit.title}</strong>.<br><br>Please view details on your audit console.`
            );
          } catch (emailErr) {
            console.warn(`⚠️ Failed to email auditor ${auditor.email}: ${emailErr.message}`);
          }
        }
        break;
      }

      case "Audit Completed": {
        const { audit, actor } = payload;

        // Log audit log
        await recordAudit({
          action: "UPDATE",
          actor: actor._id,
          actorRole: actor.role,
          targetModel: "Audit",
          targetId: audit._id,
          changes: { status: "Completed", findings: audit.findings },
          ipAddress,
          userAgent,
        });

        // Notify Department Manager
        const dept = await Department.findById(audit.department).populate("manager");
        if (dept && dept.manager) {
          await Notification.create({
            recipient: dept.manager._id,
            title: "Department Audit Completed 🔍",
            message: `The scheduled ESG audit '${audit.title}' for your department has been completed.`,
            type: "In-App",
            event: "Audit",
            targetModel: "Audit",
            targetId: audit._id,
          });
        }
        break;
      }

      case "Compliance Created": {
        const { issue, actor } = payload;

        // Log audit log
        await recordAudit({
          action: "CREATE",
          actor: actor._id,
          actorRole: actor.role,
          targetModel: "ComplianceIssue",
          targetId: issue._id,
          changes: { title: issue.title, severity: issue.severity },
          ipAddress,
          userAgent,
        });

        // Notify Department Manager
        const dept = await Department.findById(issue.department).populate("manager");
        if (dept && dept.manager) {
          await Notification.create({
            recipient: dept.manager._id,
            title: "New Compliance Violation Logged ⚠️",
            message: `A compliance issue has been reported: '${issue.title}' (Severity: ${issue.severity}). Action required.`,
            type: "In-App",
            event: "Compliance",
            targetModel: "ComplianceIssue",
            targetId: issue._id,
          });

          try {
            await sendGovernanceEmail(
              dept.manager.email,
              "Compliance Issue Reported",
              "ESG Compliance Violation Notice",
              `Hello ${dept.manager.name},<br><br>A compliance issue has been filed for your department: <strong>${issue.title}</strong>.<br>Severity Level: <strong>${issue.severity}</strong>.<br><br>Please log in and submit resolution details as soon as possible.`
            );
          } catch (emailErr) {
            console.warn(`⚠️ Failed to email manager ${dept.manager.email}: ${emailErr.message}`);
          }
        }

        // Update score
        await recalculateDepartmentGovernance(issue.department);
        break;
      }

      case "Compliance Resolved": {
        const { issue, actor } = payload;

        // Log audit log
        await recordAudit({
          action: "UPDATE",
          actor: actor._id,
          actorRole: actor.role,
          targetModel: "ComplianceIssue",
          targetId: issue._id,
          changes: { status: "Resolved", details: issue.resolutionDetails },
          ipAddress,
          userAgent,
        });

        // Notify reporting auditor
        const auditor = await User.findById(issue.createdBy);
        if (auditor) {
          await Notification.create({
            recipient: auditor._id,
            title: "Compliance Issue Resolved (Pending Verification) 🔍",
            message: `Manager has marked the issue '${issue.title}' as Resolved. Please review and verify.`,
            type: "In-App",
            event: "Compliance",
            targetModel: "ComplianceIssue",
            targetId: issue._id,
          });
        }
        break;
      }

      case "Compliance Closed": {
        const { issue, actor } = payload;

        // Log audit log
        await recordAudit({
          action: "UPDATE",
          actor: actor._id,
          actorRole: actor.role,
          targetModel: "ComplianceIssue",
          targetId: issue._id,
          changes: { status: "Verified", details: issue.verificationDetails },
          ipAddress,
          userAgent,
        });

        // Notify Department Manager of closure
        const dept = await Department.findById(issue.department).populate("manager");
        if (dept && dept.manager) {
          await Notification.create({
            recipient: dept.manager._id,
            title: "Compliance Issue Verified & Closed ✅",
            message: `The compliance issue '${issue.title}' has been successfully verified and closed.`,
            type: "In-App",
            event: "Compliance",
            targetModel: "ComplianceIssue",
            targetId: issue._id,
          });

          try {
            await sendGovernanceEmail(
              dept.manager.email,
              "Compliance Issue Closed",
              "ESG Compliance Issue Resolved & Closed",
              `Hello ${dept.manager.name},<br><br>The compliance issue <strong>${issue.title}</strong> has been verified by the auditor and marked as closed.`
            );
          } catch (emailErr) {
            console.warn(`⚠️ Failed to email manager ${dept.manager.email}: ${emailErr.message}`);
          }
        }

        // Recalculate Department Governance (closed issues improve rating)
        await recalculateDepartmentGovernance(issue.department);
        break;
      }

      default:
        console.warn(`⚠️ EventService received unhandled event type: ${eventName}`);
    }
  } catch (error) {
    console.error(`⚠️ EventService error processing [${eventName}]:`, error.message);
  }
};

module.exports = {
  emit,
  recalculateDepartmentGovernance,
};
