import React, { useState, useEffect } from "react";
import {
  Check,
  X,
  AlertCircle,
  Zap,
  Package,
  MapPin,
  Calendar,
  LayoutGrid,
} from "lucide-react";
import * as api from "../services/api";

const MyMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await api.getMyMatches();
        setMatches(data);
      } catch (err) {
        setError(err.message || "Failed to fetch matches");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleVerify = async (matchId) => {
    setActionLoading(matchId);
    try {
      const updatedMatch = await api.verifyMatch(matchId);
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? updatedMatch : m))
      );
    } catch (err) {
      alert("Failed to verify match: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (matchId) => {
    setActionLoading(matchId);
    try {
      const updatedMatch = await api.rejectMatch(matchId);
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? updatedMatch : m))
      );
    } catch (err) {
      alert("Failed to reject match: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      verified: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getReportTypeColor = (type) => {
    return type === "lost"
      ? "bg-orange-100 text-orange-800"
      : "bg-green-100 text-green-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <Zap size={32} className="text-yellow-500" />
          <div>
            <h1 className="text-4xl font-bold text-gray-800">My Matches</h1>
            <p className="text-gray-600 text-sm">
              Found {matches.length} potential match{matches.length !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {matches.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-md text-center border border-gray-100">
            <LayoutGrid size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg font-semibold">No matches found yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Upload reports and we'll automatically find matches for you
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-100 hover:border-yellow-200"
              >
                {/* Match Status Header */}
                <div className={`px-6 py-5 border-b-2 ${getStatusColor(match.status)} flex justify-between items-center`}>
                  <div className="flex items-center gap-4">
                    <div className="bg-white rounded-lg px-4 py-2">
                      <Zap size={24} className="text-yellow-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">
                        Match #{match.id}
                      </h2>
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <Zap size={14} />
                        Similarity:{" "}
                        <span className="font-semibold text-yellow-600">
                          {(match.similarity_score * 100).toFixed(1)}%
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(
                        match.status
                      )}`}
                    >
                      {match.status === "pending" && "🔄"}
                      {match.status === "verified" && "✅"}
                      {match.status === "rejected" && "❌"}{" "}
                      {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Reports Side by Side */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Lost Report */}
                    <div className="border-2 border-orange-200 rounded-xl p-5 bg-orange-50 hover:bg-orange-100 transition-colors">
                      <div className="flex items-center gap-2 mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getReportTypeColor(
                            match.lost_report.report_type
                          )}`}
                        >
                          📍 {match.lost_report.report_type}
                        </span>
                        <span className="text-gray-500 text-xs font-mono">
                          #{match.lost_report.id}
                        </span>
                      </div>

                      {match.lost_report.photo_url && (
                        <div className="h-40 bg-gray-200 rounded-lg overflow-hidden mb-4">
                          <img
                            src={`http://127.0.0.1:8000${match.lost_report.photo_url}`}
                            alt={match.lost_report.item_name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      )}

                      <h3 className="text-lg font-bold text-gray-800 mb-3">
                        {match.lost_report.item_name}
                      </h3>

                      <div className="space-y-2 text-sm text-gray-700">
                        <p className="flex items-center gap-2">
                          <Package size={16} className="text-purple-600" />
                          <span><strong>Category:</strong> {match.lost_report.category}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin size={16} className="text-red-600" />
                          <span><strong>Location:</strong> {match.lost_report.location}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar size={16} className="text-blue-600" />
                          <span><strong>Date:</strong> {new Date(
                            match.lost_report.date_occurred
                          ).toLocaleDateString()}</span>
                        </p>
                        <p className="line-clamp-3">
                          <strong className="text-gray-800">Description:</strong>
                          <br />
                          {match.lost_report.description}
                        </p>
                      </div>
                    </div>

                    {/* Found Report */}
                    <div className="border-2 border-green-200 rounded-xl p-5 bg-green-50 hover:bg-green-100 transition-colors">
                      <div className="flex items-center gap-2 mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getReportTypeColor(
                            match.found_report.report_type
                          )}`}
                        >
                          ✅ {match.found_report.report_type}
                        </span>
                        <span className="text-gray-500 text-xs font-mono">
                          #{match.found_report.id}
                        </span>
                      </div>

                      {match.found_report.photo_url && (
                        <div className="h-40 bg-gray-200 rounded-lg overflow-hidden mb-4">
                          <img
                            src={`http://127.0.0.1:8000${match.found_report.photo_url}`}
                            alt={match.found_report.item_name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      )}

                      <h3 className="text-lg font-bold text-gray-800 mb-3">
                        {match.found_report.item_name}
                      </h3>

                      <div className="space-y-2 text-sm text-gray-700">
                        <p className="flex items-center gap-2">
                          <Package size={16} className="text-purple-600" />
                          <span><strong>Category:</strong> {match.found_report.category}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin size={16} className="text-red-600" />
                          <span><strong>Location:</strong> {match.found_report.location}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar size={16} className="text-blue-600" />
                          <span><strong>Date:</strong> {new Date(
                            match.found_report.date_occurred
                          ).toLocaleDateString()}</span>
                        </p>
                        <p className="line-clamp-3">
                          <strong className="text-gray-800">Description:</strong>
                          <br />
                          {match.found_report.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {match.status === "pending" && (
                    <div className="mt-6 flex gap-4 justify-end">
                      <button
                        onClick={() => handleReject(match.id)}
                        disabled={actionLoading === match.id}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all hover:shadow-md active:scale-95"
                      >
                        <X size={18} />
                        {actionLoading === match.id ? "Rejecting..." : "Reject"}
                      </button>
                      <button
                        onClick={() => handleVerify(match.id)}
                        disabled={actionLoading === match.id}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all hover:shadow-md active:scale-95"
                      >
                        <Check size={18} />
                        {actionLoading === match.id ? "Verifying..." : "Verify"}
                      </button>
                    </div>
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

export default MyMatches;
