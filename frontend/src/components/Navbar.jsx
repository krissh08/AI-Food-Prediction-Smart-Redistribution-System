import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Leaf, Bell, User } from "lucide-react";

export const Navbar = ({ onNavigate, activePage, onScrollToRegister }) => {
  const { user, notifications, unreadNotifCount, markNotificationAsRead } = useAuth();
  const [showNotifPopover, setShowNotifPopover] = useState(false);

  const handleRegisterClick = () => {
    if (activePage === "/") {
      if (onScrollToRegister) {
        onScrollToRegister();
      } else {
        const el = document.getElementById("register-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      onNavigate("/");
      setTimeout(() => {
        const el = document.getElementById("register-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div 
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={() => onNavigate(user ? `/${user.role}/dashboard` : "/")}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 group-hover:bg-emerald-700 transition-colors">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-slate-900 block leading-none">
              Nourish<span className="text-emerald-600">Sync</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase block mt-1">
              AI Surplus Redistribution
            </span>
          </div>
        </div>

        {/* User Navigation / Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Role Badge */}
              <span className={`badge ${
                user.role === 'donor' ? 'badge-emerald' : user.role === 'acceptor' ? 'badge-blue' : 'badge-slate'
              }`}>
                {user.role === 'donor' ? 'Food Donor' : user.role === 'acceptor' ? 'Food Acceptor' : 'Admin'}
              </span>

              {/* Notification Popover Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifPopover(!showNotifPopover)}
                  className="relative p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover */}
                {showNotifPopover && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">In-App Notifications</h4>
                      <span className="text-xs text-slate-500 font-semibold">{notifications.length} total</span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">No notifications yet.</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3.5 text-xs transition-colors hover:bg-slate-50 cursor-pointer ${
                              !n.read_status ? "bg-emerald-50/60" : ""
                            }`}
                            onClick={() => markNotificationAsRead(n.id)}
                          >
                            <div className="font-bold text-slate-800 flex items-center justify-between">
                              <span>{n.title}</span>
                              {!n.read_status && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                            </div>
                            <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1.5 block font-mono">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Name display (Top-Right Logout Button Removed) */}
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold text-slate-900 block truncate max-w-[140px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
                    {user.email}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate("/login")}
                className="btn btn-outline text-xs px-4 py-2"
              >
                Sign In
              </button>
              <button
                onClick={handleRegisterClick}
                className="btn btn-primary text-xs px-4 py-2"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
