import React from "react";

export const Leaderboard = ({ departments }) => {
  // Sort departments by XP descending
  const sortedDepts = [...departments].sort((a, b) => b.xp - a.xp);

  return (
    <article className="bento-card span-4">
      <div className="card-header">
        <div>
          <span className="card-eyebrow">Social (S)</span>
          <h2>CSR Leaderboard</h2>
        </div>
      </div>
      <div className="leaderboard-list" id="leaderboard-list">
        {sortedDepts.map((dept, index) => (
          <div className="leaderboard-row" key={dept.id}>
            <div className="rank-badge">{index + 1}</div>
            <div className="dept-info">
              <div className="dept-name">{dept.name}</div>
              <div className="dept-meta">
                {dept.eventsCount} CSR events · {dept.approvalRate}% approval
              </div>
            </div>
            <div className="dept-xp">
              <span>{dept.xp.toLocaleString()} XP</span>
              <small>{dept.rank}</small>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
};
