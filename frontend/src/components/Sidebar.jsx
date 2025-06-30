import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaTrain,
  FaMapMarkerAlt,
  FaRoute,
  FaClock,
  FaCalendar,
  FaCreditCard,
  FaTicketAlt,
  FaTools,
  FaBars,
  FaTimes,
  FaHome,
  FaStar,
  FaPercent,
  FaBan,
  FaQuestionCircle,
  FaFileAlt,
  FaUsers,
} from "react-icons/fa";
import "../styles/Sidebar.css";
import { useUserRoles } from "../hooks/useUserRoles";

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isAdmin, isLoading } = useUserRoles();

  const isActive = (path) => {
    return location.pathname === path;
  };

  if (isLoading) return <div className="sidebar-loading">Loading...</div>;

  if (!isAdmin()) {
    return <div className="sidebar-error">Access Denied</div>;
  }

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">
          {!isCollapsed && (
            <>
              <h2>TrainGo Admin</h2>
              <Link to="/" className="back-to-main">
                <FaHome /> Back to Main App
              </Link>
            </>
          )}
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <FaBars /> : <FaTimes />}
        </button>
      </div>
      <nav className="sidebar-nav">
        <Link
          to="/admin/trains"
          className={`sidebar-link ${
            isActive("/admin/trains") ? "active" : ""
          }`}
          title="Train Management"
        >
          <FaTrain />
          {!isCollapsed && <span>Train Management</span>}
        </Link>
        <Link
          to="/admin/stations"
          className={`sidebar-link ${
            isActive("/admin/stations") ? "active" : ""
          }`}
          title="Station Management"
        >
          <FaMapMarkerAlt />
          {!isCollapsed && <span>Station Management</span>}
        </Link>
        <Link
          to="/admin/routes"
          className={`sidebar-link ${
            isActive("/admin/routes") ? "active" : ""
          }`}
          title="Route Management"
        >
          <FaRoute />
          {!isCollapsed && <span>Route Management</span>}
        </Link>
        <Link
          to="/admin/schedules"
          className={`sidebar-link ${
            isActive("/admin/schedules") ? "active" : ""
          }`}
          title="Schedule Management"
        >
          <FaClock />
          {!isCollapsed && <span>Schedule Management</span>}
        </Link>
        <Link
          to="/admin/reservations"
          className={`sidebar-link ${
            isActive("/admin/reservations") ? "active" : ""
          }`}
          title="Reservation Management"
        >
          <FaCalendar />
          {!isCollapsed && <span>Reservation Management</span>}
        </Link>
        <Link
          to="/admin/payments"
          className={`sidebar-link ${
            isActive("/admin/payments") ? "active" : ""
          }`}
          title="Payment Management"
        >
          <FaCreditCard />
          {!isCollapsed && <span>Payment Management</span>}
        </Link>
        <Link
          to="/admin/tickets"
          className={`sidebar-link ${
            isActive("/admin/tickets") ? "active" : ""
          }`}
          title="Ticket Management"
        >
          <FaTicketAlt />
          {!isCollapsed && <span>Ticket Management</span>}
        </Link>
        <Link
          to="/admin/users"
          className={`sidebar-link ${isActive("/admin/users") ? "active" : ""}`}
          title="User Management"
        >
          <FaUsers />
          {!isCollapsed && <span>User Management</span>}
        </Link>
        <Link
          to="/admin/reviews"
          className={`sidebar-link ${
            isActive("/admin/reviews") ? "active" : ""
          }`}
          title="Review Management"
        >
          <FaStar />
          {!isCollapsed && <span>Review Management</span>}
        </Link>
        <Link
          to="/admin/maintenance"
          className={`sidebar-link ${
            isActive("/admin/maintenance") ? "active" : ""
          }`}
          title="Maintenance Management"
        >
          <FaTools />
          {!isCollapsed && <span>Maintenance Management</span>}
        </Link>
        <Link
          to="/admin/discount-codes"
          className={`sidebar-link ${
            isActive("/admin/discount-codes") ? "active" : ""
          }`}
          title="Discount Code Management"
        >
          <FaPercent />
          {!isCollapsed && <span>Discount Code Management</span>}
        </Link>
        <Link
          to="/admin/cancellations"
          className={`sidebar-link ${
            isActive("/admin/cancellations") ? "active" : ""
          }`}
          title="Cancellation Management"
        >
          <FaBan />
          {!isCollapsed && <span>Cancellation Management</span>}
        </Link>
        <Link
          to="/admin/faqs"
          className={`sidebar-link ${isActive("/admin/faqs") ? "active" : ""}`}
          title="FAQ Management"
        >
          <FaQuestionCircle />
          {!isCollapsed && <span>FAQ Management</span>}
        </Link>
        <Link
          to="/admin/terms-conditions"
          className={`sidebar-link ${
            isActive("/admin/terms-conditions") ? "active" : ""
          }`}
          title="Terms & Conditions Management"
        >
          <FaFileAlt />
          {!isCollapsed && <span>Terms & Conditions</span>}
        </Link>
      </nav>

      {isCollapsed && (
        <div className="sidebar-bottom">
          <Link
            to="/"
            className="back-to-main-collapsed"
            title="Back to Main App"
          >
            <FaHome />
          </Link>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
