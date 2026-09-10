import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, AlertCircle, Upload, Package, MapPin, Calendar, Type, FileText } from "lucide-react";
import * as api from "../services/api";

const CreateReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    item_name: "",
    category: "",
    description: "",
    location: "",
    date_occurred: "",
    report_type: "lost",
    photo: null,
  });
  const [photoPreview, setPhotoPreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        photo: file,
      }));
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("item_name", formData.item_name);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("date_occurred", formData.date_occurred);
      formDataToSend.append("report_type", formData.report_type);
      if (formData.photo) {
        formDataToSend.append("photo", formData.photo);
      }

      await api.createReport(formDataToSend);
      navigate("/browse");
    } catch (err) {
      setError(err.message || "Failed to create report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Plus size={36} className="text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-800">Report an Item</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Report Type */}
            <div>
              <label className="block text-gray-700 font-semibold mb-3">
                📋 Report Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all" 
                       style={{borderColor: formData.report_type === "lost" ? "#3b82f6" : "#d1d5db", backgroundColor: formData.report_type === "lost" ? "#eff6ff" : "white"}}>
                  <input
                    type="radio"
                    name="report_type"
                    value="lost"
                    checked={formData.report_type === "lost"}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700 font-medium">Lost Item</span>
                </label>
                <label className="flex items-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all"
                       style={{borderColor: formData.report_type === "found" ? "#3b82f6" : "#d1d5db", backgroundColor: formData.report_type === "found" ? "#eff6ff" : "white"}}>
                  <input
                    type="radio"
                    name="report_type"
                    value="found"
                    checked={formData.report_type === "found"}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700 font-medium">Found Item</span>
                </label>
              </div>
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <Type size={18} className="text-blue-600" />
                Item Name
              </label>
              <input
                type="text"
                name="item_name"
                value={formData.item_name}
                onChange={handleInputChange}
                placeholder="e.g., Blue Backpack"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <Package size={18} className="text-purple-600" />
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                required
              >
                <option value="">Select a category</option>
                <option value="electronics">Electronics</option>
                <option value="accessories">Accessories</option>
                <option value="clothing">Clothing</option>
                <option value="documents">Documents</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <FileText size={18} className="text-green-600" />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide detailed information about the item (color, brand, distinctive marks, etc.)"
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <MapPin size={18} className="text-red-600" />
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Student Center"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Date Occurred */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <Calendar size={18} className="text-orange-600" />
                Date of Incident
              </label>
              <input
                type="date"
                name="date_occurred"
                value={formData.date_occurred}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <Upload size={18} className="text-indigo-600" />
                Photo (Optional)
              </label>
              <input
                type="file"
                name="photo"
                onChange={handlePhotoChange}
                accept="image/*"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              {photoPreview && (
                <div className="mt-4">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-h-64 rounded-lg border-2 border-blue-200 shadow-md"
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              {loading ? "Creating..." : "Create Report"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateReport;
