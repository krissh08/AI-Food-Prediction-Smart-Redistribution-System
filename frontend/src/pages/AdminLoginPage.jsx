import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Lock, Mail, AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";

export const AdminLoginPage = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password, "admin");
      if (user.role === "admin") {
        onNavigate("/admin/dashboard");
      } else {
        setError("Access denied: You do not possess administrator credentials.");
      }
    } catch (err) {
      setError(err.message || "Invalid administrator credentials or unauthorized access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/80 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">System Administrator Portal</h1>
          <p className="text-xs text-slate-400">
            Restricted access. Internal compliance & organization verification gateway.
          </p>
        </div>

        {/* Security Alert Banner */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl text-[11px] text-slate-300 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            All administrative logins and actions are cryptographically logged to the system audit trail. Unauthorized attempts will be recorded.
          </span>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="bg-red-950/60 border border-red-800/70 text-red-200 p-3 rounded-2xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Admin Identity / Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nourishsync.org"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Master Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Authenticate & Enter Gateway"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800 text-center">
          <button
            onClick={() => onNavigate("/login")}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Return to Food Donor / Acceptor Sign In
          </button>
        </div>

      </div>
    </div>
  );
};
