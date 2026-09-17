import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Citizen Pages
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { SubmitGrievance } from './pages/citizen/SubmitGrievance';
import { MyGrievances } from './pages/citizen/MyGrievances';
import { GrievanceDetails } from './pages/citizen/GrievanceDetails';
import { NotificationsPage } from './pages/citizen/NotificationsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminGrievanceList } from './pages/admin/AdminGrievanceList';
import { AdminGrievanceDetail } from './pages/admin/AdminGrievanceDetail';
import { DuplicateManager } from './pages/admin/DuplicateManager';
import { DepartmentsOfficers } from './pages/admin/DepartmentsOfficers';
import { ReportsExport } from './pages/admin/ReportsExport';

// Officer Pages
import { OfficerDashboard } from './pages/officer/OfficerDashboard';
import { OfficerGrievanceDetail } from './pages/officer/OfficerGrievanceDetail';
import { OfficerHistory } from './pages/officer/OfficerHistory';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-500">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on actual role
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'officer') return <Navigate to="/officer/dashboard" replace />;
    return <Navigate to="/citizen/dashboard" replace />;
  }

  return children;
};

// Portal Layout (with Navbar & Sidebar)
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Citizen Routes */}
          <Route
            path="/citizen/*"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                <AppLayout>
                  <Routes>
                    <Route path="dashboard" element={<CitizenDashboard />} />
                    <Route path="submit" element={<SubmitGrievance />} />
                    <Route path="grievances" element={<MyGrievances />} />
                    <Route path="grievances/:id" element={<GrievanceDetails />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="grievances" element={<AdminGrievanceList />} />
                    <Route path="grievances/:id" element={<AdminGrievanceDetail />} />
                    <Route path="duplicates" element={<DuplicateManager />} />
                    <Route path="analytics" element={<AdminDashboard />} />
                    <Route path="departments" element={<DepartmentsOfficers />} />
                    <Route path="reports" element={<ReportsExport />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Officer Routes */}
          <Route
            path="/officer/*"
            element={
              <ProtectedRoute allowedRoles={['officer', 'admin']}>
                <AppLayout>
                  <Routes>
                    <Route path="dashboard" element={<OfficerDashboard />} />
                    <Route path="grievances/:id" element={<OfficerGrievanceDetail />} />
                    <Route path="history" element={<OfficerHistory />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
