import React, { useEffect, useState } from "react";
import { donorAPI, donationsAPI } from "../services/api";
import { StatCard } from "../components/StatCard";
import {
  Utensils,
  TrendingDown,
  Sparkles,
  Inbox,
  CheckCircle,
  Truck,
  PlusCircle,
  ArrowRight,
  Clock,
  MapPin,
  Layers,
  Calendar
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const DonorDashboard = ({ onNavigate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await donorAPI.getDashboard();
      setData(res);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await donationsAPI.approve(requestId, { pickup_time: "Within 2 hours" });
      loadDashboard();
    } catch (err) {
      alert("Error approving request: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
        Loading Food Donor Surplus Dashboard...
      </div>
    );
  }

  const kpi = data?.kpi_cards || {};

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Food Surplus & Redistribution Portal</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            WELCOME, {data?.organization_name || "DONOR"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Machine learning surplus forecasting and automated food donation redistribution system.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate("/donor/predictions")}
            className="btn bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs"
          >
            <Sparkles className="w-4 h-4" />
            AI Predict Surplus
          </button>
          <button
            onClick={() => onNavigate("/donor/food")}
            className="btn bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            Publish Food for Donation
          </button>
        </div>
      </div>

      {/* 6 CORE DASHBOARD KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Today's Prepared */}
        <StatCard
          title="Today's Prepared"
          value={kpi.todays_prepared_meals}
          unit="units"
          icon={Utensils}
          color="slate"
          subtext="Total prep volume"
        />

        {/* 2. Estimated Demand */}
        <StatCard
          title="Estimated Demand"
          value={kpi.predicted_demand}
          unit="units"
          icon={Sparkles}
          color="blue"
          subtext="Derived consumption"
        />

        {/* 3. AI-Predicted Surplus (Future Estimate) */}
        <StatCard
          title="AI-Predicted Surplus"
          value={kpi.predicted_surplus}
          unit="units"
          icon={TrendingDown}
          color="amber"
          subtext="ML Model Forecast"
        />

        {/* 4. Available Food for Redistribution (Active published listings) */}
        <StatCard
          title="Available for Donation"
          value={kpi.available_food_listings ?? kpi.active_donations}
          unit="listings"
          icon={Inbox}
          color="purple"
          subtext="Published to NGOs"
        />

        {/* 5. Completed Donations */}
        <StatCard
          title="Completed Donations"
          value={kpi.completed_donations}
          unit="pickups"
          icon={CheckCircle}
          color="emerald"
          subtext="Successfully collected"
        />

        {/* 6. Total Surplus Redistributed */}
        <StatCard
          title="Surplus Redistributed"
          value={kpi.total_surplus_redistributed ?? kpi.food_saved_meals}
          unit="units"
          icon={Truck}
          color="emerald"
          subtext="Total rescued food"
        />
      </div>

      {/* CHARTS & PENDING REQUESTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Monthly Surplus & Redistribution Trend Chart */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Historical Surplus & Redistribution Trends</h3>
              <p className="text-xs text-slate-500">Prepared Volume vs Consumed vs Successfully Redistributed Surplus</p>
            </div>
            <button onClick={() => onNavigate("/donor/analytics")} className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
              View Analytics <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="prepared" name="Prepared" stroke="#64748b" fill="#f1f5f9" />
                <Area type="monotone" dataKey="consumed" name="Consumed" stroke="#2563eb" fill="#eff6ff" />
                <Area type="monotone" dataKey="surplus_saved" name="Surplus Redistributed" stroke="#059669" fill="#ecfdf5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Requests Box */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Pending NGO Redistribution Requests</h3>
            <span className="badge badge-warning">{data?.pending_requests?.length || 0} New</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {data?.pending_requests?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No pending acceptor requests.</div>
            ) : (
              data?.pending_requests?.map((req) => (
                <div key={req.request_id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{req.acceptor_name}</span>
                    <span className="text-[10px] text-slate-400">{req.requested_at}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Requested: <span className="font-bold text-emerald-700">{req.requested_quantity} units</span> of '{req.food_name}'
                  </div>
                  <button
                    onClick={() => handleApprove(req.request_id)}
                    className="btn btn-primary btn-sm w-full text-[11px]"
                  >
                    Approve Request & Schedule Pickup
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SURPLUS BY CATEGORY & RECENT AI PREDICTIONS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Surplus by Food Category */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Surplus by Food Category
            </h3>
            <span className="text-[11px] text-slate-500">Distribution Share</span>
          </div>

          <div className="space-y-3">
            {(data?.surplus_by_category || []).map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">{cat.category}</span>
                  <span className="text-slate-500 font-mono font-medium">{cat.surplus_pct}% ({cat.units_saved} units saved)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${cat.surplus_pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Surplus Predictions */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Recent AI Surplus Predictions
            </h3>
            <button onClick={() => onNavigate("/donor/predictions")} className="text-xs text-emerald-600 hover:underline">
              New Prediction
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(!data?.recent_predictions || data.recent_predictions.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-400">No predictions recorded yet.</div>
            ) : (
              data.recent_predictions.slice(0, 4).map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      {p.type_of_food} • Prep: {p.quantity_of_food} units ({p.number_of_guests} guests)
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {p.created_at}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-warning text-xs font-bold block">
                      Surplus: {p.predicted_surplus} units
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* RECENT LISTINGS & UPCOMING PICKUPS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Available Food for Redistribution (Live Listings) */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Available Food for Redistribution</h3>
              <p className="text-[11px] text-slate-400">Actual Published Listings (Separate from AI Predictions)</p>
            </div>
            <button onClick={() => onNavigate("/donor/food")} className="text-xs text-emerald-600 hover:underline font-semibold">View All</button>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recent_listings?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No active food listings published.</div>
            ) : (
              data?.recent_listings?.map((l) => (
                <div key={l.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{l.food_name}</span>
                    <span className="text-[11px] text-slate-500">{l.quantity} {l.unit} • Expires: {l.expiry_time}</span>
                  </div>
                  <span className={`badge ${
                    l.status === 'AVAILABLE' ? 'badge-emerald' : l.status === 'REQUESTED' ? 'badge-warning' : 'badge-slate'
                  }`}>
                    {l.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Pickups */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Confirmed Upcoming Pickups</h3>
            <span className="text-xs text-slate-500">{data?.upcoming_pickups?.length || 0} scheduled</span>
          </div>

          <div className="space-y-3">
            {data?.upcoming_pickups?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No upcoming pickups scheduled.</div>
            ) : (
              data?.upcoming_pickups?.map((p) => (
                <div key={p.pickup_id} className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-xs text-slate-900 block">{p.food_name}</span>
                    <span className="text-[11px] text-slate-600 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" /> {p.acceptor_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-700 block">{p.pickup_time}</span>
                    <span className="text-[10px] text-slate-500">{p.contact_phone}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
