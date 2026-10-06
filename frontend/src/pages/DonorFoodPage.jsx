import React, { useState, useEffect } from "react";
import { donorAPI } from "../services/api";
import { PlusCircle, Utensils, Clock, MapPin, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

export const DonorFoodPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    food_name: "",
    category: "Cooked Meals",
    quantity: 50,
    unit: "meals",
    preparation_time: "12:30 PM",
    expiry_time: "08:30 PM (in 4 hours)",
    dietary_type: "Vegetarian",
    pickup_address: "104 Tech Park Avenue, Central Campus",
    notes: "Fresh surplus meals hygienically stored."
  });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const data = await donorAPI.getFoodListings();
      setListings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await donorAPI.createFoodListing({
        ...form,
        quantity: parseInt(form.quantity)
      });
      setShowModal(false);
      fetchListings();
    } catch (err) {
      alert("Error publishing listing: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to cancel this food listing?")) {
      try {
        await donorAPI.deleteFoodListing(id);
        fetchListings();
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Food Listings</h1>
          <p className="text-xs text-slate-500">Manage active surplus food published for NGO redistribution</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary text-xs shadow-lg shadow-emerald-600/30"
        >
          <PlusCircle className="w-4 h-4" />
          Publish New Food Listing
        </button>
      </div>

      {/* LISTINGS GRID / TABLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((l) => (
          <div key={l.id} className="card card-hover space-y-4 relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="badge badge-emerald">{l.category}</span>
                <span className={`badge ${
                  l.status === 'AVAILABLE' ? 'badge-blue' : l.status === 'REQUESTED' ? 'badge-warning' : 'badge-slate'
                }`}>
                  {l.status}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-lg mt-3">{l.food_name}</h3>

              <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">{l.quantity} {l.unit}</span> ({l.dietary_type})
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Expires: {l.expiry_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{l.pickup_address}</span>
                </div>
              </div>

              {l.notes && (
                <p className="text-[11px] text-slate-500 mt-3 bg-slate-50 p-2 rounded-xl italic">
                  "{l.notes}"
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[10px]">ID #{l.id}</span>
              {l.status === 'AVAILABLE' && (
                <button
                  onClick={() => handleDelete(l.id)}
                  className="text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Cancel Listing
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Food Surplus Listing</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Food Name *</label>
                <input
                  type="text"
                  required
                  name="food_name"
                  value={form.food_name}
                  onChange={handleChange}
                  placeholder="e.g., Vegetable Biryani & Gravy"
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Food Category *</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="Cooked Meals">Cooked Meals</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Packaged Food">Packaged Food</option>
                    <option value="Buffet Items">Buffet Items</option>
                    <option value="Dairy & Drinks">Dairy & Drinks</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Dietary Preference</label>
                  <select
                    name="dietary_type"
                    value={form.dietary_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Unit</label>
                  <input
                    type="text"
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    placeholder="meals / kg / packets"
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Preparation Time</label>
                  <input
                    type="text"
                    name="preparation_time"
                    value={form.preparation_time}
                    onChange={handleChange}
                    placeholder="12:30 PM"
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Expiry / Best Before Time *</label>
                  <input
                    type="text"
                    required
                    name="expiry_time"
                    value={form.expiry_time}
                    onChange={handleChange}
                    placeholder="08:30 PM (in 4 hours)"
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Pickup Address *</label>
                <input
                  type="text"
                  required
                  name="pickup_address"
                  value={form.pickup_address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Additional Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Storage conditions, temperature requirements..."
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline w-1/2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary w-1/2 text-xs"
                >
                  Publish for Redistribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
