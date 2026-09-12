import React, { useState, useEffect } from "react";
import { Trash2, Shield, AlertCircle, Package, Users, GitMerge, Clock } from "lucide-react";
import * as api from "../services/api";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("reports");
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "reports") {
        const data = await api.getAllReportsAdmin();
        setReports(data);
      } else if (activeTab === "users") {
        const data = await api.getAllUsersAdmin();
        setUsers(data);
      } else if (activeTab === "audit") {
        const data = await api.getAuditLogsAdmin();
        setAuditLogs(data);
      }
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id, itemName) => {
    if (!window.confirm(`Delete report "${itemName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(id);
    try {
      await api.deleteReportAdmin(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      fetchStats();
    } catch (err) {
      setError(err.message || "Failed to delete report");
    } finally {
      setDeleting(null);
    }
  };

  const tabs = [
    { id: "reports", label: "Reports" },
    { id: "users", label: "Users" },
    { id: "audit", label: "Audit Log" },
  ];

  const filteredReports = statusFilter
    ? reports.filter((r) => r.status === statusFilter)
    : reports;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage reports, users, and system activity</p>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse h-28" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Package size={20} className="text-blue-600" />
                </div>
                <p className="text-gray-600 text-sm font-medium">Total Reports</p>
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.total_reports}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.total_lost} lost &middot; {stats.total_found} found
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Clock size={20} className="text-yellow-600" />
                </div>
                <p className="text-gray-600 text-sm font-medium">Unresolved</p>
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {(stats.reports_by_status.submitted || 0) +
                  (stats.reports_by_status.under_review || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Awaiting a match or review</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-green-100 p-2 rounded-lg">
                  <GitMerge size={20} className="text-green-600" />
                </div>
                <p className="text-gray-600 text-sm font-medium">Matches</p>
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.total_matches}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.matches_by_status.verified || 0} verified &middot;{" "}
                {stats.matches_by_status.pending || 0} pending
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Users size={20} className="text-purple-600" />
                </div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.total_users}</p>
              <p className="text-xs text-gray-500 mt-1">Registered accounts</p>
            </div>
          </div>
        ) : null}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md mb-6 border-b border-gray-200">
          <div className="flex flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading {activeTab} data...</p>
          </div>
        )}

        {!loading && activeTab === "reports" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700">
                Filter by status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="matched">Matched</option>
                <option value="resolved">Resolved</option>
              </select>
              <span className="text-sm text-gray-500 ml-auto">
                {filteredReports.length} of {reports.length} reports
              </span>
            </div>

            {filteredReports.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No reports found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Item Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        User ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                          {report.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {report.item_name}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              report.report_type === "lost"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {report.report_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            {report.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {report.user_id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() =>
                              handleDeleteReport(report.id, report.item_name)
                            }
                            disabled={deleting === report.id}
                            className="text-red-600 hover:text-red-800 disabled:text-gray-400 flex items-center gap-1"
                          >
                            <Trash2 size={16} />
                            {deleting === report.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "users" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {users.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Full Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                          {user.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {user.full_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {user.is_admin ? (
                            <span className="flex items-center gap-1 text-blue-600 font-semibold">
                              <Shield size={16} />
                              Admin
                            </span>
                          ) : (
                            <span className="text-gray-600">User</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "audit" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No audit logs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Action
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Performed By
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Target Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Target ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Details
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {log.action.replace(/_/g, " ")}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.performed_by || "System"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.target_type}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                          {log.target_id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.details || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
