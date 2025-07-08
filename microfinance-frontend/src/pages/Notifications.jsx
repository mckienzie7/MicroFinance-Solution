import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markNotificationAsRead } from '../services/notificationService';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      getNotifications(user.id)
        .then((response) => {
          setNotifications(response.data);
        })
        .catch((error) => {
          console.error('Error fetching notifications:', error);
        });
    }
  }, [user]);

  const handleMarkAsRead = (notificationId) => {
    markNotificationAsRead(notificationId)
      .then(() => {
        setNotifications(
          notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );
      })
      .catch((error) => {
        console.error('Error marking notification as read:', error);
      });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Notifications</h1>
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg ${notification.is_read ? 'bg-gray-200' : 'bg-blue-100'}`}>
            <p className="text-lg">{notification.message}</p>
            {!notification.is_read && (
              <button
                onClick={() => handleMarkAsRead(notification.id)}
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                Mark as read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
