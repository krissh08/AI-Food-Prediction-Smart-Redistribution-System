import React, { useEffect, useState } from "react";
import { analyticsAPI } from "../services/api";
import {
  Leaf,
  Sparkles,
  ArrowRight,
  Utensils,
  Building2,
  HeartHandshake,
  TrendingDown,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Zap
} from "lucide-react";

export const LandingPage = ({ onNavigate }) => {
  const [impactMetrics, setImpactMetrics] = useState({
    meals_saved: 14850,
    food_donated_meals: 16200,
    active_donors: 24,
    active_acceptors: 38,
    completed_redistributions: 420,
    co2_emissions_prevented_kg: 37125.0
  });

  useEffect(() => {
    analyticsAPI.getSystem()
      .then((data) => setImpactMetrics(data))
      .catch((err) => console.log("System impact fetch fallback:", err));
  }, []);

  const scrollToRegister = () => {
    const el = document.getElementById("register-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-4 py-2 rounded-full shadow-inner">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            AI-Driven Food Surplus Prediction & Smart Redistribution Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Turn Surplus Food Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Shared Meals</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            AI-powered food surplus prediction and intelligent redistribution connecting food donors with charitable organizations that need it most.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate("/register/donor")}
              className="btn btn-primary text-base px-8 py-4 shadow-xl shadow-emerald-600/30 w-full sm:w-auto"
            >
              <Building2 className="w-5 h-5" />
              Donate Surplus Food
            </button>
            <button
              onClick={() => onNavigate("/register/acceptor")}
              className="btn btn-secondary text-base px-8 py-4 shadow-xl shadow-blue-600/30 w-full sm:w-auto"
            >
              <HeartHandshake className="w-5 h-5" />
              Accept Food as NGO
            </button>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-10 max-w-4xl mx-auto text-left">
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-2xl">
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Meals Saved</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block">{impactMetrics.meals_saved.toLocaleString()}</span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-2xl">
              <span className="text-xs text-blue-400 font-bold uppercase tracking-wider block">Active Donors</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block">{impactMetrics.active_donors}</span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-2xl">
              <span className="text-xs text-teal-400 font-bold uppercase tracking-wider block">Active Acceptors</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block">{impactMetrics.active_acceptors}</span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-2xl">
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">CO₂ Reduced</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block">{impactMetrics.co2_emissions_prevented_kg.toLocaleString()} kg</span>
            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">End-to-End Workflow</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">How NourishSync Works</h2>
          <p className="text-slate-600 text-sm sm:text-base">
            From machine learning preparation forecasts to doorstep NGO pickup — a seamless 5-step redistribution flow.
          </p>
        </div>

        {/* 5 STEPS RESPONSIVE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { step: "01", title: "PREDICT", desc: "AI forecasts customer demand & food surplus before prep.", icon: Sparkles },
            { step: "02", title: "LIST", desc: "Donors publish excess meals with location & expiry details.", icon: Utensils },
            { step: "03", title: "MATCH", desc: "Smart algorithm scores nearby NGOs based on distance & capacity.", icon: Zap },
            { step: "04", title: "COLLECT", desc: "Accepted requests generate scheduled pickup timelines.", icon: Clock },
            { step: "05", title: "REDISTRIBUTE", desc: "NGO collects food and redistributes to communities in need.", icon: HeartHandshake }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-emerald-600">{item.step}</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-base tracking-wide uppercase">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI PREDICTION HIGHLIGHT */}
      <section className="bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="badge badge-emerald">Machine Learning Engine</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Predict Food Surplus <span className="text-emerald-400">Before</span> It Accumulates
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Our trained Random Forest model analyzes event scale, food types, preparation methods, storage conditions, and attendance to estimate surplus food amounts and flag high-surplus events.
            </p>
            
            <ul className="space-y-3">
              {[
                "Food Demand & Consumption Forecasting",
                "Expected Surplus Volume Calculation",
                "Optimized Cooking Preparation Recommendations",
                "Automated High-Surplus Warnings (>25% surplus ratio)"
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => onNavigate("/login")}
              className="btn btn-primary text-sm px-6 py-3"
            >
              Try AI Prediction Simulator
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">AI Model Output Example</span>
              <span className="text-xs bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full font-mono font-bold">Accuracy (R²): 92.1%</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-semibold">Quantity of Food</span>
                <span className="text-2xl font-bold text-white mt-1 block">450 units</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-semibold">Estimated Demand</span>
                <span className="text-2xl font-bold text-emerald-400 mt-1 block">409 units</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-semibold">Predicted Surplus</span>
                <span className="text-2xl font-bold text-amber-400 mt-1 block">41 units</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-semibold">Recommended Prep</span>
                <span className="text-2xl font-bold text-teal-300 mt-1 block">429 units</span>
              </div>
            </div>

            <div className="bg-emerald-950/80 border border-emerald-500/40 p-4 rounded-xl text-xs text-emerald-200 space-y-1">
              <span className="font-bold text-emerald-300 block">AI Optimization Insight:</span>
              <span>Predicting 41 units of surplus allows instant pre-coordination with local NGO food banks!</span>
            </div>
          </div>
        </div>
      </section>

      {/* DONOR VS ACCEPTOR REGISTRATION SECTION (SCROLL TARGET) */}
      <section id="register-section" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">Two Purpose-Built Portals</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Get Started: Register Your Organization</h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Select your organization role below to create a dedicated profile and join the food redistribution network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* DONOR PORTAL CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Register as Food Donor</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Restaurants, Hotels, College Canteens, Hostels, Event Organizers, and Cafeterias.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> AI Surplus Forecasting & Redistribution Trends</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> One-Click Food Surplus Listing Creation</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> Real-time Acceptor Request Approval</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> Automated Pickup Tracking & CSR Reports</li>
              </ul>
            </div>

            <button
              onClick={() => onNavigate("/register/donor")}
              className="btn btn-primary w-full py-3.5"
            >
              Register as Food Donor
            </button>
          </div>

          {/* ACCEPTOR PORTAL CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Register as Food Acceptor</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                NGOs, Food Banks, Charitable Shelters, and Community Redistribution Organizations.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" /> Nearby Surplus Food Map & Radius Filters</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" /> Explainable Smart Match Scoring Algorithm</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" /> Instant Request Submission & Schedule Tracking</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" /> Community Meals Distribution Metrics</li>
              </ul>
            </div>

            <button
              onClick={() => onNavigate("/register/acceptor")}
              className="btn btn-secondary w-full py-3.5"
            >
              Register as Food Acceptor
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-12 px-4 text-center text-xs">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-2 text-white font-bold text-base">
            <Leaf className="w-5 h-5 text-emerald-500" />
            NourishSync Redistribution Platform
          </div>
          <p>© 2026 AI-Driven Food Surplus Prediction & Smart Redistribution System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
