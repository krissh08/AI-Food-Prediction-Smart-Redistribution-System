import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { Building2, Mail, Lock, Phone, MapPin, AlertCircle, CheckCircle2, ArrowRight, RefreshCw, Upload, FileText } from "lucide-react";
import { LocationPickerMap } from "../components/LocationPickerMap";

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
    parent_institution: "",
    address: "",
    city: "Bengaluru",
    state: "Karnataka",
    pin_code: "560001",
    latitude: 12.9716,
    longitude: 77.5946
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("business_registration");
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
      const res = await registerDonor({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      });

      // If document was selected, upload it linked to the created application
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
      setError(err.message || "Donor registration failed.");
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
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-inner">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Verify Your Email</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              We've dispatched an email verification link to:
            </p>
            <p className="text-sm font-bold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200 break-all">
              {registrationSuccess.email}
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left text-xs text-amber-800 space-y-1">
              <span className="font-bold block">Important Notice:</span>
              <span>1. Click the verification link in your email to confirm ownership.</span><br />
              <span>2. After email verification, your organization details and documents undergo manual administrator review before dashboard access is unlocked.</span>
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
              className="btn btn-primary w-full text-xs font-bold py-3 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              Return to Sign In <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="w-full text-xs text-emerald-700 font-semibold hover:underline flex items-center justify-center gap-1.5 py-1"
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
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Food Donor Registration</h2>
          <p className="text-xs text-slate-500">Register your food establishment to list surplus meals and power smart redistribution</p>
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

          {/* Parent Institution / Campus Affiliation (Optional) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Affiliation or Parent Institution (Optional)
            </label>
            <input
              type="text"
              name="parent_institution"
              value={formData.parent_institution}
              onChange={handleChange}
              placeholder="e.g., City University Campus Dining, Vance Hospitality Chain"
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-0.5">
              Explain relationship if operating under a university, hostel, or corporate campus without standalone registration.
            </p>
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

          {/* Supporting Verification Document Upload */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">Supporting Verification Document</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Upload business registration, FSSAI food license, or departmental authorization for manual admin review (PDF, PNG, JPG up to 5 MB).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Document Category</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="business_registration">Business Registration Certificate</option>
                  <option value="fssai_license">FSSAI Food Safety License</option>
                  <option value="student_union_letter">Institutional Authorization Letter</option>
                  <option value="other">Other Business Evidence</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Select File</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-medium">
                <FileText className="w-3.5 h-3.5" />
                <span>Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Interactive Map Location Picker */}
          <LocationPickerMap
            latitude={formData.latitude}
            longitude={formData.longitude}
            addressHint={`${formData.address} ${formData.city}`}
            theme="emerald"
            onChange={({ latitude, longitude }) => {
              setFormData((prev) => ({ ...prev, latitude, longitude }));
            }}
          />

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 text-xs"
          >
            {loading ? "Submitting Registration..." : "Complete Donor Registration"}
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
