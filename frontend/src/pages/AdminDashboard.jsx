import React, { useEffect, useState } from "react";
import { adminAPI } from "../services/api";
import { StatCard } from "../components/StatCard";
import { ShieldCheck, Users, Building2, HeartHandshake, CheckCircle2, UserX, UserCheck, AlertTriangle } from "lucide-react";

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await adminAPI.getDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      loadDashboard();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-2"></div>
        Loading System Administrator Portal...
      </div>
    );
  }

  const kpi = data?.kpi || {};

  return (
    <div className="space-y-8">
      
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">System Administration</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Platform Control & Fraud Prevention</h1>
          <p className="text-xs text-slate-300">Monitor platform activity, registered users, and account authorizations.</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Platform Users" value={kpi.total_users} icon={Users} color="slate" />
        <StatCard title="Registered Donors" value={kpi.donors_count} icon={Building2} color="emerald" />
        <StatCard title="Registered Acceptors" value={kpi.acceptors_count} icon={HeartHandshake} color="blue" />
        <StatCard title="Completed Redistribution" value={kpi.completed_donations} icon={CheckCircle2} color="purple" />
      </div>

      {/* USER MANAGEMENT TABLE */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Registered System Accounts</h3>
            <p className="text-xs text-slate-500">Enable or disable user accounts to prevent fraud</p>
          </div>
          <span className="badge badge-slate">{data?.recent_users?.length || 0} Accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-2">ID</th>
                <th className="py-3 px-2">Organization / Name</th>
                <th className="py-3 px-2">Email</th>
                <th className="py-3 px-2">Role</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Joined</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recent_users?.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-2 font-mono text-slate-400">#{u.id}</td>
                  <td className="py-3 px-2 font-bold text-slate-900">{u.organization_name}</td>
                  <td className="py-3 px-2 text-slate-600">{u.email}</td>
                  <td className="py-3 px-2">
                    <span className={`badge ${
                      u.role === 'donor' ? 'badge-emerald' : u.role === 'acceptor' ? 'badge-blue' : 'badge-slate'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`badge ${u.is_active ? 'badge-emerald' : 'badge-danger'}`}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-400">{u.created_at}</td>
                  <td className="py-3 px-2 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleUser(u.id)}
                        className={`btn btn-sm text-[11px] ${
                          u.is_active
                            ? 'btn-outline text-red-600 hover:bg-red-50'
                            : 'btn-primary bg-emerald-600'
                        }`}
                      >
                        {u.is_active ? (
                          <>
                            <UserX className="w-3.5 h-3.5" /> Disable
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" /> Activate
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
