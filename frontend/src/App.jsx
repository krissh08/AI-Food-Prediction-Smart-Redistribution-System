import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { ProtectionGuard } from "./components/ProtectionGuard";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterDonorPage } from "./pages/RegisterDonorPage";
import { RegisterAcceptorPage } from "./pages/RegisterAcceptorPage";

import { DonorDashboard } from "./pages/DonorDashboard";
import { DonorPredictionPage } from "./pages/DonorPredictionPage";
import { DonorFoodPage } from "./pages/DonorFoodPage";
import { DonorRequestsPage } from "./pages/DonorRequestsPage";
import { DonorPickupsPage } from "./pages/DonorPickupsPage";
import { DonorAnalyticsPage } from "./pages/DonorAnalyticsPage";

import { AcceptorDashboard } from "./pages/AcceptorDashboard";
import { AcceptorAvailableFoodPage } from "./pages/AcceptorAvailableFoodPage";
import { AcceptorRequestsPage } from "./pages/AcceptorRequestsPage";
import { AcceptorPickupsPage } from "./pages/AcceptorPickupsPage";
import { AcceptorAnalyticsPage } from "./pages/AcceptorAnalyticsPage";

import { AdminDashboard } from "./pages/AdminDashboard";
import { UserProfilePage } from "./pages/UserProfilePage";

const MainContent = () => {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || "/");

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const renderRoute = () => {
    switch (currentPath) {
      // Public Routes
      case "/":
        return <LandingPage onNavigate={navigate} />;
      case "/login":
        return <LoginPage onNavigate={navigate} />;
      case "/register/donor":
        return <RegisterDonorPage onNavigate={navigate} />;
      case "/register/acceptor":
        return <RegisterAcceptorPage onNavigate={navigate} />;

      // Donor Protected Routes
      case "/donor/dashboard":
        return (
          <ProtectionGuard allowedRoles={["donor"]} onNavigate={navigate}>
            <DonorDashboard onNavigate={navigate} />
          </ProtectionGuard>
        );
      case "/donor/predictions":
        return (
          <ProtectionGuard allowedRoles={["donor"]} onNavigate={navigate}>
            <DonorPredictionPage />
          </ProtectionGuard>
        );
      case "/donor/food":
        return (
          <ProtectionGuard allowedRoles={["donor"]} onNavigate={navigate}>
            <DonorFoodPage />
          </ProtectionGuard>
        );
      case "/donor/donations":
        return (
          <ProtectionGuard allowedRoles={["donor"]} onNavigate={navigate}>
            <DonorRequestsPage />
          </ProtectionGuard>
        );
      case "/donor/pickups":
        return (
          <ProtectionGuard allowedRoles={["donor"]} onNavigate={navigate}>
            <DonorPickupsPage />
          </ProtectionGuard>
        );
      case "/donor/analytics":
        return (
          <ProtectionGuard allowedRoles={["donor", "admin"]} onNavigate={navigate}>
            <DonorAnalyticsPage />
          </ProtectionGuard>
        );
      case "/donor/profile":
        return (
          <ProtectionGuard allowedRoles={["donor"]} onNavigate={navigate}>
            <UserProfilePage />
          </ProtectionGuard>
        );

      // Acceptor Protected Routes
      case "/acceptor/dashboard":
        return (
          <ProtectionGuard allowedRoles={["acceptor"]} onNavigate={navigate}>
            <AcceptorDashboard onNavigate={navigate} />
          </ProtectionGuard>
        );
      case "/acceptor/available-food":
        return (
          <ProtectionGuard allowedRoles={["acceptor"]} onNavigate={navigate}>
            <AcceptorAvailableFoodPage />
          </ProtectionGuard>
        );
      case "/acceptor/requests":
        return (
          <ProtectionGuard allowedRoles={["acceptor"]} onNavigate={navigate}>
            <AcceptorRequestsPage />
          </ProtectionGuard>
        );
      case "/acceptor/pickups":
        return (
          <ProtectionGuard allowedRoles={["acceptor"]} onNavigate={navigate}>
            <AcceptorPickupsPage />
          </ProtectionGuard>
        );
      case "/acceptor/analytics":
        return (
          <ProtectionGuard allowedRoles={["acceptor", "admin"]} onNavigate={navigate}>
            <AcceptorAnalyticsPage />
          </ProtectionGuard>
        );
      case "/acceptor/profile":
        return (
          <ProtectionGuard allowedRoles={["acceptor"]} onNavigate={navigate}>
            <UserProfilePage />
          </ProtectionGuard>
        );

      // Admin Protected Routes
      case "/admin/dashboard":
        return (
          <ProtectionGuard allowedRoles={["admin"]} onNavigate={navigate}>
            <AdminDashboard />
          </ProtectionGuard>
        );

      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  const isPublicPage = ["/", "/login", "/register/donor", "/register/acceptor"].includes(currentPath);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar onNavigate={navigate} activePage={currentPath} />

      {isPublicPage || !user ? (
        <main className="flex-1">{renderRoute()}</main>
      ) : (
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar activePath={currentPath} onNavigate={navigate} />
          <main className="flex-1 p-6 sm:p-8 overflow-y-auto">{renderRoute()}</main>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
