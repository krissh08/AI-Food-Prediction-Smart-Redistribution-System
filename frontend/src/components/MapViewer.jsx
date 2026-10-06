import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom Leaflet Pin Icons
const donorIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const acceptorIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const foodIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const MapViewer = ({
  center = [12.9716, 77.5946],
  zoom = 12,
  markers = [],
  onRequestFood,
  height = "360px"
}) => {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-10" style={{ height }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ width: "100%", height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Center Point Marker */}
        <Marker position={center} icon={acceptorIcon}>
          <Popup>
            <div className="font-sans text-xs">
              <span className="font-bold text-slate-800 block">Your Organization Location</span>
              <span className="text-slate-500">Center for nearby search</span>
            </div>
          </Popup>
        </Marker>

        {/* Search Radius Circle (5km) */}
        <Circle center={center} radius={5000} pathOptions={{ color: '#059669', fillColor: '#10b981', fillOpacity: 0.08 }} />

        {/* Food Donation Markers */}
        {markers.map((m) => {
          const pos = [m.latitude || center[0] + 0.01, m.longitude || center[1] + 0.01];
          return (
            <Marker key={m.id} position={pos} icon={foodIcon}>
              <Popup>
                <div className="font-sans text-xs p-1 space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{m.food_name}</div>
                  <div className="text-emerald-700 font-semibold">{m.quantity} {m.unit || 'meals'} available</div>
                  <div className="text-slate-600">Donor: {m.donor_name}</div>
                  <div className="text-slate-500">Distance: {m.distance_km} km</div>
                  {m.match_score && (
                    <div className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
                      {m.match_score}% Match Score
                    </div>
                  )}
                  {onRequestFood && (
                    <button
                      onClick={() => onRequestFood(m)}
                      className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2 rounded text-[11px] transition-colors"
                    >
                      Request Food
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
