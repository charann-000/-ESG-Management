import React, { useState } from "react";
import { ScoreCard } from "./ScoreCard";
import { CarbonChart } from "./CarbonChart";
import { Leaderboard } from "./Leaderboard";
import { ComplaintsLog } from "./ComplaintsLog";
import { CommandCenter } from "./CommandCenter";
import { useStylesheet } from "../hooks/useStylesheet";

export const CEODashboard = ({ onViewChange, onLogout }) => {
  useStylesheet(['/colors_and_type.css', '/root_index.css']);
  // Score state
  const [scoreState, setScoreState] = useState({ e: 68, s: 76, g: 74 });

  // Departments state
  const [departments, setDepartments] = useState([
    { id: "engineering", name: "Engineering", eventsCount: 8, approvalRate: 92, xp: 4850, rank: "Rank A" },
    { id: "sales", name: "Sales & Marketing", eventsCount: 6, approvalRate: 85, xp: 3200, rank: "Rank B" },
    { id: "operations", name: "Operations", eventsCount: 4, approvalRate: 78, xp: 2650, rank: "Rank C" },
    { id: "hr", name: "HR & Admin", eventsCount: 3, approvalRate: 95, xp: 1800, rank: "Rank C" }
  ]);

  // Complaints state
  const [complaints, setComplaints] = useState([
    {
      id: "c1",
      type: "Scope-1 Breach",
      department: "Operations",
      description: "Emission factors recorded in ERP do not match the regional grid parameters for May offsets.",
      proofTitle: "Scope-1 Grid parameters matching audit report",
      proofImg: "assets/source-notes-roles.jpeg",
      impact: 1.8
    },
    {
      id: "c2",
      type: "Policy-Gate Bypass",
      department: "Sales & Events",
      description: "CSR activity event check-in was activated via QR code without mandatory policy checklist approval.",
      proofTitle: "QR gate activation logs showing missing verification",
      proofImg: "assets/source-notes-roles-alt.jpeg",
      impact: 2.2
    }
  ]);

  // Employees database state
  const [employees, setEmployees] = useState([
    { id: "1", name: "Elena Rostova", role: "Admin", department: "HR & Admin", status: "Active" },
    { id: "2", name: "Marcus Vance", role: "Manager", department: "Operations", status: "Active" },
    { id: "3", name: "Devon Lane", role: "Employee", department: "Engineering", status: "Active" },
    { id: "4", name: "Sarah Jenkins", role: "Auditor", department: "Operations", status: "Active" }
  ]);

  // Policies state
  const [policies, setPolicies] = useState([
    { id: "p1", title: "ERP-linked carbon emission target policy", scope: "Environmental", status: "Active" },
    { id: "p2", title: "Social CSR program participation threshold", scope: "Social", status: "Active" }
  ]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: "", desc: "", img: "" });

  const clamp = (n) => Math.max(0, Math.min(100, n));

  const handleResolveComplaint = (id, impact) => {
    setComplaints((prev) => prev.filter((c) => c.id !== id));
    setScoreState((prev) => ({
      ...prev,
      g: clamp(prev.g + impact)
    }));
  };

  const handleOpenProofModal = (title, desc, img) => {
    setModalData({ title, desc, img });
    setModalOpen(true);
  };

  const handleAddEmployee = (name, role, dept) => {
    const newEmp = {
      id: Date.now().toString(),
      name,
      role,
      department: dept,
      status: "Active"
    };
    setEmployees((prev) => [newEmp, ...prev]);
  };

  const handleCreatePolicy = (name, scope, _summary) => {
    const newPolicy = {
      id: Date.now().toString(),
      title: name,
      scope,
      status: "Active"
    };
    setPolicies((prev) => [newPolicy, ...prev]);
    setScoreState((prev) => ({
      ...prev,
      g: clamp(prev.g + 1.5)
    }));
  };

  const handleAwardXP = (deptId, amount, _reason) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === deptId ? { ...d, xp: d.xp + amount } : d))
    );
    setScoreState((prev) => ({
      ...prev,
      s: clamp(prev.s + 1.2)
    }));
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
              <span>EcoSphere<small>CEO Workspace</small></span>
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
              <li><a href="#top" className="active">CEO Dashboard</a></li>
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
              <i></i>CEO Account
            </div>
          </div>
        </div>
      </header>

      <main id="top" style={{ marginTop: "10px" }}>
        <div className="container">
          {/* Dashboard Hero Info + Live Scorecard */}
          <section className="dashboard-hero">
            <div className="hero-info">
              <h1>Executive <em>Oversight.</em></h1>
              <p>
                Review corporate ESG rollup metrics, audit carbon footprints (Scope 1/2), publish operational compliance policy, and authorize CSR rewards directly linked to ERP operations.
              </p>
            </div>

            <ScoreCard scoreState={scoreState} />
          </section>

          {/* Bento Grid Dashboard */}
          <section className="bento-grid">
            <CarbonChart />

            <ComplaintsLog
              complaints={complaints}
              onResolve={handleResolveComplaint}
              onViewProof={handleOpenProofModal}
            />

            <Leaderboard departments={departments} />

            <CommandCenter
              employees={employees}
              policies={policies}
              onAddEmployee={handleAddEmployee}
              onCreatePolicy={handleCreatePolicy}
              onAwardXP={handleAwardXP}
            />
          </section>
        </div>

        {/* Image Viewer Modal for Proof */}
        <div
          className={`modal-overlay ${modalOpen ? "open" : ""}`}
          id="proof-modal"
          onClick={() => setModalOpen(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title" id="modal-title">
              {modalData.title}
            </div>
            <div className="modal-content" id="modal-desc">
              {modalData.desc}
            </div>
            <div className="modal-proof-img">
              {modalData.img ? (
                <img
                  src={modalData.img}
                  alt="Verification Proof"
                  style={{
                    maxHeight: "100%",
                    maxWidth: "100%",
                    objectFit: "contain"
                  }}
                />
              ) : (
                <span>Loading Image...</span>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalOpen(false)}
                style={{ minHeight: "38px", padding: "0 16px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
