import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import useAuth from './hooks/useAuth';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login/Login';
import ChangePassword from './pages/ChangePassword/ChangePassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Unauthorized from './pages/Unauthorized/Unauthorized';

import { LandingPage } from './components/LandingPage';
import { CEODashboard } from './components/CEODashboard';
import { AuditorDashboard } from './components/AuditorDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { AdminDashboard } from './components/AdminDashboard';

import './App.css';

const CEODashboardRoute = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  return <CEODashboard onViewChange={(view) => navigate(view === 'landing' ? '/' : `/${view === 'admin' ? 'admin/demo-dashboard' : `${view}/dashboard`}`)} onLogout={handleLogout} />;
};

const AuditorDashboardRoute = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  return <AuditorDashboard onViewChange={(view) => navigate(view === 'landing' ? '/' : `/${view === 'admin' ? 'admin/demo-dashboard' : `${view}/dashboard`}`)} onLogout={handleLogout} />;
};

const ManagerDashboardRoute = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  return <ManagerDashboard onViewChange={(view) => navigate(view === 'landing' ? '/' : `/${view === 'admin' ? 'admin/demo-dashboard' : `${view}/dashboard`}`)} onLogout={handleLogout} />;
};

const AdminDashboardRoute = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  return <AdminDashboard onViewChange={(view) => navigate(view === 'landing' ? '/' : `/${view === 'admin' ? 'admin/demo-dashboard' : `${view}/dashboard`}`)} onLogout={handleLogout} />;
};

function AppContent() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      {/* Protected: Change Password */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* Protected: Role-based Live Dashboards */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected: Legacy / Demo Dashboards */}
      <Route
        path="/admin/demo-dashboard"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboardRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ceo/dashboard"
        element={
          <ProtectedRoute allowedRoles={['CEO']}>
            <CEODashboardRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Department Manager']}>
            <ManagerDashboardRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Employee']}>
            <Navigate to="/" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Auditor']}>
            <AuditorDashboardRoute />
          </ProtectedRoute>
        }
      />

      {/* Unauthorized */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Catch-all: Redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />

        {/* Global Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover={false}
          theme="dark"
          toastStyle={{
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.85rem',
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
