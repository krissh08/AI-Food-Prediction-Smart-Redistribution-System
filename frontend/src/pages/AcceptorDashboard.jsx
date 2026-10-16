import React, { useEffect, useState } from "react";
import { acceptorAPI, donationsAPI } from "../services/api";
import { StatCard } from "../components/StatCard";
import { MapViewer } from "../components/MapViewer";
import {
  Utensils,
  MapPin,
  Clock,
  Inbox,
  CheckCircle,
  Truck,
  HeartHandshake,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

export const AcceptorDashboard = ({ onNavigate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await acceptorAPI.getDashboard();
      setData(res);
    } catch (err) {
      console.error("Acceptor dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPickup = async (requestId) => {
    try {
      await donationsAPI.confirmPickup(requestId);
      loadDashboard();
    } catch (err) {
      alert("Error confirming pickup: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        Loading Food Acceptor Dashboard...
      </div>
    );
  }

  const kpi = data?.kpi_cards || {};

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">Food Acceptor Portal</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            WELCOME, {data?.organization_name || "ACCEPTOR NGO"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Nearby surplus food discovery, smart matching score, and pickup management portal.
          </p>
        </div>

        <button
          onClick={() => onNavigate("/acceptor/available-food")}
          className="btn bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold text-xs"
        >
          <Utensils className="w-4 h-4" />
          Browse Available Food
        </button>
      </div>

      {/* 6 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Available Food" value={kpi.available_donations} unit="listings" icon={Utensils} color="blue" subtext="Platform wide" />
        <StatCard title="Nearby Food" value={kpi.nearby_food_count} unit="listings" icon={MapPin} color="emerald" subtext="Within 10 km" />
        <StatCard title="Pending Requests" value={kpi.pending_requests} unit="requests" icon={Inbox} color="amber" subtext="Awaiting donor" />
        <StatCard title="Accepted" value={kpi.accepted_donations} unit="donations" icon={CheckCircle} color="purple" subtext="Approved for pickup" />
        <StatCard title="Today's Pickups" value={kpi.todays_pickups_count} unit="scheduled" icon={Truck} color="blue" subtext="Scheduled today" />
        <StatCard title="Total Received" value={kpi.total_food_received_meals} unit="meals" icon={HeartHandshake} color="emerald" subtext="Distributed to community" />
      </div>

      {/* MAP & EXPIRING SOON ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Leaflet OpenStreetMap View */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Nearby Available Food Map</h3>
              <p className="text-xs text-slate-500">Real-time geographic locations of surplus food listings</p>
            </div>
            <button onClick={() => onNavigate("/acceptor/available-food")} className="text-xs font-semibold text-blue-600 hover:underline">
              View Catalog
            </button>
          </div>

          <MapViewer markers={data?.map_markers || []} height="320px" />
        </div>

        {/* Expiring Soon Alerts */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-amber-600">
              <AlertTriangle className="w-4 h-4" /> Expiring Soon Priority
            </h3>
            <span className="badge badge-warning">High Priority</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {data?.expiring_soon?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No urgent expiring food currently.</div>
            ) : (
              data?.expiring_soon?.map((item) => (
                <div key={item.id} className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{item.food_name}</span>
                    <span className="badge badge-warning text-[10px]">{item.match_score}% Match</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-emerald-700">{item.quantity} {item.unit}</span> • Donor: {item.donor_name}
                  </div>
                  <div className="text-[11px] text-amber-800 font-semibold flex items-center justify-between">
                    <span>Expires: {item.expiry_time}</span>
                    <span>{item.distance_km} km away</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* TODAY'S SCHEDULED PICKUPS ROW */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm">Today's Pickup Schedule</h3>
          <span className="text-xs text-slate-500">{data?.todays_pickups?.length || 0} scheduled</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.todays_pickups?.length === 0 ? (
            <div className="col-span-full p-8 text-center text-xs text-slate-400">No pickups scheduled for today.</div>
          ) : (
            data?.todays_pickups?.map((p) => (
              <div key={p.pickup_id} className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{p.food_name}</span>
                  <span className="badge badge-blue text-[10px]">{p.pickup_status}</span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Donor: <span className="font-bold text-slate-800">{p.donor_organization}</span></div>
                  <div>Quantity: <span className="font-bold text-emerald-700">{p.quantity} meals</span></div>
                  <div className="flex items-center gap-1 text-slate-500"><Clock className="w-3.5 h-3.5" /> Time: {p.pickup_time}</div>
                  <div className="flex items-center gap-1 text-slate-500"><MapPin className="w-3.5 h-3.5" /> {p.pickup_address}</div>
                </div>

                <button
                  onClick={() => handleConfirmPickup(p.pickup_id)}
                  className="btn btn-primary btn-sm w-full text-[11px]"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Confirm Food Collected
                </button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
