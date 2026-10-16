import React from "react";
import { useAuth } from "../context/AuthContext";
import { User, Building2, HeartHandshake, MapPin, Mail, Phone, Clock } from "lucide-react";

export const UserProfilePage = () => {
  const { user } = useAuth();
  if (!user) return null;

  const prof = user.profile || {};

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${
          user.role === 'donor' ? 'bg-emerald-600' : 'bg-blue-600'
        }`}>
          {user.role === 'donor' ? <Building2 className="w-7 h-7" /> : <HeartHandshake className="w-7 h-7" />}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{user.name}</h1>
          <span className="badge badge-emerald capitalize mt-1">{user.role} Profile</span>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">Organization Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Organization Name</span>
            <span className="font-bold text-slate-900 text-sm">{prof.organization_name || user.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Organization Type</span>
            <span className="font-bold text-slate-900 text-sm">{prof.organization_type || "N/A"}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Contact Email</span>
            <span className="font-bold text-slate-900 text-sm">{user.email}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Contact Phone</span>
            <span className="font-bold text-slate-900 text-sm">{user.phone || "N/A"}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-400 block">Location Address</span>
            <span className="font-bold text-slate-900 text-sm">{prof.address || "N/A"}, {prof.city}, {prof.state} - {prof.pin_code}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Latitude</span>
            <span className="font-mono text-slate-900">{prof.latitude ?? "N/A"}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Longitude</span>
            <span className="font-mono text-slate-900">{prof.longitude ?? "N/A"}</span>
          </div>
          {user.role === 'acceptor' && (
            <>
              <div>
                <span className="text-slate-400 block">Max Daily Capacity</span>
                <span className="font-bold text-emerald-700 text-sm">{prof.max_capacity} meals</span>
              </div>
              <div>
                <span className="text-slate-400 block">Operating Hours</span>
                <span className="font-bold text-slate-900 text-sm">{prof.operating_hours}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
