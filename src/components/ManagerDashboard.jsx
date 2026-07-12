import React, { useState, useEffect } from "react";
import { getESGScores, getCSRPrograms, createCSRProgram, approveCSREntry, logEmissionTransaction, getManagerDashboard } from "../api/api";

export const ManagerDashboard = ({ onViewChange, onLogout }) => {
  // Score state — will be fetched from backend
  const [scoreState, setScoreState] = useState({ e: 65, s: 72, g: 78 });
  const [loading, setLoading] = useState(true);

  // Employee CSR approvals list — fetched from backend
  const [approvals, setApprovals] = useState([]);

  // Active CSR programs registry — fetched from backend
  const [csrPrograms, setCsrPrograms] = useState([]);

  // Form inputs
  const [txnTitle, setTxnTitle] = useState("");
  const [txnType, setTxnType] = useState("Scope-1 Diesel");
  const [txnAmount, setTxnAmount] = useState("");
  const [txnRegion, setTxnRegion] = useState("G-West Grid");
  const [ledgerFeedback, setLedgerFeedback] = useState("");

  const [csrTitle, setCsrTitle] = useState("");
  const [csrXp, setCsrXp] = useState(500);
  const [csrFeedback, setCsrFeedback] = useState("");

  // Inspect Modal states
  const [selectedProof, setSelectedProof] = useState(null);

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Try fetching manager-specific dashboard data
      const dashData = await getManagerDashboard();
      if (dashData && dashData.success) {
        // Use backend data if available
        if (dashData.data) {
          if (dashData.data.scores) {
            setScoreState({
              e: dashData.data.scores.environmental ?? 65,
              s: dashData.data.scores.social ?? 72,
              g: dashData.data.scores.governance ?? 78,
            });
          }
          if (dashData.data.approvals) {
            setApprovals(dashData.data.approvals.map((a) => ({
              id: a._id || a.id,
              employee: a.employeeName || a.employee || "Employee",
              event: a.eventName || a.event || "CSR Event",
              description: a.description || "",
              img: a.proofImage || a.img || "assets/source-notes-roles.jpeg",
              xp: a.xpReward || a.xp || 500,
            })));
          }
          if (dashData.data.csrPrograms) {
            setCsrPrograms(dashData.data.csrPrograms.map((p) => ({
              id: p._id || p.id,
              title: p.title || p.name,
              xp: p.xpReward || p.xp || 500,
            })));
          }
        }
      } else {
        // Fallback: try individual endpoints
        const scoresData = await getESGScores();
        if (scoresData && scoresData.success && scoresData.data) {
          setScoreState({
            e: scoresData.data.environmental ?? scoresData.data.e ?? 65,
            s: scoresData.data.social ?? scoresData.data.s ?? 72,
            g: scoresData.data.governance ?? scoresData.data.g ?? 78,
          });
        }

        const csrData = await getCSRPrograms();
        if (csrData && csrData.success) {
          const programs = csrData.data || csrData.programs || [];
          setCsrPrograms(programs.map((p) => ({
            id: p._id || p.id,
            title: p.title || p.name,
            xp: p.xpReward || p.xp || 500,
          })));

          // Filter for pending approvals
          const pending = (csrData.pendingApprovals || csrData.approvals || []);
          setApprovals(pending.map((a) => ({
            id: a._id || a.id,
            employee: a.employeeName || a.employee || "Employee",
            event: a.eventName || a.event || "CSR Event",
            description: a.description || "",
            img: a.proofImage || a.img || "assets/source-notes-roles.jpeg",
            xp: a.xpReward || a.xp || 500,
          })));
        }
      }

      // If nothing loaded from backend, use fallback mock data
      if (csrPrograms.length === 0 && approvals.length === 0) {
        setApprovals([
          {
            id: "a1",
            employee: "Sarah Jenkins",
            event: "Volunteer Seminar",
            description: "Sarah Jenkins - Clean Energy seminar attendance log",
            img: "assets/source-notes-roles.jpeg",
            xp: 500,
          },
          {
            id: "a2",
            employee: "Marcus Vance",
            event: "Community Cleanup",
            description: "Marcus Vance - Volunteer cleanup site check-in logs",
            img: "assets/source-notes-roles-alt.jpeg",
            xp: 400,
          }
        ]);
        setCsrPrograms([
          { title: "Energy saving audit program", xp: 500 },
          { title: "Waste sort optimization", xp: 300 }
        ]);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const getWeightedScore = () => {
    return scoreState.e * 0.4 + scoreState.s * 0.3 + scoreState.g * 0.3;
  };

  const weighted = getWeightedScore();

  const handleLogTransaction = async (e) => {
    e.preventDefault();
    if (!txnTitle.trim() || !txnAmount) return;

    setLedgerFeedback("Pushing to ERP database...");

    const result = await logEmissionTransaction({
      title: txnTitle.trim(),
      type: txnType,
      quantity: parseFloat(txnAmount),
      region: txnRegion,
    });

    if (result && result.success) {
      setScoreState((prev) => ({
        ...prev,
        e: Math.min(100, prev.e + 1.8),
      }));
      setLedgerFeedback(result.message || "Transaction successfully pushed to ERP ledger & Synced to database (+1.8 E)");
    } else {
      // Fallback: update locally even if backend call fails
      setScoreState((prev) => ({
        ...prev,
        e: Math.min(100, prev.e + 1.8),
      }));
      setLedgerFeedback("Transaction logged locally (+1.8 E). Backend sync pending.");
    }

    setTxnTitle("");
    setTxnAmount("");
    setTimeout(() => setLedgerFeedback(""), 3500);
  };

  const handleCreateCSR = async (e) => {
    e.preventDefault();
    if (!csrTitle.trim()) return;

    const newCsr = {
      title: csrTitle.trim(),
      xp: parseInt(csrXp, 10) || 500,
    };

    setCsrFeedback("Publishing CSR program...");

    const result = await createCSRProgram({
      title: newCsr.title,
      xpReward: newCsr.xp,
      name: newCsr.title,
    });

    if (result && result.success) {
      const created = result.data || result.program || newCsr;
      setCsrPrograms((prev) => [{
        id: created._id || created.id || Date.now(),
        title: created.title || created.name || newCsr.title,
        xp: created.xpReward || created.xp || newCsr.xp,
      }, ...prev]);
      setCsrFeedback(result.message || "CSR Volunteer Program successfully published.");
    } else {
      // Fallback: add locally
      setCsrPrograms((prev) => [newCsr, ...prev]);
      setCsrFeedback("CSR program saved locally. Backend sync pending.");
    }

    setCsrTitle("");
    setTimeout(() => setCsrFeedback(""), 3500);
  };

  const approveCSR = async (id, xpReward) => {
    const result = await approveCSREntry(id);

    // Remove from list regardless of backend response
    setApprovals((prev) => prev.filter((a) => a.id !== id));

    if (result && result.success) {
      // Use backend-returned scores if available
      if (result.data && result.data.scores) {
        setScoreState({
          e: result.data.scores.environmental ?? scoreState.e,
          s: result.data.scores.social ?? scoreState.s,
          g: result.data.scores.governance ?? scoreState.g,
        });
      } else {
        setScoreState((prev) => ({
          ...prev,
          s: Math.min(100, prev.s + 1.5),
        }));
      }
    } else {
      // Fallback: update locally
      setScoreState((prev) => ({
        ...prev,
        s: Math.min(100, prev.s + 1.5),
      }));
    }
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
              <span>EcoSphere<small>Manager Workspace</small></span>
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
              <li><a href="#top" className="active">Manager Dashboard</a></li>
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
              <i></i>Manager Account
            </div>
          </div>
        </div>
      </header>

      <main id="top" style={{ marginTop: "10px" }}>
        <div className="container">
          
          {/* Hero header */}
          <section className="dashboard-hero">
            <div className="hero-info">
              <h1>Departmental <em>Operations.</em></h1>
              <p>
                Manager workspace for logging ERP resource transactions, planning CSR activities, and verifying checkpoints.
              </p>
            </div>

            {/* Departmental score card HUD */}
            <div className="score-card" id="score-card">
              <div className="score-head">
                <h3>Operations Score</h3>
                <span className="live-pill"><i></i>Live rollup</span>
              </div>
              <div className="score-big">{weighted.toFixed(1)}</div>
              <p className="score-sub">Weighted rollup · E {Math.round(scoreState.e)} | S {Math.round(scoreState.s)} | G {Math.round(scoreState.g)}</p>
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
            
            {/* ERP transaction logger */}
            <article className="bento-card span-8">
              <div className="card-header">
                <div>
                  <span className="card-eyebrow">ERP Integration</span>
                  <h2>Log Operational Resource usage</h2>
                </div>
              </div>
              
              <form id="ledger-form" onSubmit={handleLogTransaction}>
                <div className="form-row-2" style={{ marginBottom: "12px" }}>
                  <div className="form-group">
                    <label>Operational Activity</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Regional cargo fleet fuel purchase" 
                      value={txnTitle}
                      onChange={(e) => setTxnTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Resource Category</label>
                    <select value={txnType} onChange={(e) => setTxnType(e.target.value)}>
                      <option value="Scope-1 Diesel">Scope-1 Fleet Diesel (gal)</option>
                      <option value="Scope-2 Electric">Scope-2 Facility Power (kWh)</option>
                      <option value="Scope-3 Supplies">Scope-3 Office Supplies (kg)</option>
                    </select>
                  </div>
                </div>
                <div className="form-row-2" style={{ marginBottom: "16px" }}>
                  <div className="form-group">
                    <label>Resource Quantity</label>
                    <input 
                      type="number" 
                      required 
                      placeholder="e.g. 1500" 
                      min="1" 
                      value={txnAmount}
                      onChange={(e) => setTxnAmount(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Regional Grid Coordination</label>
                    <select value={txnRegion} onChange={(e) => setTxnRegion(e.target.value)}>
                      <option value="G-West Grid">G-West Coordination (Carbon Factor: 10.21)</option>
                      <option value="G-East Grid">G-East Coordination (Carbon Factor: 9.85)</option>
                      <option value="G-North Grid">G-North Coordination (Carbon Factor: 8.72)</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn-submit">Push Entry to ERP database</button>
              </form>
              {ledgerFeedback && (
                <div style={{ color: "var(--accent)", fontSize: "11.5px", fontFamily: "var(--font-mono)", marginTop: "6px" }}>
                  {ledgerFeedback}
                </div>
              )}
            </article>

            {/* CSR Check-ins approvals queue */}
            <article className="bento-card span-4">
              <div className="card-header">
                <div>
                  <span className="card-eyebrow">Social Approvals</span>
                  <h2>CSR Check-in Requests</h2>
                </div>
              </div>
              
              <div className="approvals-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {loading ? (
                  <p style={{ color: "var(--muted)", fontSize: "13px", fontFamily: "var(--font-mono)", textAlign: "center", padding: "20px 0" }}>
                    Loading approvals...
                  </p>
                ) : approvals.length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: "13px", fontFamily: "var(--font-mono)", textAlign: "center", padding: "20px 0" }}>
                    All participant approvals completed.
                  </p>
                ) : (
                  approvals.map((app) => (
                    <div key={app.id} className="approval-card" style={{ background: "#ffffff", border: "1px solid var(--border)", borderRadius: "12px", padding: "18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "var(--font-mono)", marginBottom: "8px" }}>
                        <strong style={{ color: "var(--fg)" }}>{app.employee}</strong>
                        <span style={{ color: "var(--muted)" }}>{app.event}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span 
                          className="proof-link" 
                          onClick={() => setSelectedProof(app)}
                          style={{ fontSize: "11px", color: "var(--accent)", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "12px", height: "12px" }}>
                            <path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          </svg>
                          View Proof
                        </span>
                        <button 
                          type="button" 
                          className="btn-approve" 
                          onClick={() => approveCSR(app.id, app.xp)}
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                        >
                          Approve (+{app.xp} XP)
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            {/* CSR Scheduler form */}
            <article className="bento-card span-4">
              <div className="card-header">
                <div>
                  <span className="card-eyebrow">Program Planning</span>
                  <h2>Schedule CSR Activity</h2>
                </div>
              </div>
              
              <form onSubmit={handleCreateCSR}>
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label>Activity Title</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Local Tree Planting Program" 
                    value={csrTitle}
                    onChange={(e) => setCsrTitle(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "14px" }}>
                  <label>XP Rewards Cap</label>
                  <input 
                    type="number" 
                    required 
                    min="100" 
                    step="50" 
                    value={csrXp}
                    onChange={(e) => setCsrXp(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-submit" style={{ width: "100%" }}>
                  Launch CSR Activity
                </button>
              </form>
              {csrFeedback && (
                <div style={{ color: "var(--accent)", fontSize: "11.5px", fontFamily: "var(--font-mono)", marginTop: "6px" }}>
                  {csrFeedback}
                </div>
              )}

              <div className="csr-programs-list" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px", maxHeight: "150px", overflowY: "auto" }}>
                {csrPrograms.map((program, idx) => (
                  <div key={program.id || idx} className="csr-program-row" style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#ffffff", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13px" }}>
                    <span>{program.title}</span>
                    <strong style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{program.xp} XP</strong>
                  </div>
                ))}
              </div>
            </article>

            {/* Carbon target SVG chart */}
            <article className="bento-card span-8">
              <div className="card-header">
                <div>
                  <span className="card-eyebrow">Operations Metrics</span>
                  <h2>Department Emissions vs Offset Targets</h2>
                </div>
              </div>
              
              <div className="chart-container" style={{ height: "180px" }}>
                <svg className="chart-svg" viewBox="0 0 600 180">
                  <line className="chart-grid-line" x1="40" y1="20" x2="580" y2="20" />
                  <text className="chart-axis-text" x="12" y="23">120t</text>
                  
                  <line className="chart-grid-line" x1="40" y1="70" x2="580" y2="70" />
                  <text className="chart-axis-text" x="12" y="73">80t</text>
                  
                  <line className="chart-grid-line" x1="40" y1="120" x2="580" y2="120" />
                  <text className="chart-axis-text" x="12" y="123">40t</text>
                  
                  <line className="chart-grid-line" x1="40" y1="160" x2="580" y2="160" />
                  <text className="chart-axis-text" x="12" y="163">0t</text>

                  {["Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((m, idx) => (
                    <text key={m} className="chart-axis-text" x={70 + idx * 95} y="174" textAnchor="middle">{m}</text>
                  ))}

                  <g>
                    {[90, 90, 80, 80, 70, 70].map((val, idx) => {
                      const h = (val / 120) * 140;
                      return (
                        <rect 
                          key={idx}
                          x={70 + idx * 95 - 20}
                          y={160 - h}
                          width="15"
                          height={h}
                          fill="var(--muted)"
                          rx="3"
                          style={{ opacity: 0.3 }}
                        />
                      );
                    })}
                    {[104, 88, 78, 82, 68, 64].map((val, idx) => {
                      const h = (val / 120) * 140;
                      return (
                        <rect 
                          key={idx}
                          x={70 + idx * 95 + 2}
                          y={160 - h}
                          width="15"
                          height={h}
                          fill="var(--accent)"
                          rx="3"
                          style={{ opacity: 0.85 }}
                        />
                      );
                    })}
                  </g>
                </svg>
              </div>
              <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "-6px" }}>
                Target threshold (dark gray columns) represents offset goals. Operations department offset rate is <strong style={{ color: "var(--accent)" }}>92.4% target met</strong>.
              </p>
            </article>

          </section>

        </div>

        {/* Inspect Proof Modal Overlay */}
        {selectedProof && (
          <div className="modal-overlay open" onClick={() => setSelectedProof(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-title">CSR Attendance Proof</div>
              <div className="modal-content-text" style={{ padding: "8px 0" }}>
                {selectedProof.description}
              </div>
              <div className="modal-proof-img" style={{ height: "180px", background: "rgba(12,26,20,0.03)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <img src={selectedProof.img} alt="Attendance proof document" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedProof(null)}
                  style={{ padding: "8px 16px", borderRadius: "20px", border: "1px solid var(--border)", cursor: "pointer" }}
                >
                  Close Proof
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};
