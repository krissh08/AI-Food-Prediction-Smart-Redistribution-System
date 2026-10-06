import React from "react";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert } from "lucide-react";

export const ProtectionGuard = ({ allowedRoles = [], children, onNavigate }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Authentication Required</h2>
          <p className="text-sm text-slate-600">Please sign in to access this portal page.</p>
          <button onClick={() => onNavigate("/login")} className="btn btn-primary w-full">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 shadow-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-600">
            You are logged in as a <span className="font-bold uppercase text-slate-800">{user.role}</span>.
            You are not authorized to view the <span className="font-bold uppercase text-red-600">{allowedRoles.join(" / ")}</span> interface.
          </p>
          <button
            onClick={() => onNavigate(`/${user.role}/dashboard`)}
            className="btn btn-primary w-full"
          >
            Return to My {user.role === 'donor' ? 'Donor' : 'Acceptor'} Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
