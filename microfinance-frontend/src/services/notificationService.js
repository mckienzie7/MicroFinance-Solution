import apiClient from './apiClient';

// Set up the authorization header for all notification requests
const getAuthHeaders = () => {
  const sessionId = localStorage.getItem('session_id');
  return sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {};
};

export const getNotifications = (limit = 50) => {
  return apiClient.get(`/api/v1/notifications?limit=${limit}`, {
    headers: getAuthHeaders()
  });
};

export const getUnreadCount = () => {
  return apiClient.get('/api/v1/notifications/unread-count', {
    headers: getAuthHeaders()
  });
};

export const markNotificationAsRead = (notificationId) => {
  return apiClient.post(`/api/v1/notifications/${notificationId}/mark-read`, {}, {
    headers: getAuthHeaders()
  });
};

export const markAllNotificationsAsRead = () => {
  return apiClient.post('/api/v1/notifications/mark-all-read', {}, {
    headers: getAuthHeaders()
  });
};

export const deleteNotification = (notificationId) => {
  return apiClient.delete(`/api/v1/notifications/${notificationId}`, {
    headers: getAuthHeaders()
  });
};

// Admin functions
export const getAllNotifications = (limit = 100, userId = null) => {
  const params = new URLSearchParams();
  params.append('limit', limit);
  if (userId) params.append('user_id', userId);
  
  return apiClient.get(`/api/v1/notifications/admin?${params.toString()}`, {
    headers: getAuthHeaders()
  });
};

export const createNotification = (userId, message) => {
  return apiClient.post('/api/v1/notifications', {
    user_id: userId,
    message: message
  }, {
    headers: getAuthHeaders()
  });
};

