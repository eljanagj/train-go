import { useAuth0 } from '@auth0/auth0-react';

export const useUserRoles = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  const getUserRoles = () => {
    if (!isAuthenticated || !user) return [];
    return user['https://lab1.com/roles'] || [];
  };

  const hasRole = (role) => {
    const roles = getUserRoles();
    return roles.includes(role);
  };

  const isAdmin = () => hasRole('Admin');
  const isUser = () => hasRole('User');

  return {
    getUserRoles,
    hasRole,
    isAdmin,
    isUser,
    isLoading,
    isAuthenticated,
    user
  };
}; 