import React, { useState, useEffect } from "react";
import * as api from "../services/api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingRead, setMarkingRead] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await api.getMyNotifications();
        setNotifications(data);
      } catch (err) {
        setError(err.message || "Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkRead = async (notificationId) => {
    setMarkingRead(notificationId);
    try {
      const updatedNotification = await api.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? updatedNotification : n))
      );
    } catch (err) {
      alert("Failed to mark notification as read: " + err.message);
    } finally {
      setMarkingRead(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Notifications</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600 text-lg">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  notification.is_read
                    ? "bg-white border-gray-200"
                    : "bg-blue-50 border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {!notification.is_read && (
                      <div className="inline-block mb-2">
                        <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                          NEW
                        </span>
                      </div>
                    )}
                    <p
                      className={`text-lg ${
                        notification.is_read
                          ? "text-gray-700"
                          : "text-gray-800 font-semibold"
                      }`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>

                    {notification.related_match_id && (
                      <p className="text-sm text-gray-600 mt-2">
                        Match ID: {notification.related_match_id}
                      </p>
                    )}
                  </div>

                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkRead(notification.id)}
                      disabled={markingRead === notification.id}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg whitespace-nowrap flex-shrink-0"
                    >
                      {markingRead === notification.id ? "..." : "Mark Read"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
