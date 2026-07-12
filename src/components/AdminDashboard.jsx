import React, { useState } from "react";

export const AdminDashboard = ({ onViewChange, onLogout }) => {
  const [activeTab, setActiveTab] = useState("tab-dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Scoring weights and scores state
  const [weights, setWeights] = useState({ e: 0.40, s: 0.30, g: 0.30 });
  const [scoreState, setScoreState] = useState({ e: 76, s: 83, g: 83 });

  // Emission factors coefficients
  const [elecFactor, setElecFactor] = useState(0.38);
  const [dieselFactor, setDieselFactor] = useState(10.21);

  // Input states
  const [factorType, setFactorType] = useState("Grid Electricity");
  const [factorVal, setFactorVal] = useState(0.38);
  const [factorFeedback, setFactorFeedback] = useState("");

  const [badgeTitle, setBadgeTitle] = useState("");
  const [badgeXp, setBadgeXp] = useState(1000);
  const [badgeFeedback, setBadgeFeedback] = useState("");
  const [badgesList, setBadgesList] = useState([
    { title: "Eco-Warrior", xp: 500, label: "5 CSR participations" },
    { title: "Net-Zero Hero", xp: 1500, label: "Audit Scope-1 Grid" }
  ]);

  const [weightE, setWeightE] = useState(40);
  const [weightS, setWeightS] = useState(30);
  const [weightG, setWeightG] = useState(30);
  const [weightFeedback, setWeightFeedback] = useState("");

  // Inspect Modal states
  const [selectedDept, setSelectedDept] = useState(null);
  const [exportFeedback, setExportFeedback] = useState("");

  const getWeightedScore = () => {
    return scoreState.e * weights.e + scoreState.s * weights.s + scoreState.g * weights.g;
  };

  const weighted = getWeightedScore();

  // Departments rows list
  const departmentsData = [
    { name: "Engineering & IT", e: 72, s: 84, g: 78, staff: "14 Staff", details: "8 CSR participations approved\nRenewable utility power synced OK\n0 Active complaints notices" },
    { name: "Operations & Fleet", e: 65, s: 72, g: 78, staff: "32 Staff", details: "Scope-1 diesel purchase log: 1,500 gal\n1 unresolved coordinates warning raised\n2 pending auditor compliance checks" },
    { name: "Sales & Marketing", e: 68, s: 76, g: 70, staff: "18 Staff", details: "QR CSR scanner check-ins: 45 verified\nDev-bypass check status bypass resolved\n0 outstanding warnings" },
    { name: "HR & Administration", e: 74, s: 78, g: 82, staff: "6 Staff", details: "4 corporate policies registry checks completed\nEmployee registration synced: 14 current\n0 active anomalies" }
  ];

  const filteredDepts = departmentsData.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateFactor = (e) => {
    e.preventDefault();
    const val = parseFloat(factorVal);
    if (!val || val <= 0) return;

    if (factorType === "Grid Electricity") {
      setElecFactor(val);
    } else {
      setDieselFactor(val);
    }

    setScoreState((prev) => ({
      ...prev,
      e: Math.min(100, prev.e + 1),
    }));

    setFactorFeedback(`${factorType} updated successfully (+1 E).`);
    setTimeout(() => setFactorFeedback(""), 3500);
  };

  const handleCreateBadge = (e) => {
    e.preventDefault();
    if (!badgeTitle.trim()) return;

    const newBadge = {
      title: badgeTitle.trim(),
      xp: badgeXp,
      label: "Audit criteria set",
    };

    setBadgesList((prev) => [newBadge, ...prev]);
    setBadgeFeedback("Sustainability badge successfully published.");
    setBadgeTitle("");
    setTimeout(() => setBadgeFeedback(""), 3500);
  };

  const handleUpdateWeights = (e) => {
    e.preventDefault();
    const we = parseInt(weightE, 10) || 0;
    const ws = parseInt(weightS, 10) || 0;
    const wg = parseInt(weightG, 10) || 0;

    if (we + ws + wg !== 100) {
      setWeightFeedback("Error: Weights sum must equal exactly 100%.");
      return;
    }

    setWeights({
      e: we / 100,
      s: ws / 100,
      g: wg / 100,
    });

    setWeightFeedback("Global ESG weights formula updated successfully.");
    setTimeout(() => setWeightFeedback(""), 3500);
  };

  const triggerExport = () => {
    setExportFeedback("Compiling ESG analytics report...");
    setTimeout(() => {
      setExportFeedback("EcoSphere_Admin_Report.pdf downloaded successfully.");
    }, 1500);
  };

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 3c-3.4 4.4-6 7.7-6 11a6 6 0 0 0 12 0c0-3.3-2.6-6.6-6-11Z" />
              <path d="M12 14v7" />
            </svg>
          </span>
          <span>EcoSphere<small>ESG Management</small></span>
        </div>

        <nav style={{ flex: 1 }}>
          <ul className="sidebar-menu">
            <li>
              <div 
                className={`sidebar-menu-link ${activeTab === "tab-dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("tab-dashboard")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
                Dashboard
              </div>
            </li>
            <li>
              <div 
                className={`sidebar-menu-link ${activeTab === "tab-departments" ? "active" : ""}`}
                onClick={() => setActiveTab("tab-departments")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Departments
              </div>
            </li>
            <li>
              <div 
                className={`sidebar-menu-link ${activeTab === "tab-badges" ? "active" : ""}`}
                onClick={() => setActiveTab("tab-badges")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                Rewards & Badges
              </div>
            </li>
            <li>
              <div 
                className={`sidebar-menu-link ${activeTab === "tab-master" ? "active" : ""}`}
                onClick={() => setActiveTab("tab-master")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>
                Master Data
              </div>
            </li>
            <li>
              <div 
                className={`sidebar-menu-link ${activeTab === "tab-settings" ? "active" : ""}`}
                onClick={() => setActiveTab("tab-settings")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Settings
              </div>
            </li>
            <li style={{ marginTop: "20px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
              <div 
                className="sidebar-menu-link"
                style={{ color: "var(--danger)" }}
                onClick={(e) => {
                  e.preventDefault();
                  onLogout();
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </div>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-panel">
        
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-title">
            {activeTab === "tab-dashboard" && "Dashboard"}
            {activeTab === "tab-departments" && "Departments"}
            {activeTab === "tab-badges" && "Rewards & Badges"}
            {activeTab === "tab-master" && "Master Data"}
            {activeTab === "tab-settings" && "Settings"}
          </div>
          
          <div className="topbar-actions">
            {activeTab === "tab-dashboard" && (
              <div className="search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
            
            <button className="btn-icon">
              <i></i>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            
            <div className="profile-badge">
              <div className="profile-avatar">RA</div>
              <div className="profile-info">
                <div className="profile-name">Ravi Anand</div>
                <div className="profile-role">Admin - ESG Manager</div>
              </div>
            </div>
          </div>
        </header>

        {/* VIEW 1: Dashboard Panel */}
        <div className={`view-container ${activeTab === "tab-dashboard" ? "active" : ""}`}>
          
          {/* KPI Row */}
          <div className="kpi-row">
            
            {/* Overall progress card */}
            <div className="kpi-card span-overall">
              <div className="kpi-overall-content">
                <div className="gauge-wrapper">
                  <svg className="gauge-svg" viewBox="0 0 100 100">
                    <circle className="gauge-bg" cx="50" cy="50" r="45" />
                    <circle 
                      className="gauge-fill" 
                      cx="50" cy="50" r="45"
                      style={{ strokeDashoffset: 283 - (283 * weighted) / 100 }}
                    />
                  </svg>
                  <div className="gauge-text">
                    <span className="gauge-number">{Math.round(weighted)}</span>
                    <span className="gauge-label">/ 100</span>
                  </div>
                </div>
                <div className="overall-details">
                  <div className="overall-title">Overall ESG Score</div>
                  <div className="overall-desc">Organization is performing above target</div>
                  <div className="overall-stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "12px", height: "12px" }}><polyline points="18 15 13 10 8 15"/><polyline points="18 9 13 4 8 9"/></svg>
                    +3.4 pts vs last quarter
                  </div>
                </div>
              </div>
            </div>

            {/* Environmental */}
            <div className="kpi-card span-metric">
              <div className="metric-head">
                <div className="metric-score">{Math.round(scoreState.e)}</div>
                <span className="metric-trend up">
                  <svg viewBox="0 0 24 24" strokeWidth="3" fill="none" stroke="currentColor" style={{ width: "10px", height: "10px" }}><polyline points="18 15 13 10 8 15"/></svg>
                  4.1%
                </span>
              </div>
              <div className="metric-label">Environmental</div>
              <div className="metric-sub">Emissions down 8% MoM</div>
            </div>

            {/* Social */}
            <div className="kpi-card span-metric">
              <div className="metric-head">
                <div className="metric-score">{Math.round(scoreState.s)}</div>
                <span className="metric-trend up">
                  <svg viewBox="0 0 24 24" strokeWidth="3" fill="none" stroke="currentColor" style={{ width: "10px", height: "10px" }}><polyline points="18 15 13 10 8 15"/></svg>
                  2.6%
                </span>
              </div>
              <div className="metric-label">Social</div>
              <div className="metric-sub">612 active participants</div>
            </div>

            {/* Governance */}
            <div className="kpi-card span-metric">
              <div className="metric-head">
                <div className="metric-score">{Math.round(scoreState.g)}</div>
                <span className="metric-trend down">
                  <svg viewBox="0 0 24 24" strokeWidth="3" fill="none" stroke="currentColor" style={{ width: "10px", height: "10px" }}><polyline points="18 9 13 14 8 9"/></svg>
                  0.5%
                </span>
              </div>
              <div className="metric-label">Governance</div>
              <div className="metric-sub">6 open compliance issues</div>
            </div>

          </div>

          {/* Charts Row */}
          <div className="charts-row">
            
            {/* SVG line trend chart */}
            <div className="chart-card span-trend">
              <div className="chart-header">
                <div className="chart-title">Emissions trend</div>
                <div className="chart-subtitle">Total tCO2e across all departments, last 6 months</div>
              </div>
              <div className="trend-container">
                <svg className="trend-svg" viewBox="0 0 680 180">
                  <defs>
                    <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  <line className="trend-grid" x1="40" y1="20" x2="660" y2="20" />
                  <text className="trend-axis-lbl" x="12" y="23">600</text>
                  
                  <line className="trend-grid" x1="40" y1="60" x2="660" y2="60" />
                  <text className="trend-axis-lbl" x="12" y="63">450</text>
                  
                  <line className="trend-grid" x1="40" y1="100" x2="660" y2="100" />
                  <text className="trend-axis-lbl" x="12" y="103">300</text>
                  
                  <line className="trend-grid" x1="40" y1="140" x2="660" y2="140" />
                  <text className="trend-axis-lbl" x="12" y="143">150</text>
                  
                  <line className="trend-grid" x1="40" y1="170" x2="660" y2="170" />
                  <text className="trend-axis-lbl" x="12" y="173">0</text>

                  {/* Months */}
                  <text className="trend-axis-lbl" x="70" y="188" textAnchor="middle">Feb</text>
                  <text className="trend-axis-lbl" x="180" y="188" textAnchor="middle">Mar</text>
                  <text className="trend-axis-lbl" x="290" y="188" textAnchor="middle">Apr</text>
                  <text className="trend-axis-lbl" x="400" y="188" textAnchor="middle">May</text>
                  <text className="trend-axis-lbl" x="510" y="188" textAnchor="middle">Jun</text>
                  <text className="trend-axis-lbl" x="620" y="188" textAnchor="middle">Jul</text>

                  {/* Line area */}
                  <path className="trend-area" d="M 70,82 L 180,84 L 290,92 L 400,96 L 510,105 L 620,112 L 620,170 L 70,170 Z" />

                  {/* Line curve */}
                  <path className="trend-line" d="M 70,82 L 180,84 L 290,92 L 400,96 L 510,105 L 620,112" />

                  {/* Points */}
                  {[82, 84, 92, 96, 105, 112].map((y, idx) => (
                    <circle key={idx} className="trend-dot" cx={70 + idx * 110} cy={y} r="4.5" />
                  ))}
                </svg>
              </div>
            </div>

            {/* Donut breakdown */}
            <div className="chart-card span-donut">
              <div className="chart-header">
                <div className="chart-title">ESG pillar breakdown</div>
                <div className="chart-subtitle">Company-wide average</div>
              </div>
              <div className="donut-container">
                <svg className="donut-svg" viewBox="0 0 100 100">
                  <circle className="donut-segment e" cx="50" cy="50" r="35" strokeDasharray="220" strokeDashoffset="66" />
                  <circle className="donut-segment s" cx="50" cy="50" r="35" strokeDasharray="220" strokeDashoffset="140" style={{ transform: "rotate(95deg)", transformOrigin: "center" }} />
                  <circle className="donut-segment g" cx="50" cy="50" r="35" strokeDasharray="220" strokeDashoffset="176" style={{ transform: "rotate(225deg)", transformOrigin: "center" }} />
                </svg>
              </div>
              <div className="donut-legend">
                <div className="donut-legend-item">
                  <div className="donut-legend-left"><i className="donut-legend-color e"></i><span>Environmental</span></div>
                  <span className="donut-legend-val">{Math.round(scoreState.e)}</span>
                </div>
                <div className="donut-legend-item">
                  <div className="donut-legend-left"><i className="donut-legend-color s"></i><span>Social</span></div>
                  <span className="donut-legend-val">{Math.round(scoreState.s)}</span>
                </div>
                <div className="donut-legend-item">
                  <div className="donut-legend-left"><i className="donut-legend-color g"></i><span>Governance</span></div>
                  <span className="donut-legend-val">{Math.round(scoreState.g)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Table and Activities row */}
          <div className="bottom-row">
            
            {/* Table */}
            <div className="data-card span-table">
              <div className="chart-header">
                <div className="chart-title">Department overview</div>
                <div className="chart-subtitle">Click a row to drill down</div>
              </div>
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>E Score</th>
                      <th>S Score</th>
                      <th>G Score</th>
                      <th>Active Staff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepts.map((d, idx) => (
                      <tr key={idx} onClick={() => setSelectedDept(d)}>
                        <td><strong>{d.name}</strong></td>
                        <td><span className="score-chip">{d.e}</span></td>
                        <td><span className="score-chip">{d.s}</span></td>
                        <td><span className="score-chip">{d.g}</span></td>
                        <td>{d.staff}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feed + Export */}
            <div className="data-card span-activity">
              <button className="btn-green-export" onClick={triggerExport}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export report
              </button>
              {exportFeedback && (
                <div id="export-msg" style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--accent)", marginTop: "6px", textAlign: "center" }}>
                  {exportFeedback}
                </div>
              )}

              <div className="chart-header" style={{ marginTop: "24px", marginBottom: "12px" }}>
                <div className="chart-title">Recent activity</div>
              </div>
              <div className="activity-feed">
                <div className="activity-item">
                  <i className="activity-dot"></i>
                  <span className="activity-text"><strong>Manufacturing dept.</strong> submitted 14 waste entries for approval.</span>
                </div>
                <div className="activity-item">
                  <i className="activity-dot"></i>
                  <span className="activity-text"><strong>Marcus Vance</strong> verified community cleanup check-in.</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* VIEW 2: Departments Panel */}
        <div className={`view-container ${activeTab === "tab-departments" ? "active" : ""}`}>
          <div className="data-card">
            <div className="chart-header">
              <div className="chart-title">Departments Directory</div>
            </div>
            <div className="dept-detail-list">
              {departmentsData.map((d, idx) => (
                <div key={idx} className="dept-detail-card">
                  <span className="dept-detail-name">{d.name}</span>
                  <div className="dept-detail-scores">
                    <span className="score-chip">E: {d.e}</span>
                    <span className="score-chip">S: {d.s}</span>
                    <span className="score-chip">G: {d.g}</span>
                  </div>
                  <span className="dept-detail-stats">{d.staff}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* VIEW 3: Rewards & Badges Panel */}
        <div className={`view-container ${activeTab === "tab-badges" ? "active" : ""}`}>
          <div className="sub-grid-2">
            <div className="panel-form-card">
              <div className="chart-header">
                <div className="chart-title">Configure Rewards & Badges</div>
              </div>
              <form onSubmit={handleCreateBadge}>
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label>Badge Title</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. CSR Champion" 
                    value={badgeTitle}
                    onChange={(e) => setBadgeTitle(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "14px" }}>
                  <label>Requirement (XP needed)</label>
                  <input 
                    type="number" 
                    required 
                    value={badgeXp}
                    onChange={(e) => setBadgeXp(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-submit">Publish Badge</button>
              </form>
              {badgeFeedback && <div style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>{badgeFeedback}</div>}
            </div>

            <div className="data-card">
              <div className="chart-header">
                <div className="chart-title">Published Badges</div>
              </div>
              <div className="donut-legend">
                {badgesList.map((badge, idx) => (
                  <div key={idx} className="donut-legend-item" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <span><strong>{badge.title}</strong> ({badge.label})</span>
                    <span className="donut-legend-val">{badge.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* VIEW 4: Master Data Panel */}
        <div className={`view-container ${activeTab === "tab-master" ? "active" : ""}`}>
          <div className="sub-grid-2">
            <div className="panel-form-card">
              <div className="chart-header">
                <div className="chart-title">Carbon Emission Factors</div>
              </div>
              <form onSubmit={handleUpdateFactor}>
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label>Resource Type</label>
                  <select value={factorType} onChange={(e) => setFactorType(e.target.value)}>
                    <option value="Grid Electricity">Grid Electricity (kg/kWh)</option>
                    <option value="Fleet Diesel">Fleet Diesel (kg/gal)</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Carbon coefficient factor</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={factorVal}
                    onChange={(e) => setFactorVal(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-submit">Update Coefficient</button>
              </form>
              {factorFeedback && <div style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>{factorFeedback}</div>}
            </div>

            <div className="data-card">
              <div className="chart-header">
                <div className="chart-title">Active Factors</div>
              </div>
              <div className="donut-legend">
                <div className="donut-legend-item" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span>Grid Electricity</span>
                  <span className="donut-legend-val">{elecFactor} kg/kWh</span>
                </div>
                <div className="donut-legend-item" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span>Fleet Diesel</span>
                  <span className="donut-legend-val">{dieselFactor} kg/gal</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VIEW 5: Settings Panel */}
        <div className={`view-container ${activeTab === "tab-settings" ? "active" : ""}`}>
          <div className="panel-form-card" style={{ maxWidth: "600px" }}>
            <div className="chart-header">
              <div className="chart-title">Organization ESG Weights</div>
            </div>
            <form onSubmit={handleUpdateWeights}>
              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label>Environment Weight %</label>
                <input 
                  type="number" 
                  required 
                  value={weightE}
                  onChange={(e) => setWeightE(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label>Social Weight %</label>
                <input 
                  type="number" 
                  required 
                  value={weightS}
                  onChange={(e) => setWeightS(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Governance Weight %</label>
                <input 
                  type="number" 
                  required 
                  value={weightG}
                  onChange={(e) => setWeightG(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-submit">Recalculate Weighted Formula</button>
            </form>
            {weightFeedback && <div style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--font-mono)", marginTop: "6px" }}>{weightFeedback}</div>}
          </div>
        </div>

      </main>

      {/* Drill-down modal */}
      {selectedDept && (
        <div className="modal-overlay open" onClick={() => setSelectedDept(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{selectedDept.name} Audit</div>
            <div className="modal-content-text">
              <table className="modal-drill-table">
                <thead>
                  <tr>
                    <th>Operations Metric</th>
                    <th>Verification Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><th>Environmental Score</th><td>{selectedDept.e}</td></tr>
                  <tr><th>Social Rating</th><td>{selectedDept.s}</td></tr>
                  <tr><th>Governance Standing</th><td>{selectedDept.g}</td></tr>
                  {selectedDept.details.split("\n").map((line, idx) => (
                    <tr key={idx}><th>Audit parameters log</th><td>{line}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setSelectedDept(null)}
                style={{ padding: "8px 16px", borderRadius: "20px", border: "1px solid var(--border)", cursor: "pointer" }}
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
