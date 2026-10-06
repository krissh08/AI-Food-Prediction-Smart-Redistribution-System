import React, { useState, useEffect } from "react";
import { donationsAPI, matchingAPI } from "../services/api";
import { Inbox, CheckCircle2, XCircle, Clock, MapPin, Sparkles } from "lucide-react";

export const DonorRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await donationsAPI.getDonations();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await donationsAPI.approve(id, { pickup_time: "Within 2 hours" });
      fetchRequests();
    } catch (err) {
      alert("Approval error: " + err.message);
    }
  };

  const handleReject = async (id) => {
    if (window.confirm("Reject this donation request?")) {
      try {
        await donationsAPI.reject(id);
        fetchRequests();
      } catch (err) {
        alert("Rejection error: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Donation Requests</h1>
          <p className="text-xs text-slate-500">Review requests from NGOs and food banks for your surplus listings</p>
        </div>
        <span className="badge badge-emerald">{requests.length} Total Requests</span>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 text-xs">No donation requests received yet.</div>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="card flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-base">{r.acceptor_organization}</span>
                  <span className={`badge ${
                    r.status === 'APPROVED' ? 'badge-emerald' : r.status === 'REQUESTED' ? 'badge-warning' : r.status === 'REJECTED' ? 'badge-danger' : 'badge-slate'
                  }`}>
                    {r.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div>Requested: <span className="font-bold text-emerald-700">{r.requested_quantity} meals</span> of '{r.food_name}'</div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Clock className="w-3.5 h-3.5" /> Requested on: {new Date(r.requested_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {r.status === 'REQUESTED' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleReject(r.id)}
                    className="btn btn-outline text-red-600 hover:bg-red-50 text-xs"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(r.id)}
                    className="btn btn-primary text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Request
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
