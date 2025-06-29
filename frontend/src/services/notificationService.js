import api from './api';

export const notificationService = {
  async getNotifications() {
    console.log('Fetching user notifications via HTTP');
    const response = await api.get('/notifications');
    console.log('User notifications response:', response.data);
    return response.data;
  },

  async getAdminNotifications() {
    console.log('Fetching admin notifications via HTTP');
    const response = await api.get('/notifications/admin');
    console.log('Admin notifications response:', response.data);
    return response.data;
  },

  async markAsRead(notificationId, userId) {
    console.log('Marking notification as read:', { notificationId, userId });
    const response = await api.post(`/notifications/${notificationId}/read`, { userId });
    console.log('Mark as read response:', response.data);
    return response.data;
  },

  async markAllAsRead(userId) {
    console.log('Marking all notifications as read for user:', userId);
    const notifications = await this.getNotifications();
    const unreadNotifications = notifications.filter(n => !n.readBy.includes(userId));
    console.log('Unread notifications to mark:', unreadNotifications);
    
    // Use the existing markAsRead endpoint for each unread notification
    await Promise.all(
      unreadNotifications.map(notification => 
        this.markAsRead(notification.id, userId)
      )
    );
    
    return this.getNotifications();
  }
};