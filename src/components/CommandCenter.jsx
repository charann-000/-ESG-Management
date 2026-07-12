import React, { useState } from "react";

export const CommandCenter = ({
  employees,
  policies,
  onAddEmployee,
  onCreatePolicy,
  onAwardXP,
}) => {
  const [activeTab, setActiveTab] = useState("create-policy");

  // Local feedback states
  const [policyFeedback, setPolicyFeedback] = useState("");
  const [dbFeedback, setDbFeedback] = useState("");
  const [rewardsFeedback, setRewardsFeedback] = useState("");

  // Form states
  const [policyName, setPolicyName] = useState("");
  const [policyScope, setPolicyScope] = useState("Governance");
  const [policySummary, setPolicySummary] = useState("");

  const [empName, setEmpName] = useState("");
  const [empRole, setEmpRole] = useState("Employee");
  const [empDept, setEmpDept] = useState("Engineering");

  const [rewardDept, setRewardDept] = useState("engineering");
  const [rewardAmount, setRewardAmount] = useState(500);
  const [rewardReason, setRewardReason] = useState("");

  const handlePolicySubmit = (e) => {
    e.preventDefault();
    if (!policyName.trim() || !policySummary.trim()) return;

    onCreatePolicy(policyName.trim(), policyScope, policySummary.trim());
    setPolicyFeedback("Policy successfully published & archived to Governance metrics (+1.5 G)");
    setPolicyName("");
    setPolicySummary("");
    setTimeout(() => setPolicyFeedback(""), 3500);
  };

  const handleAddEmployeeSubmit = (e) => {
    e.preventDefault();
    if (!empName.trim()) return;

    onAddEmployee(empName.trim(), empRole, empDept);
    setDbFeedback(`${empName.trim()} registered in ${empDept} department database.`);
    setEmpName("");
    setTimeout(() => setDbFeedback(""), 3500);
  };

  const handleAwardXPSubmit = (e) => {
    e.preventDefault();
    if (!rewardReason.trim()) return;

    onAwardXP(rewardDept, rewardAmount, rewardReason.trim());
    setRewardsFeedback(`Authorized ${rewardAmount} XP for ${rewardDept} department (+1.2 S)`);
    setRewardReason("");
    setTimeout(() => setRewardsFeedback(""), 3500);
  };

  return (
    <article className="bento-card span-8">
      <div className="tabs-shell">
        <div className="card-header" style={{ marginBottom: "-4px" }}>
          <div>
            <span className="card-eyebrow">CEO Control Room</span>
            <h2>Executive Command Center</h2>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="command-tabs">
          <button
            className={`command-tab ${activeTab === "create-policy" ? "active" : ""}`}
            onClick={() => setActiveTab("create-policy")}
          >
            Create Policies (G)
          </button>
          <button
            className={`command-tab ${activeTab === "manage-db" ? "active" : ""}`}
            onClick={() => setActiveTab("manage-db")}
          >
            Employee Database
          </button>
          <button
            className={`command-tab ${activeTab === "rewards" ? "active" : ""}`}
            onClick={() => setActiveTab("rewards")}
          >
            Authorize Rewards (S)
          </button>
        </div>

        {/* Panel 1: Create Policies */}
        <div className={`tab-panel ${activeTab === "create-policy" ? "active" : ""}`}>
          <form onSubmit={handlePolicySubmit}>
            <div className="form-row-2" style={{ marginBottom: "12px" }}>
              <div className="form-group">
                <label htmlFor="policy-name">Policy Name</label>
                <input
                  type="text"
                  id="policy-name"
                  required
                  placeholder="e.g. CSR Event QR validation policy"
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="policy-scope">Scope</label>
                <select
                  id="policy-scope"
                  required
                  value={policyScope}
                  onChange={(e) => setPolicyScope(e.target.value)}
                >
                  <option value="Governance">Governance (Company-wide)</option>
                  <option value="Environmental">Environmental (Emission limits)</option>
                  <option value="Social">Social (CSR & Rewards)</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label htmlFor="policy-summary">Policy Summary</label>
              <textarea
                id="policy-summary"
                required
                placeholder="Outline compliance guidelines, validation parameters, and mandatory verification protocols..."
                value={policySummary}
                onChange={(e) => setPolicySummary(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-submit">
              Publish Corporate Policy
            </button>
          </form>
          <div className="policies-registry" id="policies-registry" style={{ marginTop: "10px" }}>
            {policies.map((p) => (
              <div className="policy-row" key={p.id}>
                <span className="policy-title">
                  {p.title} ({p.scope.substring(0, 3)})
                </span>
                <span className="policy-status">
                  <i></i>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
          <div id="policy-feedback" className="feedback-note" style={{ color: "var(--accent)", marginTop: "6px" }}>
            {policyFeedback}
          </div>
        </div>

        {/* Panel 2: Employee Database */}
        <div className={`tab-panel ${activeTab === "manage-db" ? "active" : ""}`}>
          <form onSubmit={handleAddEmployeeSubmit}>
            <div className="form-row-2" style={{ marginBottom: "14px" }}>
              <div className="form-group">
                <label htmlFor="emp-name">Employee Name</label>
                <input
                  type="text"
                  id="emp-name"
                  required
                  placeholder="Jane Doe"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="emp-role">Role</label>
                <select
                  id="emp-role"
                  required
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Auditor">Auditor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="emp-dept">Department</label>
                <select
                  id="emp-dept"
                  required
                  value={empDept}
                  onChange={(e) => setEmpDept(e.target.value)}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="HR & Admin">HR & Admin</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-submit" style={{ marginBottom: "10px" }}>
              Register New Employee
            </button>
          </form>

          <div className="db-container">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="db-tbody">
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td>
                      <span className={`role-badge ${emp.role.toLowerCase()}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td>{emp.department}</td>
                    <td style={{ color: "var(--accent)", fontWeight: 600 }}>{emp.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div id="db-feedback" className="feedback-note" style={{ color: "var(--accent)", marginTop: "6px" }}>
            {dbFeedback}
          </div>
        </div>

        {/* Panel 3: Rewards & XP */}
        <div className={`tab-panel ${activeTab === "rewards" ? "active" : ""}`}>
          <form onSubmit={handleAwardXPSubmit}>
            <div className="form-row-2" style={{ marginBottom: "14px" }}>
              <div className="form-group">
                <label htmlFor="rewards-dept">Select Department</label>
                <select
                  id="rewards-dept"
                  required
                  value={rewardDept}
                  onChange={(e) => setRewardDept(e.target.value)}
                >
                  <option value="engineering">Engineering</option>
                  <option value="sales">Sales & Marketing</option>
                  <option value="operations">Operations</option>
                  <option value="hr">HR & Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="rewards-amount">XP Amount</label>
                <input
                  type="number"
                  id="rewards-amount"
                  required
                  min="100"
                  max="5000"
                  step="100"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(parseInt(e.target.value, 10) || 100)}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label htmlFor="rewards-reason">Reason for Reward</label>
              <input
                type="text"
                id="rewards-reason"
                required
                placeholder="e.g. 100% participation in June energy audits"
                value={rewardReason}
                onChange={(e) => setRewardReason(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-submit">
              Authorize XP and Badges
            </button>
          </form>
          <div id="rewards-feedback" className="feedback-note" style={{ color: "var(--accent)", marginTop: "6px" }}>
            {rewardsFeedback}
          </div>
        </div>
      </div>
    </article>
  );
};
