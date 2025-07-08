import apiClient from './apiClient';

export const getNotifications = (userId) => {
  return apiClient.get(`/users/${userId}/notifications`);
};

export const markNotificationAsRead = (notificationId) => {
  return apiClient.put(`/notifications/${notificationId}`);
};

