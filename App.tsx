import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Import Pages
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import PlannerPage from './pages/PlannerPage';


const App: React.FC = () => {
  return (
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected Routes */}
        <Route path="/app/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/app/planner" element={
          <ProtectedRoute>
            <PlannerPage />
          </ProtectedRoute>
        } />
         <Route path="/app/planner/:eventId" element={
          <ProtectedRoute>
            <PlannerPage />
          </ProtectedRoute>
        } />

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after they
    // login, which is a nicer user experience.
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default App;