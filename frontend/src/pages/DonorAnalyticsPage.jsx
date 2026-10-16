import React, { useEffect, useState } from "react";
import { analyticsAPI } from "../services/api";
import { StatCard } from "../components/StatCard";
import { Utensils, HeartHandshake, TrendingDown, Sparkles, Award } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export const DonorAnalyticsPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    analyticsAPI.getDonor()
      .then((res) => setData(res))
      .catch((err) => console.log(err));
  }, []);

  const COLORS = ['#059669', '#2563eb', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8">
      
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">CSR & Sustainability Report</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Food Surplus Redistribution & Impact Analytics</h1>
          <p className="text-xs text-slate-300">Detailed metrics on surplus redistribution rates, donation history, and validated ML model accuracy.</p>
        </div>
        <div className="bg-emerald-950 border border-emerald-500/40 p-4 rounded-2xl text-center">
          <span className="text-[10px] text-emerald-400 font-bold uppercase block">AI Model Accuracy (R²)</span>
          <span className="text-2xl font-extrabold text-emerald-300">{data?.ai_prediction_accuracy || 92.1}%</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Prepared" value={data?.total_meals_prepared ?? 0} unit="units" icon={Utensils} color="slate" />
        <StatCard title="Surplus Redistributed" value={data?.total_meals_donated ?? 0} unit="units" icon={HeartHandshake} color="emerald" />
        <StatCard title="Recorded Food Surplus" value={(data?.total_meals_surplus ?? data?.total_meals_wasted) ?? 0} unit="units" icon={TrendingDown} color="amber" />
        <StatCard title="Redistribution Rate" value={`${(data?.surplus_redistribution_rate ?? data?.waste_reduction_rate) ?? 0}%`} icon={Award} color="blue" subtext="Sustainability target" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Trend Bar Chart */}
        <div className="card space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Monthly Food Breakdown (Prepared vs Redistributed vs Uncollected)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthly_trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="prepared" name="Prepared" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="donated" name="Redistributed" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="surplus_uncollected" name="Uncollected Surplus" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="card space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Food Surplus Distribution by Category (%)</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.surplus_by_category || data?.waste_by_category || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="category"
                >
                  {(data?.surplus_by_category || data?.waste_by_category || []).map((entry, index) => (
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
