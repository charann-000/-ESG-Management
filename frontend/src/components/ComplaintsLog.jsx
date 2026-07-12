import React from "react";

export const ComplaintsLog = ({ complaints, onResolve, onViewProof }) => {
  return (
    <article className="bento-card span-4">
      <div className="card-header">
        <div>
          <span className="card-eyebrow">Governance (G)</span>
          <h2>Auditor Complaints</h2>
        </div>
        <span
          className="live-pill"
          style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.08)" }}
        >
          <i style={{ background: "var(--danger)", boxShadow: "0 0 6px var(--danger)" }}></i>
          Alerts
        </span>
      </div>
      <div className="complaints-list" id="complaints-list">
        {complaints.length === 0 ? (
          <p
            style={{
              color: "var(--muted)",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              textAlign: "center",
              padding: "20px 0",
            }}
          >
            All complaints resolved. Governance standing is robust.
          </p>
        ) : (
          complaints.map((comp) => (
            <div className="complaint-card" key={comp.id}>
              <div className="complaint-header">
                <span className="complaint-policy">{comp.type}</span>
                <span className="complaint-dept">{comp.department}</span>
              </div>
              <p className="complaint-desc">{comp.description}</p>
              <div className="complaint-footer">
                <span
                  className="proof-link"
                  onClick={() => onViewProof(comp.proofTitle, comp.description, comp.proofImg)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h6v6" />
                    <path d="M10 14L21 3" />
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  </svg>{" "}
                  View Proof
                </span>
                <button
                  type="button"
                  className="btn-resolve"
                  onClick={() => onResolve(comp.id, comp.impact)}
                >
                  Resolve (+{comp.impact} G)
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
};
