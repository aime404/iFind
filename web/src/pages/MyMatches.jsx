import React, { useState, useEffect } from "react";
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
      pending: "bg-yellow-100 text-yellow-800",
      verified: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getReportTypeColor = (type) => {
    return type === "LOST"
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
        <h1 className="text-4xl font-bold text-gray-800 mb-8">My Matches</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {matches.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600 text-lg">
              No matches found. Keep checking back!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {/* Match Status Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      Match #{match.id}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Similarity Score:{" "}
                      <span className="font-semibold text-blue-600">
                        {(match.similarity_score * 100).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                      match.status
                    )}`}
                  >
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                  </span>
                </div>

                {/* Reports Side by Side */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Lost Report */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getReportTypeColor(
                            match.lost_report.report_type
                          )}`}
                        >
                          {match.lost_report.report_type}
                        </span>
                        <span className="text-gray-600 text-sm">
                          (ID: {match.lost_report.id})
                        </span>
                      </div>

                      {match.lost_report.photo_url && (
                        <div className="h-40 bg-gray-200 rounded-lg overflow-hidden mb-4">
                          <img
                            src={`http://127.0.0.1:8000${match.lost_report.photo_url}`}
                            alt={match.lost_report.item_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        {match.lost_report.item_name}
                      </h3>

                      <div className="space-y-2 text-sm text-gray-700">
                        <p>
                          <strong>Category:</strong> {match.lost_report.category}
                        </p>
                        <p>
                          <strong>Location:</strong> {match.lost_report.location}
                        </p>
                        <p>
                          <strong>Date:</strong>{" "}
                          {new Date(
                            match.lost_report.date_occurred
                          ).toLocaleDateString()}
                        </p>
                        <p className="line-clamp-3">
                          <strong>Description:</strong>{" "}
                          {match.lost_report.description}
                        </p>
                      </div>
                    </div>

                    {/* Found Report */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getReportTypeColor(
                            match.found_report.report_type
                          )}`}
                        >
                          {match.found_report.report_type}
                        </span>
                        <span className="text-gray-600 text-sm">
                          (ID: {match.found_report.id})
                        </span>
                      </div>

                      {match.found_report.photo_url && (
                        <div className="h-40 bg-gray-200 rounded-lg overflow-hidden mb-4">
                          <img
                            src={`http://127.0.0.1:8000${match.found_report.photo_url}`}
                            alt={match.found_report.item_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        {match.found_report.item_name}
                      </h3>

                      <div className="space-y-2 text-sm text-gray-700">
                        <p>
                          <strong>Category:</strong> {match.found_report.category}
                        </p>
                        <p>
                          <strong>Location:</strong> {match.found_report.location}
                        </p>
                        <p>
                          <strong>Date:</strong>{" "}
                          {new Date(
                            match.found_report.date_occurred
                          ).toLocaleDateString()}
                        </p>
                        <p className="line-clamp-3">
                          <strong>Description:</strong>{" "}
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
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg"
                      >
                        {actionLoading === match.id ? "Rejecting..." : "Reject"}
                      </button>
                      <button
                        onClick={() => handleVerify(match.id)}
                        disabled={actionLoading === match.id}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg"
                      >
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
