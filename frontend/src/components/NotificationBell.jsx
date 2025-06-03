import React, { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import { webSocketService } from '../services/WebSocketService';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { setAccessToken } from '../services/auth';
import '../styles/NotificationBell.css';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    let mounted = true;

    const setupWebSocket = async () => {
      if (isAuthenticated && mounted) {
        try {
          const token = await getAccessTokenSilently();
          setAccessToken(token);
          webSocketService.connect();
          
          // Get initial notifications after connection
          webSocketService.getNotifications();
        } catch (error) {
          console.error('Error getting access token:', error);
        }
      }
    };

    setupWebSocket();

    // Set up event listeners
    webSocketService.on('notification', handleNewNotification);
    webSocketService.on('notifications', handleNotifications);
    webSocketService.on('notificationRead', handleNotificationRead);
    webSocketService.on('allNotificationsRead', handleAllNotificationsRead);

    // Cleanup on unmount
    return () => {
      mounted = false;
      webSocketService.off('notification', handleNewNotification);
      webSocketService.off('notifications', handleNotifications);
      webSocketService.off('notificationRead', handleNotificationRead);
      webSocketService.off('allNotificationsRead', handleAllNotificationsRead);
      webSocketService.disconnect();
    };
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewNotification = (notification) => {
    console.log('New notification received:', notification);
    setNotifications(prev => [notification, ...prev]);
  };

  const handleNotifications = (newNotifications) => {
    console.log('Initial notifications received:', newNotifications);
    setNotifications(newNotifications);
  };

  const handleNotificationRead = (notification) => {
    console.log('Notification marked as read:', notification);
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  };

  const handleAllNotificationsRead = () => {
    console.log('All notifications marked as read');
    setNotifications([]);
  };

  const handleMarkAsRead = (notificationId) => {
    console.log('Marking notification as read:', notificationId);
    webSocketService.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    console.log('Marking all notifications as read');
    webSocketService.markAllAsRead();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    setIsOpen(false);
    
    // Navigate based on notification type and user role
    if (isAdmin) {
      if (notification.type === 'reservation') {
        navigate(`/admin/reservations/${notification.data?.reservationId}`);
      } else if (notification.type === 'payment') {
        navigate(`/admin/payments/${notification.data?.reservationId}`);
      } else if (notification.type === 'system') {
        navigate('/admin/dashboard');
      }
    } else {
      if (notification.type === 'reservation') {
        navigate(`/reservations/${notification.data?.reservationId}`);
      } else if (notification.type === 'payment') {
        navigate(`/payment/${notification.data?.reservationId}`);
      }
    }
  };

  // Filter notifications based on user role and read status
  const filteredNotifications = notifications.filter(notification => {
    if (isAdmin) {
      return !notification.isRead; // Admins see all unread notifications
    }
    return !notification.isRead && notification.type !== 'system'; // Regular users don't see system notifications
  });

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <div className="bell-icon" onClick={() => setIsOpen(!isOpen)}>
        <FaBell />
        {filteredNotifications.length > 0 && (
          <span className="notification-badge">{filteredNotifications.length}</span>
        )}
      </div>
      
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {filteredNotifications.length > 0 && (
              <button onClick={handleMarkAllAsRead} className="mark-all-read">
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {filteredNotifications.length === 0 ? (
              <div className="no-notifications">No notifications</div>
            ) : (
              filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.type === 'system' ? 'system' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 