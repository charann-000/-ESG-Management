import EarthGlobe from './EarthGlobe';
import '../pages/Login/Login.css'; // Share the layout and responsiveness styling

function AuthLayout({ children }) {
  return (
    <div className="login-page">
      {/* Background layers */}
      <div className="atmosphere" aria-hidden="true"></div>
      <div className="ambient-glow" aria-hidden="true"></div>

      {/* Three.js Earth — UNTOUCHED */}
      <EarthGlobe />

      {/* UI Overlay */}
      <div className="ui-layer">
        <div className="login-section-container">
          {children}
        </div>

        {/* Single Premium ESG Analytics Card */}
        <div className="esg-analytics-card" aria-hidden="true">
          <div className="esg-analytics-card__header">
            <span className="esg-analytics-card__title">Organization ESG Score</span>
            <span className="esg-analytics-card__badge">
              <span className="esg-analytics-card__pulse"></span>
              LIVE
            </span>
          </div>

          <div className="esg-analytics-card__score-section">
            <span className="esg-analytics-card__score">84.6</span>
            <div className="esg-analytics-card__breakdown">
              <span className="esg-analytics-card__weight-label">Weighted</span>
              <span className="esg-analytics-card__weight-values">E 40% · S 30% · G 30%</span>
            </div>
          </div>

          <div className="esg-analytics-card__progress-group">
            <div className="esg-analytics-card__progress-row">
              <div className="esg-analytics-card__progress-info">
                <span className="esg-analytics-card__progress-label">Environment</span>
                <span className="esg-analytics-card__progress-val">88</span>
              </div>
              <div className="esg-analytics-card__progress-bar-bg">
                <div className="esg-analytics-card__progress-bar-fill" style={{ '--target-width': '88%', width: '88%' }}></div>
              </div>
            </div>

            <div className="esg-analytics-card__progress-row">
              <div className="esg-analytics-card__progress-info">
                <span className="esg-analytics-card__progress-label">Social</span>
                <span className="esg-analytics-card__progress-val">82</span>
              </div>
              <div className="esg-analytics-card__progress-bar-bg">
                <div className="esg-analytics-card__progress-bar-fill" style={{ '--target-width': '82%', width: '82%' }}></div>
              </div>
            </div>

            <div className="esg-analytics-card__progress-row">
              <div className="esg-analytics-card__progress-info">
                <span className="esg-analytics-card__progress-label">Governance</span>
                <span className="esg-analytics-card__progress-val">84</span>
              </div>
              <div className="esg-analytics-card__progress-bar-bg">
                <div className="esg-analytics-card__progress-bar-fill" style={{ '--target-width': '84%', width: '84%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
