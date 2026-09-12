import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Report an Item</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white p-8 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Report Type */}
            <div>
              <label className="block text-gray-700 font-medium mb-3">
                Report Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="report_type"
                    value="lost"
                    checked={formData.report_type === "lost"}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Lost Item</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="report_type"
                    value="found"
                    checked={formData.report_type === "found"}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Found Item</span>
                </label>
              </div>
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Item Name
              </label>
              <input
                type="text"
                name="item_name"
                value={formData.item_name}
                onChange={handleInputChange}
                placeholder="e.g., Blue Backpack"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
              <label className="block text-gray-700 font-medium mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide detailed information about the item"
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Student Center"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            {/* Date Occurred */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Date of Incident
              </label>
              <input
                type="date"
                name="date_occurred"
                value={formData.date_occurred}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Photo (Optional)
              </label>
              <input
                type="file"
                name="photo"
                onChange={handlePhotoChange}
                accept="image/*"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {photoPreview && (
                <div className="mt-4">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-h-64 rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg"
            >
              {loading ? "Creating..." : "Create Report"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateReport;
