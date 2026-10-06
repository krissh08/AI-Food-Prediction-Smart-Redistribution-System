import React, { useState, useEffect } from "react";
import { acceptorAPI } from "../services/api";
import { MapViewer } from "../components/MapViewer";
import { Utensils, MapPin, Clock, Filter, Sparkles, CheckCircle2 } from "lucide-react";

export const AcceptorAvailableFoodPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  // Filters
  const [category, setCategory] = useState("All");
  const [dietaryType, setDietaryType] = useState("All");
  const [maxDistance, setMaxDistance] = useState(25);

  // Request Modal State
  const [selectedListing, setSelectedListing] = useState(null);
  const [requestedQuantity, setRequestedQuantity] = useState(50);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [category, dietaryType, maxDistance]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let params = `?max_distance_km=${maxDistance}`;
      if (category !== "All") params += `&category=${category}`;
      if (dietaryType !== "All") params += `&dietary_type=${dietaryType}`;

      const data = await acceptorAPI.getAvailableFood(params);
      setListings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openRequestModal = (listing) => {
    setSelectedListing(listing);
    setRequestedQuantity(listing.quantity);
    setNotes("");
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedListing) return;
    setSubmitting(true);
    try {
      await acceptorAPI.requestFood({
        food_listing_id: selectedListing.id,
        requested_quantity: parseInt(requestedQuantity),
        notes
      });
      alert(`Request submitted successfully to ${selectedListing.donor_organization}!`);
      setSelectedListing(null);
      fetchListings();
    } catch (err) {
      alert("Error submitting request: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Available Surplus Food Catalog</h1>
          <p className="text-xs text-slate-500">Discover nearby surplus food ranked by Smart Match Algorithm</p>
        </div>
        
        <button
          onClick={() => setShowMap(!showMap)}
          className="btn btn-outline text-xs"
        >
          <MapPin className="w-4 h-4 text-emerald-600" />
          {showMap ? "Hide Map View" : "Show Geographic Map"}
        </button>
      </div>

      {/* Map Drawer View */}
      {showMap && (
        <div className="card">
          <MapViewer markers={listings} onRequestFood={openRequestModal} height="350px" />
        </div>
      )}

      {/* FILTERS BAR */}
      <div className="card bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <Filter className="w-4 h-4" /> Smart Filters
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Cooked Meals">Cooked Meals</option>
              <option value="Bakery">Bakery</option>
              <option value="Packaged Food">Packaged Food</option>
              <option value="Buffet Items">Buffet Items</option>
              <option value="Dairy & Drinks">Dairy & Drinks</option>
            </select>
          </div>

          {/* Dietary Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Dietary:</span>
            <select
              value={dietaryType}
              onChange={(e) => setDietaryType(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 outline-none"
            >
              <option value="All">All Dietary Types</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Vegan">Vegan</option>
            </select>
          </div>

          {/* Distance Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Max Distance:</span>
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
              className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 outline-none"
            >
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
              <option value={25}>Within 25 km</option>
              <option value={50}>Within 50 km</option>
            </select>
          </div>
        </div>
      </div>

      {/* CATALOG CARDS GRID */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
          Filtering available food listings...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.length === 0 ? (
            <div className="col-span-full card p-12 text-center text-slate-400 text-xs">
              No food listings found matching selected filters.
            </div>
          ) : (
            listings.map((item) => (
              <div key={item.id} className="card card-hover space-y-4 flex flex-col justify-between">
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span className="badge badge-emerald">{item.category}</span>
                    <span className="badge badge-blue font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      {item.match_score || 90}% Match
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg mt-3">{item.food_name}</h3>
                  <span className="text-xs text-slate-500 font-semibold block">Donor: {item.donor_organization}</span>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-900">{item.quantity} {item.unit}</span> ({item.dietary_type})
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Expires: <strong className="text-amber-700">{item.expiry_time}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>Distance: <strong className="text-slate-900">{item.distance_km} km away</strong></span>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-slate-500 mt-3 bg-slate-50 p-2 rounded-xl italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Prep time: {item.preparation_time}</span>
                  <button
                    onClick={() => openRequestModal(item)}
                    className="btn btn-secondary btn-sm text-xs"
                  >
                    Request Food
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* REQUEST FOOD MODAL */}
      {selectedListing && (
        <div className="modal-overlay">
          <div className="modal-content space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Request Food Redistribution</h3>
              <button onClick={() => setSelectedListing(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs space-y-1 text-emerald-900">
              <div className="font-bold text-sm">{selectedListing.food_name}</div>
              <div>Donor: {selectedListing.donor_organization}</div>
              <div>Available Quantity: {selectedListing.quantity} {selectedListing.unit}</div>
              <div className="font-semibold text-emerald-700">Smart Match Score: {selectedListing.match_score}%</div>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Requested Quantity (meals) *</label>
                <input
                  type="number"
                  required
                  max={selectedListing.quantity}
                  value={requestedQuantity}
                  onChange={(e) => setRequestedQuantity(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Pickup & Distribution Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Estimated arrival time, vehicle transport details..."
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedListing(null)}
                  className="btn btn-outline w-1/2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-secondary w-1/2 text-xs"
                >
                  {submitting ? "Submitting Request..." : "Confirm Food Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
