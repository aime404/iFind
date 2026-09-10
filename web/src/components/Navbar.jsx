import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  Plus,
  LayoutGrid,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  Package,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as api from "../services/api";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      api
        .getMyNotifications()
        .then((notifications) => {
          const unread = notifications.filter((n) => !n.is_read).length;
          setUnreadCount(unread);
        })
        .catch(console.error);
    }
  }, [isAuthenticated]);

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
      isActive(path)
        ? "text-blue-600 bg-blue-50 border-l-4 border-blue-600"
        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
    }`;

  return (
    <nav className="bg-white shadow-lg border-b-2 border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-2 group">
            <Package size={28} className="text-blue-600 group-hover:scale-110 transition-transform" />
            <Link
              to="/browse"
              className="text-3xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              iFind
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 flex-wrap">
            <Link to="/browse" className={navLinkClass("/browse")}>
              Browse
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/create-report"
                  className={navLinkClass("/create-report")}
                >
                  <Plus size={18} />
                  Report Item
                </Link>

                <Link to="/matches" className={navLinkClass("/matches")}>
                  <LayoutGrid size={18} />
                  My Matches
                </Link>

                <Link
                  to="/notifications"
                  className={`${navLinkClass("/notifications")} relative`}
                >
                  <Bell size={18} />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {user?.is_admin && (
                  <Link to="/admin" className={navLinkClass("/admin")}>
                    <Shield size={18} />
                    Admin
                  </Link>
                )}
              </>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    {user?.full_name}
                  </p>
                  {user?.is_admin && (
                    <p className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                      <Shield size={12} /> Admin
                    </p>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg font-medium transition-all hover:shadow-md flex items-center gap-1"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-1 transition-all"
                >
                  <LogIn size={18} />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-1 transition-all hover:shadow-md"
                >
                  <UserPlus size={18} />
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
