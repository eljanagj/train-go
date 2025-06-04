// This component is in no use for the moment, but it is a good example to make it generic in the future
// and use it in the future for other routes that need authentication
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { PageLoader } from './PageLoader';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const location = useLocation();
  console.log('🔒 ProtectedRoute', { isLoading, isAuthenticated });

  if (isLoading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    loginWithRedirect({
      appState: {
        returnTo: location.pathname + location.search
      }
    });
    return <PageLoader />;
  }
  
  return children;
}

export function AdminRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth0();

  console.log('AdminRoute:', { isLoading, isAuthenticated, userExists: !!user });

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const userRoles = user?.['https://lab1.com/roles'] || [];
  const isAdmin = userRoles.includes('Admin');

  console.log('AdminRoute roles:', { userRoles, isAdmin });

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
