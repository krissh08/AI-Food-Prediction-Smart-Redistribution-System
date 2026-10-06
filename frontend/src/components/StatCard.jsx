import React from "react";

export const StatCard = ({ title, value, unit = "", icon: Icon, color = "emerald", subtext, badgeText }) => {
  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-red-50 text-red-600 border-red-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <div className="card card-hover flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
          {Icon && (
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colorClasses[color] || colorClasses.emerald}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && <span className="text-xs font-semibold text-slate-500">{unit}</span>}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>{subtext || "Updated in real-time"}</span>
        {badgeText && (
          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};
