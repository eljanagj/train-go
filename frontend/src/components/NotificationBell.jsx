import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth0 } from '@auth0/auth0-react';
import { FaBell } from 'react-icons/fa';
import { useClickOutside } from '../hooks/useClickOutside';
import { useUserRoles } from '../hooks/useUserRoles';

export function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef(null);
  const { user, isAuthenticated } = useAuth0();
  const { isAdmin } = useUserRoles();
  const isAdminUser = isAdmin();

  useClickOutside(dropdownRef, () => {
    setIsOpen(false);
  });

  const fetchNotifications = async () => {
    if (!isAuthenticated || !user?.sub) {
      console.log('User not authenticated, skipping fetch');
      return;
    }

    try {
      console.log('Fetching notifications...', { isAdminUser, userId: user.sub });
      setIsLoading(true);
      let data;
      if (isAdminUser) {
        console.log('Fetching admin notifications');
        data = await notificationService.getAdminNotifications();
      } else {
        console.log('Fetching user notifications');
        data = await notificationService.getNotifications();
      }
      console.log('Fetched notifications:', data);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      console.log('Fetching initial notifications for user:', user.sub);
      fetchNotifications();
    }
  }, [isAuthenticated, user?.sub, isAdminUser]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      console.log('Marking notification as read:', notificationId);
      await notificationService.markAsRead(notificationId, user.sub);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, readBy: [...n.readBy, user.sub] }
            : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log('Marking all notifications as read');
      await notificationService.markAllAsRead(user.sub);
      await fetchNotifications(); // Refresh the notifications after marking all as read
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (!isAuthenticated) return null;

  const unreadCount = notifications.filter(n => !n.readBy.includes(user.sub)).length;
  console.log('Current unread count:', unreadCount);

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        className="btn position-relative"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          color: '#64748b',
          padding: '0.5rem',
          borderRadius: '6px',
          transition: 'all 0.15s ease',
          border: 'none',
          background: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.target.style.color = '#3b82f6';
          e.target.style.backgroundColor = '#f1f5f9';
        }}
        onMouseLeave={(e) => {
          e.target.style.color = '#64748b';
          e.target.style.backgroundColor = 'transparent';
        }}
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{
              fontSize: '0.75rem',
              transform: 'translate(-50%, -50%)'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="position-absolute end-0 mt-2"
          style={{
            width: '300px',
            maxHeight: '400px',
            overflowY: 'auto',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 1000
          }}
        >
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Notifications</h6>
            {unreadCount > 0 && (
              <button
                className="btn btn-sm btn-link text-primary"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="p-0">
            {isLoading ? (
              <div className="p-3 text-center">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-3 text-center text-muted">
                No notifications
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 border-bottom ${
                    !notification.readBy.includes(user.sub) ? 'bg-light' : ''
                  }`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="mb-1">{notification.message}</p>
                      <small className="text-muted">
                        {new Date(notification.createdAt).toLocaleString()}
                      </small>
                    </div>
                    {!notification.readBy.includes(user.sub) && (
                      <span className="badge bg-primary">New</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 