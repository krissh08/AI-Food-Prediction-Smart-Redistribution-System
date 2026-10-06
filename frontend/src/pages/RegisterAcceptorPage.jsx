import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { HeartHandshake, Mail, Lock, Phone, MapPin, AlertCircle } from "lucide-react";

export const RegisterAcceptorPage = ({ onNavigate }) => {
  const { registerAcceptor } = useAuth();

  const [formData, setFormData] = useState({
    organization_name: "",
    contact_person: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    organization_type: "NGO",
    address: "",
    city: "Bengaluru",
    state: "Karnataka",
    pin_code: "560002",
    latitude: 12.9816,
    longitude: 77.6046,
    max_capacity: 500,
    food_categories: "Cooked Meals,Bakery,Packaged Food",
    operating_hours: "09:00 AM - 09:00 PM"
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
      await registerAcceptor({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        max_capacity: parseInt(formData.max_capacity)
      });
      onNavigate("/acceptor/dashboard");
    } catch (err) {
      setError(err.message || "Acceptor registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl mx-auto flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Food Acceptor Registration</h2>
          <p className="text-xs text-slate-500">Register your NGO or Charitable Organization to receive surplus food</p>
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Organization / NGO Name *</label>
              <input
                type="text"
                required
                name="organization_name"
                value={formData.organization_name}
                onChange={handleChange}
                placeholder="e.g., Hope Community Food Bank"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Person Name</label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder="e.g., Sarah Jenkins"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholder="ngo@charity.org"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholder="+91 9123456789"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Organization Type */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Organization Type *</label>
              <select
                name="organization_type"
                value={formData.organization_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="NGO">NGO</option>
                <option value="Food Bank">Food Bank</option>
                <option value="Charity">Charity</option>
                <option value="Shelter">Shelter</option>
                <option value="Community Organization">Community Organization</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Max Capacity */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Max Daily Food Capacity (meals) *</label>
              <input
                type="number"
                required
                name="max_capacity"
                value={formData.max_capacity}
                onChange={handleChange}
                placeholder="500"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Operating Hours */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Operating Hours</label>
              <input
                type="text"
                name="operating_hours"
                value={formData.operating_hours}
                onChange={handleChange}
                placeholder="08:00 AM - 10:00 PM"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                placeholder="560002"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Full Organization Address *</label>
            <textarea
              required
              name="address"
              rows={2}
              value={formData.address}
              onChange={handleChange}
              placeholder="Building, Street Name, Area, City"
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-secondary w-full py-3 text-xs"
          >
            {loading ? "Registering Acceptor..." : "Complete Acceptor Registration"}
          </button>

          <p className="text-center text-xs text-slate-500">
            Already registered?{" "}
            <button
              type="button"
              onClick={() => onNavigate("/login")}
              className="text-blue-600 font-bold hover:underline"
            >
              Sign In Here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
