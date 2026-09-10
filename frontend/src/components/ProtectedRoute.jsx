//prevent unauthorized access and redirect users to login if their session expires:
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'officer') return <Navigate to="/officer/dashboard" replace />;
    if (user.role === 'admin' || user.role === 'superadmin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/citizen/dashboard" replace />;
  }

  return <Outlet />;
}
