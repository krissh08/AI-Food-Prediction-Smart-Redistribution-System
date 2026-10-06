import React, { useState, useEffect } from "react";
import { donationsAPI } from "../services/api";
import { Truck, CheckCircle2, Clock, MapPin } from "lucide-react";

export const DonorPickupsPage = () => {
  const [pickups, setPickups] = useState([]);

  useEffect(() => {
    fetchPickups();
  }, []);

  const fetchPickups = async () => {
    try {
      const data = await donationsAPI.getDonations("APPROVED");
      setPickups(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Pickup Tracking</h1>
          <p className="text-xs text-slate-500">Monitor upcoming NGO collections and completed food deliveries</p>
        </div>
        <span className="badge badge-emerald">{pickups.length} Scheduled Pickups</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pickups.length === 0 ? (
          <div className="md:col-span-2 card p-12 text-center text-slate-400 text-xs">No active scheduled pickups.</div>
        ) : (
          pickups.map((p) => (
            <div key={p.id} className="card space-y-4">
              <div className="flex items-center justify-between">
                <span className="badge badge-emerald">Scheduled Pickup</span>
                <span className="text-xs font-bold text-emerald-700">{p.pickup_time || "Within 2 hours"}</span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base">{p.food_name}</h3>
                <p className="text-xs text-slate-600 mt-1">Collecting Organization: <span className="font-bold">{p.acceptor_organization}</span></p>
                <p className="text-xs text-slate-600">Quantity: <span className="font-bold text-emerald-700">{p.requested_quantity || 100} meals</span></p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {p.pickup_address}</span>
                <span className="font-bold text-slate-700">Status: {p.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
