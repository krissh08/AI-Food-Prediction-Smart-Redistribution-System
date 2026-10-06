import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Building2, Mail, Lock, Phone, MapPin, AlertCircle } from "lucide-react";

export const RegisterDonorPage = ({ onNavigate }) => {
  const { registerDonor } = useAuth();

  const [formData, setFormData] = useState({
    organization_name: "",
    owner_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    organization_type: "Restaurant",
    address: "",
    city: "Bengaluru",
    state: "Karnataka",
    pin_code: "560001",
    latitude: 12.9716,
    longitude: 77.5946
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await registerDonor({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      });
      onNavigate("/donor/dashboard");
    } catch (err) {
      setError(err.message || "Donor registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Food Donor Registration</h2>
          <p className="text-xs text-slate-500">Register your food establishment to list surplus meals and prevent wastage</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Organization Name */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Organization / Business Name *</label>
              <input
                type="text"
                required
                name="organization_name"
                value={formData.organization_name}
                onChange={handleChange}
                placeholder="e.g., Grand Palace Hotel"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Owner / Manager Name */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Owner / Manager Name</label>
              <input
                type="text"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                placeholder="e.g., Robert Vance"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address *</label>
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="donor@business.com"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number *</label>
              <input
                type="text"
                required
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Organization Type */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Organization Type *</label>
              <select
                name="organization_type"
                value={formData.organization_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Restaurant">Restaurant</option>
                <option value="Hotel">Hotel</option>
                <option value="College Canteen">College Canteen</option>
                <option value="Hostel">Hostel</option>
                <option value="Event Organizer">Event Organizer</option>
                <option value="Cafeteria">Cafeteria</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* PIN Code */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">PIN Code *</label>
              <input
                type="text"
                required
                name="pin_code"
                value={formData.pin_code}
                onChange={handleChange}
                placeholder="560001"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password *</label>
              <input
                type="password"
                required
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Confirm Password *</label>
              <input
                type="password"
                required
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Full Pickup Address *</label>
            <textarea
              required
              name="address"
              rows={2}
              value={formData.address}
              onChange={handleChange}
              placeholder="Building number, Street, Area, Landmark"
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Location Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Latitude Coordinate</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Longitude Coordinate</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 text-xs"
          >
            {loading ? "Registering Donor..." : "Complete Donor Registration"}
          </button>

          <p className="text-center text-xs text-slate-500">
            Already registered?{" "}
            <button
              type="button"
              onClick={() => onNavigate("/login")}
              className="text-emerald-600 font-bold hover:underline"
            >
              Sign In Here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
