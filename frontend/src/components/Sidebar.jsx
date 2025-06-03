import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTrain, FaRoute, FaClock, FaCalendar, FaCreditCard, FaTicketAlt } from 'react-icons/fa';
import { NotificationBell } from './NotificationBell';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>TrainGo Admin</h2>
        <NotificationBell />
      </div>
      <nav className="sidebar-nav">
        <Link
          to="/admin/trains"
          className={`sidebar-link ${isActive('/trains') ? 'active' : ''}`}
        >
          <FaTrain />
          Train Management
        </Link>
        <Link
          to="/admin/routes"
          className={`sidebar-link ${isActive('/admin/routes') ? 'active' : ''}`}
        >
          <FaRoute />
          Route Management
        </Link>
        <Link
          to="/admin/schedules"
          className={`sidebar-link ${isActive('/admin/schedules') ? 'active' : ''}`}
        >
          <FaClock />
          Schedule Management
        </Link>
        <Link
          to="/admin/reservations"
          className={`sidebar-link ${isActive('/admin/reservations') ? 'active' : ''}`}
        >
          <FaCalendar />
          Reservation Management
        </Link>
        <Link
          to="/admin/payments"
          className={`sidebar-link ${isActive('/admin/payments') ? 'active' : ''}`}
        >
          <FaCreditCard />
          Payment Management
        </Link>
        <Link
          to="/admin/tickets"
          className={`sidebar-link ${isActive('/admin/tickets') ? 'active' : ''}`}
        >
          <FaTicketAlt />
          Ticket Management
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;