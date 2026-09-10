import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as api from "../services/api";

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await api.getReport(id);
        setReport(data);
      } catch (err) {
        setError(err.message || "Failed to fetch report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <button
            onClick={() => navigate("/browse")}
            className="mb-4 text-blue-600 hover:underline font-medium"
          >
            ← Back to Browse
          </button>
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <button
            onClick={() => navigate("/browse")}
            className="mb-4 text-blue-600 hover:underline font-medium"
          >
            ← Back to Browse
          </button>
          <div className="text-center text-gray-600">Report not found</div>
        </div>
      </div>
    );
  }

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
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={() => navigate("/browse")}
          className="mb-6 text-blue-600 hover:underline font-medium"
        >
          ← Back to Browse
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Image */}
          {report.photo_url && (
            <div className="w-full h-96 bg-gray-200 overflow-hidden">
              <img
                src={`http://127.0.0.1:8000${report.photo_url}`}
                alt={report.item_name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            <div className="flex gap-3 mb-4">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getReportTypeColor(
                  report.report_type
                )}`}
              >
                {report.report_type}
              </span>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(
                  report.status
                )}`}
              >
                {report.status.replace("_", " ")}
              </span>
            </div>

            <h1 className="text-4xl font-bold text-gray-800 mb-6">
              {report.item_name}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">
                    Category
                  </h2>
                  <p className="text-gray-600">{report.category}</p>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">
                    Location
                  </h2>
                  <p className="text-gray-600">{report.location}</p>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">
                    Date
                  </h2>
                  <p className="text-gray-600">
                    {new Date(report.date_occurred).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">
                    Report ID
                  </h2>
                  <p className="text-gray-600 font-mono">{report.id}</p>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">
                    Posted
                  </h2>
                  <p className="text-gray-600">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">
                    Posted By
                  </h2>
                  <p className="text-gray-600">User ID: {report.user_id}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                Description
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700 leading-relaxed">
                  {report.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
