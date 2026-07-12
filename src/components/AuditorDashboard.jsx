import React, { useState } from "react";

export const AuditorDashboard = ({ onViewChange, onLogout }) => {
  // Score state
  const [scoreState, setScoreState] = useState({ e: 68, s: 76, g: 74 });
  
  // Ledger timeline data
  const [ledgerEntries, setLedgerEntries] = useState([
    {
      id: "log-101",
      time: "10:14 AM",
      title: "Scope-1 Cargo Fleet Fuel Purchase",
      dept: "Operations & Logistics",
      status: "UNVERIFIED",
      details: "Scope-1 Fleet Diesel purchase. Qty: 1,500 gal. Cost: $6,240. Regional Carbon Factor: 10.21. Coordinates: G-West Grid.",
    },
    {
      id: "log-102",
      time: "09:45 AM",
      title: "Scope-2 Grid Electricity Sync",
      dept: "Engineering Facilities",
      status: "VERIFIED",
      details: "Facility power readings. Qty: 4,200 kWh. Grid Carbon Coefficient: 0.38. Status: Certified zero-bypass coordinates.",
    },
    {
      id: "log-103",
      time: "08:12 AM",
      title: "CSR QR Code Employee Scan Checkin",
      dept: "Sales & Events Team",
      status: "UNVERIFIED",
      details: "Seminar Checkin Scan. Attendance list matching policy checklist gate. Warning: Checklist bypassed during scanner auth.",
    }
  ]);

  // Active Policy checklist gates
  const [policies, setPolicies] = useState([
    {
      id: "pol-01",
      title: "ERP-linked carbon emission target policy",
      checks: [
        { label: "Scope-1 grid factors certified", ok: true },
        { label: "Regional coordinates mapped OK", ok: true }
      ],
      status: "OK",
    },
    {
      id: "pol-02",
      title: "CSR volunteer participation gates rules",
      checks: [
        { label: "QR validation logs verified", ok: false },
        { label: "XP points reward thresholds set", ok: true }
      ],
      status: "BYPASS",
    }
  ]);

  // Form states
  const [noticeType, setNoticeType] = useState("Scope-1 Carbon Breach");
  const [noticeDept, setNoticeDept] = useState("Operations & Logistics");
  const [noticeDesc, setNoticeDesc] = useState("");
  const [noticeFeedback, setNoticeFeedback] = useState("");

  // Inspect Modal states
  const [selectedLog, setSelectedLog] = useState(null);
  
  // Chart view state
  const [chartView, setChartView] = useState("rates");

  const getWeightedScore = () => {
    return scoreState.e * 0.4 + scoreState.s * 0.3 + scoreState.g * 0.3;
  };

  const weighted = getWeightedScore();

  const handleCreateNotice = (e) => {
    e.preventDefault();
    if (!noticeDesc.trim()) return;

    setScoreState((prev) => ({
      ...prev,
      g: Math.max(0, prev.g - 1.8),
    }));

    setNoticeFeedback("Compliance notice logged. Governance score adjusted (-1.8 G)");
    setNoticeDesc("");
    setTimeout(() => setNoticeFeedback(""), 3500);
  };

  const handleFlagBreach = (logTitle, logDept) => {
    setNoticeType("Scope-1 Carbon Breach");
    setNoticeDept(logDept);
    setNoticeDesc(`Discrepancy identified in ERP ledger logs for "${logTitle}". Action item verification proof required.`);
    
    const formEl = document.getElementById("notice-form-card");
    if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Header Nav */}
      <header className="site-nav" id="site-nav">
        <div className="container">
          <div className="nav-shell">
            <a 
              className="brand" 
              href="#top" 
              onClick={(e) => {
                e.preventDefault();
                onViewChange("landing");
              }}
            >
              <span className="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M12 3c-3.4 4.4-6 7.7-6 11a6 6 0 0 0 12 0c0-3.3-2.6-6.6-6-11Z"/>
                  <path d="M12 14v7"/>
                </svg>
              </span>
              <span>EcoSphere<small>Auditor Workspace</small></span>
            </a>
            <ul className="nav-links">
              <li>
                <a 
                  href="#landing" 
                  onClick={(e) => {
                    e.preventDefault();
                    onViewChange("landing");
                  }}
                >
                  Marketing Landing
                </a>
              </li>
              <li><a href="#top" className="active">Auditor Dashboard</a></li>
              <li style={{ marginLeft: "10px" }}>
                <a 
                  href="#logout" 
                  style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.08)", padding: "6px 12px", borderRadius: "12px" }}
                  onClick={(e) => {
                    e.preventDefault();
                    onLogout();
                  }}
                >
                  Sign Out
                </a>
              </li>
            </ul>
            <div className="profile-pill">
              <i></i>Auditor Account
            </div>
          </div>
        </div>
      </header>

      <main id="top" style={{ marginTop: "10px" }}>
        <div className="container">
          
          {/* Hero header */}
          <section className="dashboard-hero">
            <div className="hero-info">
              <h1>Compliance <em>Auditing.</em></h1>
              <p>
                Inspect ERP database transaction logs, review checklist policies, and raise compliance breach notices directly to the corporate board.
              </p>
            </div>

            {/* Org ESG score HUD */}
            <div className="score-card" id="score-card">
              <div className="score-head">
                <h3>Org ESG score</h3>
                <span className="live-pill"><i></i>Live rollup</span>
              </div>
              <div className="score-big">{weighted.toFixed(1)}</div>
              <p className="score-sub">Weighted rollup · E 40 | S 30 | G 30</p>
              <div className="bars">
                <div className="bar-row">
                  <span>Environment</span>
                  <div className="track"><div className="fill" style={{ width: `${scoreState.e}%` }}></div></div>
                  <b>{Math.round(scoreState.e)}</b>
                </div>
                <div className="bar-row">
                  <span>Social</span>
                  <div className="track"><div className="fill social" style={{ width: `${scoreState.s}%` }}></div></div>
                  <b>{Math.round(scoreState.s)}</b>
                </div>
                <div className="bar-row">
                  <span>Governance</span>
                  <div className="track"><div className="fill gov" style={{ width: `${scoreState.g}%` }}></div></div>
                  <b>{Math.round(scoreState.g)}</b>
                </div>
              </div>
            </div>
          </section>

          {/* Bento Grid */}
          <section className="bento-grid">
            
            {/* ERP timeline log ledger */}
            <article className="bento-card span-8">
              <div className="card-header">
                <div>
                  <span className="card-eyebrow">Database Integrity</span>
                  <h2>ERP Data Sync Timeline</h2>
                </div>
              </div>
              
              <div className="audit-timeline" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {ledgerEntries.map((log) => (
                  <div 
                    key={log.id} 
                    className="timeline-row" 
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px 20px",
                      background: "#ffffff",
                      border: "1px solid var(--border)",
                      borderRadius: "12px"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--muted)", marginBottom: "2px" }}>
                        {log.time} · {log.id}
                      </div>
                      <strong style={{ fontSize: "14px", color: "var(--fg)" }}>{log.title}</strong>
                      <div style={{ fontSize: "12px", color: "var(--fg-2)" }}>{log.dept}</div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span 
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          fontWeight: "700",
                          padding: "4px 8px",
                          borderRadius: "9999px",
                          background: log.status === "VERIFIED" ? "rgba(20, 150, 92, 0.08)" : "rgba(239, 68, 68, 0.08)",
                          color: log.status === "VERIFIED" ? "var(--accent)" : "var(--danger)"
                        }}
                      >
                        {log.status}
                      </span>
                      <button 
                        type="button" 
                        className="btn-resolve" 
                        onClick={() => setSelectedLog(log)}
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        Inspect
                      </button>
                      {log.status === "UNVERIFIED" && (
                        <button 
                          type="button" 
                          className="btn-resolve" 
                          onClick={() => handleFlagBreach(log.title, log.dept)}
                          style={{ padding: "6px 12px", fontSize: "12px", background: "rgba(239,68,68,0.08)", color: "var(--danger)" }}
                        >
                          Flag Breach
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Policy gates audit list */}
            <article className="bento-card span-4">
              <div className="card-header">
                <div>
                  <span className="card-eyebrow">Governance Registry</span>
                  <h2>Corporate Policy Gateways</h2>
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {policies.map((p) => (
                  <div key={p.id} className="policy-gate-box" style={{ background: "#ffffff", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" }}>
                    <div style={{ display: "flex", justifycontent: "space-between", marginBottom: "10px" }}>
                      <strong style={{ fontSize: "13px", color: "var(--fg)" }}>{p.title}</strong>
                      <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: p.status === "OK" ? "var(--accent)" : "var(--danger)" }}>
                        {p.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {p.checks.map((chk, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--fg-2)" }}>
                          <i style={{ width: "6px", height: "6px", borderRadius: "50%", background: chk.ok ? "var(--accent)" : "var(--danger)" }}></i>
                          {chk.label}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Raise notice form */}
            <article className="bento-card span-4" id="notice-form-card">
              <div className="card-header">
                <div>
                  <span className="card-eyebrow">Action Required</span>
                  <h2>Raise Compliance Notice</h2>
                </div>
              </div>
              
              <form onSubmit={handleCreateNotice}>
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label>Target Department</label>
                  <select value={noticeDept} onChange={(e) => setNoticeDept(e.target.value)}>
                    <option>Operations & Logistics</option>
                    <option>Sales & Marketing</option>
                    <option>Engineering Facilities</option>
                    <option>HR & Administration</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label>Policy Notice Scope</label>
                  <select value={noticeType} onChange={(e) => setNoticeType(e.target.value)}>
                    <option>Scope-1 Carbon Breach</option>
                    <option>Gate Bypass Action</option>
                    <option>CSR Attendance Discrepancy</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Notice Audit description</label>
                  <textarea 
                    required
                    placeholder="Outline coordinates coordinates discrepancy details..." 
                    value={noticeDesc}
                    onChange={(e) => setNoticeDesc(e.target.value)}
                  />
                </div>
                
                <button type="submit" className="btn-submit" style={{ width: "100%" }}>
                  Broadcast Notice Alert
                </button>
              </form>
              
              {noticeFeedback && (
                <div style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--font-mono)", marginTop: "6px" }}>
                  {noticeFeedback}
                </div>
              )}
            </article>

            {/* Historical SVG compliance chart */}
            <article className="bento-card span-8">
              <div className="card-header">
                <div>
                  <span className="card-eyebrow">Audit Metrics</span>
                  <h2>Compliance Audit History</h2>
                </div>
                <div className="chart-filters">
                  <button 
                    type="button" 
                    className={`btn-filter ${chartView === "rates" ? "active" : ""}`}
                    onClick={() => setChartView("rates")}
                  >
                    Pass Rates %
                  </button>
                  <button 
                    type="button" 
                    className={`btn-filter ${chartView === "notices" ? "active" : ""}`}
                    onClick={() => setChartView("notices")}
                  >
                    Raised Notices
                  </button>
                </div>
              </div>
              
              <div className="chart-container" style={{ height: "180px" }}>
                <svg className="chart-svg" viewBox="0 0 600 180">
                  <line className="chart-grid-line" x1="40" y1="20" x2="580" y2="20" />
                  <text className="chart-axis-text" x="12" y="23">{chartView === "rates" ? "100%" : "20"}</text>
                  
                  <line className="chart-grid-line" x1="40" y1="90" x2="580" y2="90" />
                  <text className="chart-axis-text" x="12" y="93">{chartView === "rates" ? "50%" : "10"}</text>
                  
                  <line className="chart-grid-line" x1="40" y1="160" x2="580" y2="160" />
                  <text className="chart-axis-text" x="12" y="163">0</text>

                  {["Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((m, idx) => (
                    <text key={m} className="chart-axis-text" x={70 + idx * 95} y="174" textAnchor="middle">{m}</text>
                  ))}

                  {chartView === "rates" ? (
                    <g>
                      {[92, 95, 88, 74, 78, 83].map((val, idx) => {
                        const h = (val / 100) * 140;
                        return (
                          <rect 
                            key={idx}
                            x={70 + idx * 95 - 10}
                            y={160 - h}
                            width="20"
                            height={h}
                            fill="var(--accent)"
                            rx="3"
                            style={{ opacity: 0.85 }}
                          />
                        );
                      })}
                    </g>
                  ) : (
                    <g>
                      {[2, 1, 3, 5, 4, 3].map((val, idx) => {
                        const h = (val / 20) * 140;
                        return (
                          <rect 
                            key={idx}
                            x={70 + idx * 95 - 10}
                            y={160 - h}
                            width="20"
                            height={h}
                            fill="var(--danger)"
                            rx="3"
                            style={{ opacity: 0.85 }}
                          />
                        );
                      })}
                    </g>
                  )}
                </svg>
              </div>
            </article>

          </section>

        </div>

        {/* Inspect Modal Overlay */}
        {selectedLog && (
          <div className="modal-overlay open" onClick={() => setSelectedLog(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-title">ERP Audit Details</div>
              <div className="modal-content-text" style={{ padding: "12px 0" }}>
                <strong>Log Parameters:</strong>
                <div style={{ background: "rgba(12,26,20,0.03)", padding: "12px", borderRadius: "8px", margin: "8px 0", fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>
                  {selectedLog.details}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedLog(null)}
                  style={{ padding: "8px 16px", borderRadius: "20px", border: "1px solid var(--border)", cursor: "pointer" }}
                >
                  Close Audit
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};
