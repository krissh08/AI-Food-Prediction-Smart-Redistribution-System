import React, { useEffect, useState } from "react";
import { analyticsAPI } from "../services/api";
import { StatCard } from "../components/StatCard";
import { HeartHandshake, Inbox, Truck, Users, MapPin } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export const AcceptorAnalyticsPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    analyticsAPI.getAcceptor()
      .then((res) => setData(res))
      .catch((err) => console.log(err));
  }, []);

  const COLORS = ['#2563eb', '#059669', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-8">
      
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">NGO Distribution Metrics</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Acceptor Redistribution Analytics</h1>
        <p className="text-xs text-slate-300">Track total food received, donor partner network, and community meal distribution.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Food Received" value={data?.total_food_received_meals ?? 0} unit="meals" icon={HeartHandshake} color="blue" />
        <StatCard title="Requests Submitted" value={data?.total_requests_submitted ?? 0} unit="requests" icon={Inbox} color="emerald" />
        <StatCard title="Completed Pickups" value={data?.completed_pickups ?? 0} unit="pickups" icon={Truck} color="purple" />
        <StatCard title="Donor Partners" value={data?.active_donor_partners ?? 0} icon={Users} color="amber" subtext="Active network" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Received Area Chart */}
        <div className="card space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Monthly Meals Received (2026)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly_received || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="meals" name="Meals Received" stroke="#2563eb" fill="#eff6ff" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Received Pie Chart */}
        <div className="card space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Food Categories Breakdown</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.food_categories_received || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="meals"
                  nameKey="category"
                >
                  {(data?.food_categories_received || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
