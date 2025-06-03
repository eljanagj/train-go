import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import { NotificationBell } from './NotificationBell';
import '../styles/AdminNavBar.css';

export const AdminNavBar = () => {
  const { logout, user } = useAuth0();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout({ returnTo: window.location.origin });
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-brand">
        <Link to="/admin/dashboard">Train Admin</Link>
      </div>
      
      <div className="admin-navbar-right">
        <NotificationBell />
        <div className="admin-user-menu">
          <div className="admin-user-info">
            <FaUser className="admin-user-icon" />
            <span className="admin-user-name">{user?.name || 'Admin'}</span>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}; 