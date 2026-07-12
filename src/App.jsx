import React, { useState, useEffect } from "react";
import { LandingPage } from "./components/LandingPage";
import { CEODashboard } from "./components/CEODashboard";
import { AuditorDashboard } from "./components/AuditorDashboard";
import { ManagerDashboard } from "./components/ManagerDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { logoutUser } from "./api/api";

function App() {
  const [currentView, setCurrentView] = useState("landing");
  const [userRole, setUserRole] = useState(null);

  // Global score states shared down to landing/cards
  const [scoreState, setScoreState] = useState({
    e: 68,
    s: 76,
    g: 74,
  });

  // Check for existing auth session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("ecosphere_user");
    const storedToken = localStorage.getItem("ecosphere_token");
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        setUserRole(user.role || null);
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem("ecosphere_user");
        localStorage.removeItem("ecosphere_token");
      }
    }
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUserRole(null);
    setCurrentView("landing");
  };

  return (
    <>
      <div className="atmosphere" aria-hidden="true"></div>

      {currentView === "landing" && (
        <LandingPage
          scoreState={scoreState}
          setScoreState={setScoreState}
          setUserRole={setUserRole}
          onViewChange={setCurrentView}
        />
      )}

      {currentView === "ceo" && (
        <CEODashboard 
          onViewChange={setCurrentView}
          onLogout={handleLogout}
        />
      )}

      {currentView === "auditor" && (
        <AuditorDashboard 
          onViewChange={setCurrentView}
          onLogout={handleLogout}
        />
      )}

      {currentView === "manager" && (
        <ManagerDashboard 
          onViewChange={setCurrentView}
          onLogout={handleLogout}
        />
      )}

      {currentView === "admin" && (
        <AdminDashboard 
          onViewChange={setCurrentView}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

export default App;
