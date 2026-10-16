import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { Leaf, AlertCircle, Lock, Mail, UserCheck, Building2, HeartHandshake, ShieldCheck, RefreshCw } from "lucide-react";

export const LoginPage = ({ onNavigate }) => {
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("donor"); // 'donor', 'acceptor', 'admin'
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendDevUrl, setResendDevUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResendMsg("");
    setResendDevUrl("");
    setLoading(true);

    try {
      const user = await login(email, password, role);
      if (user.role === "donor") {
        onNavigate("/donor/dashboard");
      } else if (user.role === "acceptor") {
        onNavigate("/acceptor/dashboard");
      } else {
        onNavigate("/admin/dashboard");
      }
    } catch (err) {
      setError(err.message || "Failed to log in. Please check credentials and selected role.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setResendMsg("Please enter your email address above.");
      return;
    }
    setResendLoading(true);
    setResendMsg("");
    setResendDevUrl("");

    try {
      const res = await authAPI.resendVerification(email);
      setResendMsg(res.message || "Verification link sent! Check your inbox.");
      if (res.verification_url) {
        setResendDevUrl(res.verification_url);
      }
    } catch (err) {
      setResendMsg(err.message || "Failed to send verification link.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleQuickDemo = (demoRole) => {
    if (demoRole === "donor") {
      setEmail("donor@demo.com");
      setPassword("password123");
      setRole("donor");
    } else if (demoRole === "acceptor") {
      setEmail("acceptor@demo.com");
      setPassword("password123");
      setRole("acceptor");
    } else if (demoRole === "admin") {
      setEmail("admin@demo.com");
      setPassword("admin123");
      setRole("admin");
    }
  };

  const isUnverifiedError = error && (error.toLowerCase().includes("not verified") || error.toLowerCase().includes("verification"));
  const isPendingError = error && (error.toLowerCase().includes("pending") || error.toLowerCase().includes("awaiting"));
  const isRejectedError = error && error.toLowerCase().includes("rejected");

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
            <Leaf className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-500">Sign in to your Food Redistribution Portal</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>

            {/* If pending review */}
            {isPendingError && (
              <div className="pt-2 border-t border-red-200/60">
                <button
                  type="button"
                  onClick={() => onNavigate(`/application-status?email=${encodeURIComponent(email)}`)}
                  className="btn btn-outline border-amber-400 text-amber-900 bg-amber-50/70 hover:bg-amber-100 w-full text-xs py-2 font-bold"
                >
                  Check Application Status
                </button>
              </div>
            )}

            {/* If rejected */}
            {isRejectedError && (
              <div className="pt-2 border-t border-red-200/60">
                <button
                  type="button"
                  onClick={() => onNavigate(`/application-status?email=${encodeURIComponent(email)}`)}
                  className="btn btn-outline border-red-300 text-red-800 bg-red-100/50 hover:bg-red-100 w-full text-xs py-2 font-bold"
                >
                  View Details & Reapply
                </button>
              </div>
            )}

            {/* If unverified */}
            {isUnverifiedError && (
              <div className="pt-2 border-t border-red-200/60 flex flex-col gap-1.5">
                <button
                  type="button"
                  disabled={resendLoading}
                  onClick={handleResend}
                  className="text-xs text-red-800 font-bold hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? "animate-spin" : ""}`} />
                  {resendLoading ? "Resending..." : `Resend verification link to ${email || "your email"}`}
                </button>
                {resendMsg && (
                  <p className="text-[11px] font-semibold text-emerald-700">{resendMsg}</p>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ROLE SELECTION RADIO TOGGLE */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Login Role:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                role === 'donor'
                  ? 'border-emerald-500 bg-emerald-50/60 text-emerald-800 shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="donor"
                  checked={role === "donor"}
                  onChange={() => setRole("donor")}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Food Donor</span>
              </label>

              <label className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                role === 'acceptor'
                  ? 'border-blue-500 bg-blue-50/60 text-blue-800 shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="acceptor"
                  checked={role === "acceptor"}
                  onChange={() => setRole("acceptor")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <HeartHandshake className="w-4 h-4 text-blue-600" />
                <span>Food Acceptor</span>
              </label>
            </div>
          </div>

          {/* EMAIL */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 text-xs"
          >
            {loading ? "Authenticating..." : "Login to Portal"}
          </button>
        </form>

        {/* DEMO QUICK ACCESS BUTTONS */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
            Demo Evaluation Quick Sign-In
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemo("donor")}
              className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
            >
              Food Donor Demo
            </button>
            <button
              onClick={() => handleQuickDemo("acceptor")}
              className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors"
            >
              Food Acceptor Demo
            </button>
          </div>
        </div>

        {/* Registration Links */}
        <div className="text-center text-xs text-slate-500 space-y-2">
          <p>Don't have an organization account?</p>
          <div className="flex justify-center gap-3 font-semibold text-emerald-600">
            <button onClick={() => onNavigate("/register/donor")} className="hover:underline">
              Register as Donor
            </button>
            <span>•</span>
            <button onClick={() => onNavigate("/register/acceptor")} className="hover:underline text-blue-600">
              Register as Acceptor
            </button>
          </div>
          
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigate("/admin/login")}
              className="text-[11px] text-slate-400 hover:text-slate-700 font-semibold flex items-center justify-center gap-1 mx-auto"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              Administrator Access Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
