import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Sparkles,
  PlusCircle,
  UtensilsCrossed,
  Inbox,
  Truck,
  BarChart3,
  User,
  LogOut,
  MapPin,
  ShieldCheck,
  History
} from "lucide-react";

export const Sidebar = ({ activePath, onNavigate }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const donorLinks = [
    { label: "Dashboard", path: "/donor/dashboard", icon: LayoutDashboard },
    { label: "AI Prediction", path: "/donor/predictions", icon: Sparkles },
    { label: "Add Food Listing", path: "/donor/food", icon: PlusCircle },
    { label: "Donation Requests", path: "/donor/donations", icon: Inbox },
    { label: "Pickup Tracking", path: "/donor/pickups", icon: Truck },
    { label: "Analytics & History", path: "/donor/analytics", icon: BarChart3 },
    { label: "Organization Profile", path: "/donor/profile", icon: User },
  ];

  const acceptorLinks = [
    { label: "Dashboard", path: "/acceptor/dashboard", icon: LayoutDashboard },
    { label: "Available Food", path: "/acceptor/available-food", icon: UtensilsCrossed },
    { label: "Donation Requests", path: "/acceptor/requests", icon: Inbox },
    { label: "Pickup Management", path: "/acceptor/pickups", icon: Truck },
    { label: "Analytics & History", path: "/acceptor/analytics", icon: BarChart3 },
    { label: "NGO Profile", path: "/acceptor/profile", icon: User },
  ];

  const adminLinks = [
    { label: "Admin Dashboard", path: "/admin/dashboard", icon: ShieldCheck },
    { label: "Platform Analytics", path: "/donor/analytics", icon: BarChart3 },
  ];

  const links = user.role === "donor" ? donorLinks : user.role === "acceptor" ? acceptorLinks : adminLinks;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 sticky top-16 h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shadow-xl flex-shrink-0 z-40 overflow-y-auto">
      <div>
        <div className="px-3 py-2.5 mb-4 bg-slate-800/80 rounded-xl border border-slate-700/50">
          <span className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider block">
            Logged in as
          </span>
          <h3 className="text-sm font-bold text-white truncate mt-0.5">{user.name}</h3>
          <span className="text-xs text-slate-400 capitalize block mt-0.5">
            {user.role === 'donor' ? 'Food Donor Portal' : user.role === 'acceptor' ? 'Food Acceptor Portal' : 'Administrator'}
          </span>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = activePath === link.path;
            return (
              <button
                key={link.path + link.label}
                onClick={() => onNavigate(link.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* SINGLE STABLE SIGN OUT BUTTON AT BOTTOM LEFT */}
      <div className="pt-4 border-t border-slate-800 mt-auto">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
