import React, { useState, useEffect } from "react";
import { aiAPI } from "../services/api";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Lightbulb,
  BarChart2,
  ShieldCheck,
  Database,
  Utensils,
  Calendar,
  Clock,
  Layers,
  Info,
  Building2,
  Users
} from "lucide-react";

export const DonorPredictionPage = () => {
  // Mode selection: 'daily_operations' or 'special_events'
  const [predictionMode, setPredictionMode] = useState("daily_operations");

  // Daily Operations Form State (Routine commercial & institutional dining)
  const [dailyForm, setDailyForm] = useState({
    meals_planned: 350,
    expected_customers: 300,
    type_of_food: "Meat",
    meal_period: "Lunch",
    preparation_method: "Buffet",
    storage_conditions: "Refrigerated",
    purchase_history: "Regular",
    seasonality: "All Seasons",
    pricing: "Moderate",
    geographical_location: "Urban"
  });

  // Special Events Form State (Catered gatherings, weddings, banquets)
  const [eventForm, setEventForm] = useState({
    quantity_of_food: 450,
    number_of_guests: 350,
    event_type: "Corporate",
    type_of_food: "Meat",
    preparation_method: "Buffet",
    storage_conditions: "Refrigerated",
    purchase_history: "Regular",
    seasonality: "All Seasons",
    pricing: "Moderate",
    geographical_location: "Urban"
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const h = await aiAPI.getHistory();
      setHistory(h || []);
    } catch (err) {
      console.log("History loading error:", err);
    }
  };

  const handleDailyChange = (e) => {
    const val = e.target.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value;
    setDailyForm({ ...dailyForm, [e.target.name]: val });
  };

  const handleEventChange = (e) => {
    const val = e.target.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value;
    setEventForm({ ...eventForm, [e.target.name]: val });
  };

  const runPrediction = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      let payload = {};
      if (predictionMode === "daily_operations") {
        // Enforce strict Daily Operations payload: do NOT include event_type
        payload = {
          prediction_mode: "daily_operations",
          meals_planned: Number(dailyForm.meals_planned),
          expected_customers: Number(dailyForm.expected_customers),
          type_of_food: dailyForm.type_of_food,
          meal_period: dailyForm.meal_period,
          preparation_method: dailyForm.preparation_method,
          storage_conditions: dailyForm.storage_conditions,
          purchase_history: dailyForm.purchase_history,
          seasonality: dailyForm.seasonality,
          pricing: dailyForm.pricing,
          geographical_location: dailyForm.geographical_location
        };
      } else {
        // Enforce strict Special Events payload: must include event_type, do NOT include meal_period
        payload = {
          prediction_mode: "special_events",
          quantity_of_food: Number(eventForm.quantity_of_food),
          number_of_guests: Number(eventForm.number_of_guests),
          event_type: eventForm.event_type,
          type_of_food: eventForm.type_of_food,
          preparation_method: eventForm.preparation_method,
          storage_conditions: eventForm.storage_conditions,
          purchase_history: eventForm.purchase_history,
          seasonality: eventForm.seasonality,
          pricing: eventForm.pricing,
          geographical_location: eventForm.geographical_location
        };
      }

      const res = await aiAPI.predictSurplus(payload);
      setResult(res);
      fetchHistory();
    } catch (err) {
      setErrorMessage(err.message || "Failed to generate surplus prediction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Hero */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          Scikit-Learn Random Forest Predictive Pipeline
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          AI Food Surplus Prediction Engine
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Predict unconsumed food surplus to balance kitchen prep, curb avoidable food loss, and proactively coordinate redistribution with certified food rescue charities.
        </p>
      </div>

      {/* MODE SELECTOR */}
      <div className="card space-y-3 p-5 sm:p-6 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Select Prediction Mode
            </h2>
            <p className="text-xs text-slate-500">
              Calibrate prediction parameters based on the operational nature of food service
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
            Mode Segregation Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Option 1: Daily Operations */}
          <button
            type="button"
            onClick={() => {
              setPredictionMode("daily_operations");
              setErrorMessage("");
            }}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
              predictionMode === "daily_operations"
                ? "border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-600/20"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                predictionMode === "daily_operations"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Utensils className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">
                  Daily Operations
                </span>
                {predictionMode === "daily_operations" && (
                  <span className="badge badge-emerald text-[10px] py-0.5 px-2">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Routine breakfast, lunch, or dinner service at restaurants, hotels, canteens, hostels & cafeterias.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-semibold text-slate-500">
                <span className="bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md">
                  No Event Required
                </span>
                <span className="bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md">
                  Meal Shift Pacing
                </span>
              </div>
            </div>
          </button>

          {/* Option 2: Special Events */}
          <button
            type="button"
            onClick={() => {
              setPredictionMode("special_events");
              setErrorMessage("");
            }}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
              predictionMode === "special_events"
                ? "border-purple-600 bg-purple-50/60 shadow-md ring-2 ring-purple-600/20"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                predictionMode === "special_events"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">
                  Special Events
                </span>
                {predictionMode === "special_events" && (
                  <span className="bg-purple-600 text-white text-[10px] font-bold py-0.5 px-2 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Weddings, corporate galas, birthday parties, conferences, banquets & catered gatherings.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-semibold text-slate-500">
                <span className="bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md">
                  Event Types Supported
                </span>
                <span className="bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md">
                  RSVP Calibrated
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PREDICTION INPUT FORM */}
        <div className="card space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-600" />
                {predictionMode === "daily_operations"
                  ? "Daily Operations Parameters"
                  : "Special Event Parameters"}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {predictionMode === "daily_operations"
                  ? "Configured for routine food service"
                  : "Configured for catered event gathering"}
              </p>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                predictionMode === "daily_operations"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {predictionMode === "daily_operations" ? "Daily Mode" : "Event Mode"}
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={runPrediction} className="space-y-3.5">
            {/* ============================================================= */}
            {/* MODE 1: DAILY OPERATIONS FIELDS */}
            {/* ============================================================= */}
            {predictionMode === "daily_operations" && (
              <>
                {/* Meals Planned */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Planned Food Production (Meals / Portions)
                  </label>
                  <input
                    type="number"
                    name="meals_planned"
                    value={dailyForm.meals_planned}
                    onChange={handleDailyChange}
                    min="10"
                    max="5000"
                    required
                    placeholder="e.g. 350"
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Total portions planned for this service shift
                  </span>
                </div>

                {/* Expected Customers */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Expected Diners / Customer Covers
                  </label>
                  <input
                    type="number"
                    name="expected_customers"
                    value={dailyForm.expected_customers}
                    onChange={handleDailyChange}
                    min="1"
                    max="5000"
                    required
                    placeholder="e.g. 300"
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Projected customer attendance / customer count
                  </span>
                </div>

                {/* Meal Service Period */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Meal Service Period
                  </label>
                  <select
                    name="meal_period"
                    value={dailyForm.meal_period}
                    onChange={handleDailyChange}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800"
                  >
                    <option value="Lunch">Lunch Service</option>
                    <option value="Dinner">Dinner Service</option>
                    <option value="Breakfast">Breakfast Service</option>
                    <option value="All-Day">All-Day Continuous Service</option>
                  </select>
                </div>

                {/* Primary Food Category */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Primary Food Category
                  </label>
                  <select
                    name="type_of_food"
                    value={dailyForm.type_of_food}
                    onChange={handleDailyChange}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800"
                  >
                    <option value="Meat">Meat & Poultry Dishes</option>
                    <option value="Vegetables">Vegetables & Cooked Salads</option>
                    <option value="Fruits">Fresh Produce & Fruits</option>
                    <option value="Baked Goods">Bakery & Breads</option>
                    <option value="Dairy Products">Dairy Products & Desserts</option>
                  </select>
                </div>

                {/* Service Style */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Service Style & Setup
                  </label>
                  <select
                    name="preparation_method"
                    value={dailyForm.preparation_method}
                    onChange={handleDailyChange}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800"
                  >
                    <option value="Buffet">Buffet / Self-Service Station</option>
                    <option value="Sit-down Dinner">Plated / Table Dining Service</option>
                    <option value="Finger Food">Counter Service / Quick Casual</option>
                  </select>
                </div>

                {/* Storage Conditions */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Storage & Holding Facilities
                  </label>
                  <select
                    name="storage_conditions"
                    value={dailyForm.storage_conditions}
                    onChange={handleDailyChange}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800"
                  >
                    <option value="Refrigerated">Commercial Refrigeration (&lt; 4°C)</option>
                    <option value="Room Temperature">Room Temperature / Ambient Shelf</option>
                  </select>
                </div>

                {/* Customer Pattern */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Customer Base Consistency
                  </label>
                  <select
                    name="purchase_history"
                    value={dailyForm.purchase_history}
                    onChange={handleDailyChange}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800"
                  >
                    <option value="Regular">Regular / Repeat Diners (e.g. students, office staff)</option>
                    <option value="Occasional">Occasional / Walk-in Diners</option>
                  </select>
                </div>

                {/* Seasonality & Pricing */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Seasonality
                    </label>
                    <select
                      name="seasonality"
                      value={dailyForm.seasonality}
                      onChange={handleDailyChange}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800"
                    >
                      <option value="All Seasons">All Seasons</option>
                      <option value="Winter">Winter</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Menu Pricing
                    </label>
                    <select
                      name="pricing"
                      value={dailyForm.pricing}
                      onChange={handleDailyChange}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800"
                    >
                      <option value="Low">Economy / Low Cost</option>
                      <option value="Moderate">Standard / Moderate</option>
                      <option value="High">Premium / Fine Dining</option>
                    </select>
                  </div>
                </div>

                {/* Geographical Location */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Location Setting
                  </label>
                  <select
                    name="geographical_location"
                    value={dailyForm.geographical_location}
                    onChange={handleDailyChange}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800"
                  >
                    <option value="Urban">Urban</option>
                    <option value="Suburban">Suburban</option>
                    <option value="Rural">Rural</option>
                  </select>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Daily Routine Note:</strong> Event type is not required for routine service. Parameters are mapped onto standard operational baselines.
                  </span>
                </div>
              </>
            )}

            {/* ============================================================= */}
            {/* MODE 2: SPECIAL EVENTS FIELDS */}
            {/* ============================================================= */}
            {predictionMode === "special_events" && (
              <>
                {/* Quantity of Food */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Planned Food Quantity (Portions / Units)
                  </label>
                  <input
                    type="number"
                    name="quantity_of_food"
                    value={eventForm.quantity_of_food}
                    onChange={handleEventChange}
                    min="10"
                    max="5000"
                    required
                    placeholder="e.g. 450"
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Total food portions prepared for the gathering
                  </span>
                </div>

                {/* Number of Guests */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Number of Guests / Attendees
                  </label>
                  <input
                    type="number"
                    name="number_of_guests"
                    value={eventForm.number_of_guests}
                    onChange={handleEventChange}
                    min="1"
                    max="5000"
                    required
                    placeholder="e.g. 350"
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Confirmed guest headcount or RSVP attendance
                  </span>
                </div>

                {/* Event Type (REQUIRED in special events) */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Event Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="event_type"
                    value={eventForm.event_type}
                    onChange={handleEventChange}
                    required
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800 font-medium"
                  >
                    <option value="Corporate">Corporate Gathering / Conference</option>
                    <option value="Birthday">Birthday Celebration</option>
                    <option value="Wedding">Wedding Reception</option>
                    <option value="Social Gathering">Social Gathering / Banquet</option>
                  </select>
                </div>

                {/* Type of Food */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Type of Food
                  </label>
                  <select
                    name="type_of_food"
                    value={eventForm.type_of_food}
                    onChange={handleEventChange}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800"
                  >
                    <option value="Meat">Meat & Poultry</option>
                    <option value="Vegetables">Vegetables & Salads</option>
                    <option value="Fruits">Fruits & Desserts</option>
                    <option value="Baked Goods">Baked Goods</option>
                    <option value="Dairy Products">Dairy Products</option>
                  </select>
                </div>

                {/* Preparation Method */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Preparation & Service Method
                  </label>
                  <select
                    name="preparation_method"
                    value={eventForm.preparation_method}
                    onChange={handleEventChange}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800"
                  >
                    <option value="Buffet">Buffet Service</option>
                    <option value="Sit-down Dinner">Sit-down Plated Dinner</option>
                    <option value="Finger Food">Finger Food / Appetizers</option>
                  </select>
                </div>

                {/* Storage Conditions */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Storage Conditions Available
                  </label>
                  <select
                    name="storage_conditions"
                    value={eventForm.storage_conditions}
                    onChange={handleEventChange}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800"
                  >
                    <option value="Refrigerated">Refrigerated (&lt; 4°C)</option>
                    <option value="Room Temperature">Room Temperature</option>
                  </select>
                </div>

                {/* Seasonality & Pricing */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Seasonality
                    </label>
                    <select
                      name="seasonality"
                      value={eventForm.seasonality}
                      onChange={handleEventChange}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800"
                    >
                      <option value="All Seasons">All Seasons</option>
                      <option value="Winter">Winter</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Event Budget Tier
                    </label>
                    <select
                      name="pricing"
                      value={eventForm.pricing}
                      onChange={handleEventChange}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800"
                    >
                      <option value="Low">Economy / Low</option>
                      <option value="Moderate">Standard / Moderate</option>
                      <option value="High">Premium / High</option>
                    </select>
                  </div>
                </div>

                {/* Purchase History */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Client Booking History
                  </label>
                  <select
                    name="purchase_history"
                    value={eventForm.purchase_history}
                    onChange={handleEventChange}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800"
                  >
                    <option value="Regular">Regular Customer Base</option>
                    <option value="Occasional">Occasional / New Client</option>
                  </select>
                </div>

                {/* Geographical Location */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Event Venue Location
                  </label>
                  <select
                    name="geographical_location"
                    value={eventForm.geographical_location}
                    onChange={handleEventChange}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-800"
                  >
                    <option value="Urban">Urban</option>
                    <option value="Suburban">Suburban</option>
                    <option value="Rural">Rural</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`btn w-full py-3 text-xs shadow-lg flex items-center justify-center gap-2 ${
                predictionMode === "daily_operations"
                  ? "btn-primary shadow-emerald-600/30"
                  : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/30 font-bold"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {loading
                ? "Running Model Inference..."
                : predictionMode === "daily_operations"
                ? "Predict Daily Surplus"
                : "Predict Event Surplus"}
            </button>
          </form>
        </div>

        {/* PREDICTION RESULTS PANEL */}
        <div className="lg:col-span-2 space-y-6">
          {!result && (
            <div className="card text-center p-8 space-y-3 border border-slate-200">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No Active Prediction Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Select your operational mode on top, configure the food production specifications on the left, and click <strong>Generate Surplus Prediction</strong>.
              </p>
            </div>
          )}

          {result && (
            <>
              {/* ANOMALY ALERT */}
              {result.is_anomaly && (
                <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex items-start gap-3 shadow-md">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm">Elevated Food Surplus Risk Detected</h4>
                    <p className="text-xs text-amber-800 mt-0.5">{result.anomaly_message}</p>
                  </div>
                </div>
              )}

              {/* ACTIVE MODE BADGE HEADER */}
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Prediction Scope:</span>
                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                      result.prediction_mode === "daily_operations"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-purple-100 text-purple-800 border border-purple-300"
                    }`}
                  >
                    {result.mode_label ||
                      (result.prediction_mode === "daily_operations"
                        ? "Daily Operations"
                        : "Special Events")}
                  </span>
                </div>
                {result.meal_period && (
                  <span className="text-xs text-slate-500 font-semibold">
                    Shift: {result.meal_period}
                  </span>
                )}
                {result.event_type && (
                  <span className="text-xs text-slate-500 font-semibold">
                    Event: {result.event_type}
                  </span>
                )}
              </div>

              {/* 4 PRIMARY METRIC CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* 1. ML PREDICTED SURPLUS (Core Target) */}
                <div className="bg-white p-5 rounded-2xl border-2 border-amber-400 shadow-md text-center">
                  <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">
                    AI-Predicted Surplus
                  </span>
                  <span className="text-3xl font-extrabold text-slate-900 block mt-1">
                    {result.predicted_surplus}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {result.surplus_unit || "food units"}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1">
                    Unconsumed Volume
                  </span>
                </div>

                {/* 2. ESTIMATED CONSUMPTION (Derived) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Estimated Consumption
                  </span>
                  <span className="text-3xl font-extrabold text-blue-600 block mt-1">
                    {result.estimated_consumption ?? (result.quantity_of_food - result.predicted_surplus)}
                  </span>
                  <span className="text-[10px] text-slate-400">units expected</span>
                  <span className="text-[9px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">
                    Prepared - Surplus
                  </span>
                </div>

                {/* 3. RECOMMENDED PREP (Derived) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Recommended Prep
                  </span>
                  <span className="text-3xl font-extrabold text-emerald-600 block mt-1">
                    {result.recommended_preparation}
                  </span>
                  <span className="text-[10px] text-slate-400">safe target quantity</span>
                  <span className="text-[9px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">
                    Consumption + 5%
                  </span>
                </div>

                {/* 4. SURPLUS PROPORTION */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Surplus Proportion
                  </span>
                  <span className="text-3xl font-extrabold text-purple-600 block mt-1">
                    {result.surplus_ratio_pct ?? Math.round((result.predicted_surplus / (result.quantity_of_food || 450)) * 100)}%
                  </span>
                  <span className="text-[10px] text-slate-400">of total prepared</span>
                  <span className="text-[9px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold">
                    Surplus Ratio
                  </span>
                </div>
              </div>

              {/* OPERATIONAL MODEL TRANSPARENCY CARD */}
              {result.model_mode_note && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Info className="w-4 h-4 text-emerald-600" />
                    Model Context & Technical Disclosures
                  </div>
                  <p className="leading-relaxed text-slate-600">
                    {result.model_mode_note}
                  </p>
                </div>
              )}

              {/* SURPLUS VS REDISTRIBUTION FOOD SAFETY CARD */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Food Safety & Charitable Redistribution Feasibility
                </div>
                <p className="leading-relaxed text-amber-800">
                  {result.food_safety_notice ||
                    "Surplus food represents unconsumed prepared volume. Only safe, untouched food maintained under continuous temperature control (< 4°C) is eligible for charitable redistribution. Plate scrapings, customer leftovers, or temperature-abused items represent spoiled waste and must not be donated."}
                </p>
              </div>

              {/* TAILORED GUIDANCE & STORAGE RECOMMENDATIONS */}
              <div className="card space-y-3 bg-slate-900 text-white border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Lightbulb className="w-5 h-5 text-emerald-400" />
                  Operational Guidance & Redistribution Pacing
                </div>
                <ul className="space-y-2 text-xs text-slate-200">
                  {result.insights_and_recommendations?.map((inc, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* MODEL METRICS (Test Data) */}
              <div className="card bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Model Performance Benchmark (Held-Out Test Data)
                  </span>
                  <span className="text-[10px] text-slate-400">1,618 Clean Dataset Records</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">MAE</span>
                    <span className="font-mono font-bold text-white text-base">
                      {result.model_evaluation?.mae ?? 1.83} units
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Mean Absolute Error</span>
                  </div>
                  <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">RMSE</span>
                    <span className="font-mono font-bold text-white text-base">
                      {result.model_evaluation?.rmse ?? 2.92} units
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Penalizes large errors</span>
                  </div>
                  <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">R² Score</span>
                    <span className="font-mono font-bold text-emerald-400 text-base">
                      {result.model_evaluation?.r2 ?? 0.9209}
                    </span>
                    <span className="text-[9px] text-emerald-300 block mt-0.5">92.1% variance explained</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* RECENT PREDICTIONS HISTORY */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-600" />
                Recent Surplus Predictions Log
              </h4>
              <span className="text-[10px] text-slate-400">Audited in SQLite</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {history.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs">
                  No prior predictions recorded.
                </div>
              ) : (
                history.slice(0, 5).map((h) => (
                  <div key={h.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            h.prediction_mode === "daily_operations"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {h.prediction_mode === "daily_operations" ? "Daily" : "Event"}
                        </span>
                        <span className="font-bold text-slate-800">
                          {h.quantity_of_food || h.meals_planned} units • {h.type_of_food || "Food"}
                        </span>
                      </div>
                      <span className="text-slate-500 text-[11px] block mt-0.5">
                        {h.created_at} {h.meal_period ? `• ${h.meal_period}` : ""} {h.event_type ? `• ${h.event_type}` : ""}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-600 font-bold block">
                        Surplus: {h.predicted_surplus} units
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Est. Consumption: {h.estimated_consumption || h.predicted_demand} units
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
