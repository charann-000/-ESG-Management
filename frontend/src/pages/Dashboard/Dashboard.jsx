import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Loader from '../../components/Loader';
import './Dashboard.css';

function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="loader-fullpage">
        <div className="loader-fullpage__content">
          <Loader size="large" color="green" />
          <span className="loader-fullpage__brand">EcoSphere</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <div className="dashboard__logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#d-grad)" opacity="0.9" />
              <path d="M2 17l10 5 10-5" stroke="url(#d-grad)" strokeWidth="1.5" fill="none" />
              <path d="M2 12l10 5 10-5" stroke="url(#d-grad)" strokeWidth="1.5" fill="none" />
              <defs>
                <linearGradient id="d-grad" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#34d399" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="dashboard__title">EcoSphere</h1>
        </div>

        <div className="dashboard__user">
          <div className="dashboard__user-info">
            <span className="dashboard__user-name">{user?.name || 'User'}</span>
            <span className="dashboard__user-role">{user?.role || 'Unknown'}</span>
          </div>
          <button className="dashboard__logout-btn" onClick={handleLogout} id="logout-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard__main">
        <div className="dashboard__welcome">
          <div className="dashboard__welcome-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#w-grad)" />
              <defs>
                <linearGradient id="w-grad" x1="4" y1="2" x2="20" y2="22">
                  <stop stopColor="#34d399" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="dashboard__welcome-title">Welcome, {user?.name?.split(' ')[0] || 'User'}!</h2>
          <p className="dashboard__welcome-subtitle">
            You are logged in as <strong>{user?.role}</strong>. Your ESG dashboard modules will appear here.
          </p>
          <div className="dashboard__modules-grid">
            {['Departments', 'Users', 'Operations', 'Analytics', 'Reports', 'Notifications', 'CSR', 'Rewards'].map((module) => (
              <div key={module} className="dashboard__module-card">
                <span className="dashboard__module-name">{module}</span>
                <span className="dashboard__module-status">Coming Soon</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
