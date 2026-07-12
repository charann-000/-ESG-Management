import React from "react";

export const ScoreCard = ({ scoreState }) => {
  const getWeightedScore = () => {
    return scoreState.e * 0.4 + scoreState.s * 0.3 + scoreState.g * 0.3;
  };

  const weighted = getWeightedScore();

  return (
    <div className="score-card" id="score-card">
      <div className="score-head">
        <h3>Org ESG score</h3>
        <span className="live-pill">
          <i></i>Live Rollup
        </span>
      </div>
      <div className="score-big" id="org-score">
        {weighted.toFixed(1)}
      </div>
      <p className="score-sub">Weighted rollup · E×0.4 + S×0.3 + G×0.3</p>
      <div className="bars">
        <div className="bar-row">
          <span>Environment</span>
          <div className="track">
            <div className="fill" style={{ width: `${scoreState.e}%` }}></div>
          </div>
          <b id="val-e">{Math.round(scoreState.e)}</b>
        </div>
        <div className="bar-row">
          <span>Social</span>
          <div className="track">
            <div
              className="fill social"
              style={{ width: `${scoreState.s}%` }}
            ></div>
          </div>
          <b id="val-s">{Math.round(scoreState.s)}</b>
        </div>
        <div className="bar-row">
          <span>Governance</span>
          <div className="track">
            <div className="fill gov" style={{ width: `${scoreState.g}%` }}></div>
          </div>
          <b id="val-g">{Math.round(scoreState.g)}</b>
        </div>
      </div>
    </div>
  );
};
