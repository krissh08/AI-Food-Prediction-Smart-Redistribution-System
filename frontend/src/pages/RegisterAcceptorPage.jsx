import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { HeartHandshake, Mail, Lock, Phone, MapPin, AlertCircle, CheckCircle2, ArrowRight, RefreshCw, Upload, FileText } from "lucide-react";
import { LocationPickerMap } from "../components/LocationPickerMap";

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
    food_distribution_activities: "",
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

  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("ngo_registration");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5 MB. Please upload a smaller document.");
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
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
      const res = await registerAcceptor({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        max_capacity: parseInt(formData.max_capacity)
      });

      if (selectedFile && res.application_id) {
        try {
          const fd = new FormData();
          fd.append("file", selectedFile);
          fd.append("document_type", documentType);
          await authAPI.uploadDocument(res.application_id, fd);
        } catch (uploadErr) {
          console.warn("Document upload warning:", uploadErr);
        }
      }

      setRegistrationSuccess({
        email: formData.email,
        message: res.message || "Registration submitted successfully! Please check your email to verify your address.",
        verification_url: res.verification_url,
        application_id: res.application_id
      });
    } catch (err) {
      setError(err.message || "Acceptor registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registrationSuccess?.email) return;
    setResending(true);
    setResendStatus("");
    try {
      const res = await authAPI.resendVerification(registrationSuccess.email);
      setResendStatus(res.message || "Verification email dispatched!");
      if (res.verification_url) {
        setRegistrationSuccess((prev) => ({ ...prev, verification_url: res.verification_url }));
      }
    } catch (err) {
      setResendStatus(err.message || "Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full mx-auto flex items-center justify-center shadow-inner">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Verify Your Email</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              We've dispatched an email verification link to:
            </p>
            <p className="text-sm font-bold text-blue-700 bg-blue-50 py-2 px-3 rounded-xl border border-blue-200 break-all">
              {registrationSuccess.email}
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left text-xs text-amber-800 space-y-1">
              <span className="font-bold block">Important Notice:</span>
              <span>1. Click the verification link in your email to confirm ownership.</span><br />
              <span>2. After email verification, your NGO details and charitable documents undergo manual administrator review before access is granted.</span>
            </div>
          </div>

          {resendStatus && (
            <div className="p-2.5 bg-slate-100 rounded-xl text-xs text-slate-700 font-medium">
              {resendStatus}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={() => onNavigate("/login")}
              className="btn bg-blue-600 hover:bg-blue-500 text-white w-full text-xs font-bold py-3 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
            >
              Return to Sign In <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="w-full text-xs text-blue-700 font-semibold hover:underline flex items-center justify-center gap-1.5 py-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              {resending ? "Resending Link..." : "Didn't receive email? Resend link"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl mx-auto flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Food Acceptor Registration</h2>
          <p className="text-xs text-slate-500">Register your NGO, Food Bank, or Charitable Organization to receive surplus food</p>
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Authorized Contact Person *</label>
              <input
                type="text"
                required
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
                placeholder="contact@foodbank.org"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Phone Number *</label>
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
                <option value="NGO">Non-Governmental Organization (NGO)</option>
                <option value="Food Bank">Food Bank</option>
                <option value="Charity">Charity / Trust</option>
                <option value="Shelter">Shelter / Orphanage</option>
                <option value="Community Organization">Community Organization</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Max Daily Capacity */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Max Distribution Capacity (Meals/day) *</label>
              <input
                type="number"
                required
                min={10}
                max={50000}
                name="max_capacity"
                value={formData.max_capacity}
                onChange={handleChange}
                placeholder="500"
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

          {/* Description of Charitable Activities */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Food Distribution Activities & Mission Summary *
            </label>
            <textarea
              required
              name="food_distribution_activities"
              rows={2}
              value={formData.food_distribution_activities}
              onChange={handleChange}
              placeholder="Describe your community feeding programs, target beneficiaries, and food safety handling practices."
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Full Address */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Distribution Center / Office Address *</label>
            <textarea
              required
              name="address"
              rows={2}
              value={formData.address}
              onChange={handleChange}
              placeholder="Building number, Street, Area, Landmark"
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Supporting Verification Document Upload */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">Supporting Verification Document</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Upload NGO registration certificate, 80G tax exemption, or activity report for admin review (PDF, PNG, JPG up to 5 MB).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Document Category</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ngo_registration">NGO / Trust Registration Certificate</option>
                  <option value="tax_exemption_80g">80G / 12A Tax Exemption Certificate</option>
                  <option value="activity_report">Annual Activity / Distribution Report</option>
                  <option value="other">Other Supporting Evidence</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Select File</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 text-[11px] text-blue-700 font-medium">
                <FileText className="w-3.5 h-3.5" />
                <span>Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Location Picker Map */}
          <LocationPickerMap
            latitude={formData.latitude}
            longitude={formData.longitude}
            addressHint={`${formData.address} ${formData.city}`}
            theme="blue"
            onChange={({ latitude, longitude }) => {
              setFormData((prev) => ({ ...prev, latitude, longitude }));
            }}
          />

          <button
            type="submit"
            disabled={loading}
            className="btn bg-blue-600 hover:bg-blue-500 text-white w-full py-3 text-xs"
          >
            {loading ? "Submitting Registration..." : "Complete Acceptor Registration"}
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
