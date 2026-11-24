import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import CitizenDashboard from './views/Citizen/CitizenDashboard';
import OfficerDashboard from './views/Officer/OfficerDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Citizen Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['citizen']} />}>
          <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
        </Route>

        {/* Officer Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['officer', 'admin']} />}>
          <Route path="/officer/dashboard" element={<OfficerDashboard />} />
        </Route>

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}