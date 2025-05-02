// This component is in no use for the moment, but it is a good example to make it generic in the future
// and use it in the future for other routes that need authentication
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth0();
  console.log('🔒 ProtectedRoute', { isLoading, isAuthenticated });

  if (isLoading) return <div>Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}
