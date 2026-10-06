import React, { useState, useEffect } from "react";
import { donationsAPI } from "../services/api";
import { Inbox, Clock, CheckCircle2, MapPin, Truck } from "lucide-react";

export const AcceptorRequestsPage = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await donationsAPI.getDonations();
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Submitted Requests</h1>
          <p className="text-xs text-slate-500">Track status of requested food donations from partners</p>
        </div>
        <span className="badge badge-blue">{requests.length} Total Requests</span>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 text-xs">No active food requests submitted yet.</div>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{r.food_name}</h3>
                  <span className="text-xs text-slate-500">Donor: {r.donor_organization}</span>
                </div>
                <span className={`badge ${
                  r.status === 'APPROVED' ? 'badge-emerald' : r.status === 'REQUESTED' ? 'badge-warning' : r.status === 'COMPLETED' ? 'badge-blue' : 'badge-slate'
                }`}>
                  {r.status}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div>Requested Quantity: <span className="font-bold text-emerald-700">{r.requested_quantity} meals</span></div>
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <Clock className="w-3.5 h-3.5" /> Requested on: {new Date(r.requested_at).toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <MapPin className="w-3.5 h-3.5" /> Pickup address: {r.pickup_address}
                </div>
              </div>

              {/* TIMELINE VISUALIZER */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span className={r.status !== 'CANCELLED' ? "text-emerald-600" : ""}>✓ 1. Request Submitted</span>
                <span className={['APPROVED', 'PICKUP_SCHEDULED', 'COMPLETED'].includes(r.status) ? "text-emerald-600" : ""}>
                  {['APPROVED', 'PICKUP_SCHEDULED', 'COMPLETED'].includes(r.status) ? "✓ 2. Approved by Donor" : "2. Awaiting Approval"}
                </span>
                <span className={r.status === 'COMPLETED' ? "text-emerald-600" : ""}>
                  {r.status === 'COMPLETED' ? "✓ 3. Collected & Completed" : "3. Scheduled Pickup"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
