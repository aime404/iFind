import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Calendar,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";
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

  const getStatusIcon = (status) => {
    const icons = {
      submitted: <Clock size={16} />,
      under_review: <AlertCircle size={16} />,
      matched: <CheckCircle size={16} />,
      resolved: <Eye size={16} />,
    };
    return icons[status] || <AlertCircle size={16} />;
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
    return type === "lost"
      ? "bg-orange-100 text-orange-800"
      : "bg-green-100 text-green-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Browse Reports</h1>
          <p className="text-gray-600 mt-2">
            Find lost or found items across campus
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-100">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Search size={18} className="text-blue-600" />
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Item name or description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Package size={18} className="text-orange-600" />
                  Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                >
                  <option value="">All Types</option>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Package size={18} className="text-purple-600" />
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
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
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <MapPin size={18} className="text-red-600" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all hover:shadow-md flex items-center justify-center gap-2"
            >
              <Search size={20} />
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
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
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
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200"
              >
                {/* Image */}
                <div className="relative">
                  {report.photo_url ? (
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={`http://127.0.0.1:8000${report.photo_url}`}
                        alt={report.item_name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <Package size={48} className="text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getReportTypeColor(
                        report.report_type
                      )}`}
                    >
                      {report.report_type === "lost" ? "📍" : "✅"} {report.report_type}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusBadge(
                        report.status
                      )}`}
                    >
                      {getStatusIcon(report.status)}
                      {report.status.replace("_", " ")}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2 hover:text-blue-600">
                    {report.item_name}
                  </h2>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p className="flex items-center gap-2">
                      <Package size={16} className="text-purple-500 flex-shrink-0" />
                      <span className="font-semibold">{report.category}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin size={16} className="text-red-500 flex-shrink-0" />
                      <span className="truncate">{report.location}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-500 flex-shrink-0" />
                      <span>{new Date(report.date_occurred).toLocaleDateString()}</span>
                    </p>
                  </div>

                  <div className="text-blue-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                    <Eye size={16} />
                    View Details
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && reports.length === 0 && (
          <div className="bg-white p-12 rounded-xl shadow-md text-center border border-gray-100">
            <Package size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg font-semibold">No reports found</p>
            <p className="text-gray-500 text-sm mt-2">
              Try adjusting your search filters or check back later
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseReports;
