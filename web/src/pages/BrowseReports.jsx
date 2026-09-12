import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as api from "../services/api";

const BrowseReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [reportType, setReportType] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      let data;
      if (searchQuery.trim()) {
        data = await api.searchReports(searchQuery, {
          report_type: reportType || undefined,
          category: category || undefined,
          location: location || undefined,
        });
      } else {
        data = await api.listReports({
          report_type: reportType || undefined,
          category: category || undefined,
          location: location || undefined,
        });
      }
      setReports(data);
    } catch (err) {
      setError(err.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const getStatusBadge = (status) => {
    const colors = {
      submitted: "bg-yellow-100 text-yellow-800",
      under_review: "bg-blue-100 text-blue-800",
      matched: "bg-green-100 text-green-800",
      resolved: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getReportTypeColor = (type) => {
    return type === "LOST" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Browse Reports</h1>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Item name or description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">All Types</option>
                  <option value="LOST">Lost</option>
                  <option value="FOUND">Found</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">All Categories</option>
                  <option value="electronics">Electronics</option>
                  <option value="accessories">Accessories</option>
                  <option value="clothing">Clothing</option>
                  <option value="documents">Documents</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Search
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Reports Grid */}
        {!loading && reports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Link
                key={report.id}
                to={`/reports/${report.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                {/* Image */}
                {report.photo_url && (
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={`http://127.0.0.1:8000${report.photo_url}`}
                      alt={report.item_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <div className="flex gap-2 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getReportTypeColor(
                        report.report_type
                      )}`}
                    >
                      {report.report_type}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(
                        report.status
                      )}`}
                    >
                      {report.status.replace("_", " ")}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {report.item_name}
                  </h2>

                  <p className="text-gray-600 text-sm mb-2">
                    <strong>Category:</strong> {report.category}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">
                    <strong>Location:</strong> {report.location}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">
                    <strong>Date:</strong>{" "}
                    {new Date(report.date_occurred).toLocaleDateString()}
                  </p>

                  <div className="text-blue-600 font-semibold text-sm mt-4">
                    View Details →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && reports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No reports found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseReports;
