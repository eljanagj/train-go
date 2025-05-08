import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Train Go</h2>
      </div>
      <nav className="sidebar-nav">
        <Link 
          to="/trains" 
          className={`sidebar-link ${isActive('/trains') ? 'active' : ''}`}
        >
          Train Management
        </Link>
        <Link 
          to="/routes" 
          className={`sidebar-link ${isActive('/routes') ? 'active' : ''}`}
        >
          Route Management
        </Link>
        <Link 
          to="/schedules" 
          className={`sidebar-link ${isActive('/schedules') ? 'active' : ''}`}
        >
          Schedule Management
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar; 