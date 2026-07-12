import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getDashboardPath } from '../../context/AuthContext';
import './Unauthorized.css';

function Unauthorized() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const handleGoBack = () => {
    if (isAuthenticated && role) {
      navigate(getDashboardPath(role), { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="unauthorized-page">
      <div className="unauthorized-card">
        <div className="unauthorized-card__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <h1 className="unauthorized-card__title">Access Denied</h1>
        <p className="unauthorized-card__text">
          You do not have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <button className="login-card__submit" onClick={handleGoBack} id="go-back-btn">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export default Unauthorized;
