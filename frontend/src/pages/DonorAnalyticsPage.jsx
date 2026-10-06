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

  const COLORS = ['#059669', '#2563eb', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8">
      
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">CSR & Sustainability Report</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Donor Impact & Analytics</h1>
          <p className="text-xs text-slate-300">Detailed metrics on food waste reduction, donation history, and AI model performance.</p>
        </div>
        <div className="bg-emerald-950 border border-emerald-500/40 p-4 rounded-2xl text-center">
          <span className="text-[10px] text-emerald-400 font-bold uppercase block">AI Model Accuracy</span>
          <span className="text-2xl font-extrabold text-emerald-300">{data?.ai_prediction_accuracy || 94.2}%</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Meals Prepared" value={data?.total_meals_prepared || 12500} unit="meals" icon={Utensils} color="slate" />
        <StatCard title="Total Food Donated" value={data?.total_meals_donated || 1600} unit="meals" icon={HeartHandshake} color="emerald" />
        <StatCard title="Total Food Wasted" value={data?.total_meals_wasted || 320} unit="meals" icon={TrendingDown} color="amber" />
        <StatCard title="Waste Reduction Rate" value={`${data?.waste_reduction_rate || 84.5}%`} icon={Award} color="blue" badgeText="Sustainability Target" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Trend Bar Chart */}
        <div className="card space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Monthly Food Breakdown (Prepared vs Donated vs Wasted)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthly_trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="prepared" name="Prepared" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="donated" name="Donated" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wasted" name="Wasted" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="card space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Food Waste Share by Category (%)</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.waste_by_category || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="category"
                >
                  {(data?.waste_by_category || []).map((entry, index) => (
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
