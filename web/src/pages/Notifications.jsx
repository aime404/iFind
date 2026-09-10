import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertCircle } from "lucide-react";
import * as api from "../services/api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingRead, setMarkingRead] = useState(null);
  const navigate = useNavigate();

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

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      setMarkingRead(notification.id);
      try {
        const updatedNotification = await api.markNotificationRead(
          notification.id
        );
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? updatedNotification : n
          )
        );
      } catch (err) {
        console.error("Failed to mark as read:", err);
      } finally {
        setMarkingRead(null);
      }
    }

    // Navigate to matches page
    navigate("/matches");
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
        <div className="mb-8 flex items-center gap-3">
          <Bell size={32} className="text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-800">Notifications</h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <Bell size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg">No notifications yet</p>
            <p className="text-gray-500 text-sm mt-2">
              You'll see notifications here when matches are found for your reports
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                disabled={markingRead === notification.id}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md active:scale-95 ${
                  notification.is_read
                    ? "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    : "bg-blue-50 border-blue-300 hover:border-blue-400 hover:bg-blue-100 cursor-pointer"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {!notification.is_read && (
                      <div className="inline-block mb-2">
                        <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <Bell size={12} /> NEW
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
                      <p className="text-xs text-gray-600 mt-2 font-mono bg-gray-100 inline-block px-2 py-1 rounded">
                        Match #{notification.related_match_id}
                      </p>
                    )}
                  </div>

                  {!notification.is_read && (
                    <div className="text-blue-600 font-semibold text-sm whitespace-nowrap flex-shrink-0">
                      {markingRead === notification.id ? "..." : "View"}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
