import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Search, ExternalLink, Check, Layers, Loader2 } from "lucide-react";

// Red Leaflet Pin for Selected Location
const selectedLocationIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to handle click events on the map
function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Helper component to smoothly re-center the map when coordinates change
function RecenterController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, Math.max(map.getZoom(), 14));
    }
  }, [center, map]);
  return null;
}

export const LocationPickerMap = ({
  latitude = 12.9716,
  longitude = 77.5946,
  onChange,
  addressHint = "",
  theme = "emerald" // "emerald" for donor, "blue" for acceptor
}) => {
  const [currentLat, setCurrentLat] = useState(Number(latitude) || 12.9716);
  const [currentLng, setCurrentLng] = useState(Number(longitude) || 77.5946);
  const [mapType, setMapType] = useState("google"); // "google", "satellite", or "osm"
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (latitude && longitude) {
      setCurrentLat(Number(latitude));
      setCurrentLng(Number(longitude));
    }
  }, [latitude, longitude]);

  const handleLocationSelect = (lat, lng) => {
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));
    setCurrentLat(roundedLat);
    setCurrentLng(roundedLng);
    setStatusMessage("Location selected on map!");

    if (onChange) {
      onChange({ latitude: roundedLat, longitude: roundedLng });
    }

    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setStatusMessage("Detecting your GPS location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleLocationSelect(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setStatusMessage("Could not retrieve GPS location. Please click on the map directly.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim() || addressHint.trim();
    if (!query) return;

    setSearching(true);
    setStatusMessage("Searching location...");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        handleLocationSelect(lat, lon);
        setStatusMessage(`Found: ${data[0].display_name.slice(0, 45)}...`);
      } else {
        setStatusMessage("Address not found. Please click directly on the map to pin your location.");
      }
    } catch (err) {
      console.error("Geocoding search error:", err);
      setStatusMessage("Search failed. Please click directly on the map.");
    } finally {
      setSearching(false);
    }
  };

  // Google Maps / OSM Tile Layer URLs
  const getTileUrl = () => {
    if (mapType === "google") {
      // Google Maps Standard Road Map
      return "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    } else if (mapType === "satellite") {
      // Google Maps Hybrid (Satellite + Roads)
      return "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
    } else {
      // OpenStreetMap fallback
      return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    }
  };

  const isEmerald = theme === "emerald";
  const accentColor = isEmerald ? "emerald" : "blue";

  return (
    <div className="space-y-2.5 pt-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <MapPin className={`w-4 h-4 text-${accentColor}-600`} />
          Select Pickup / Organization Location on Map *
        </label>
        <span className="text-[11px] text-slate-500 font-medium">
          Click anywhere or drag marker to set exact location
        </span>
      </div>

      {/* SEARCH & TOOLBAR */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <input
            type="text"
            placeholder="Search city, area, or street on map..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            className="w-full pl-8 pr-16 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className={`absolute right-1 top-1 px-2.5 py-1 text-[10px] font-bold rounded-lg text-white ${
              isEmerald ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : "Search"}
          </button>
        </div>

        {/* GPS Button */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 bg-white shadow-sm transition-colors"
          title="Use Device GPS Location"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-600" />
          <span>My GPS</span>
        </button>

        {/* Layer Switcher (Google Maps / Satellite / OSM) */}
        <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-100 text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => setMapType("google")}
            className={`px-2 py-1 rounded-lg transition-all ${
              mapType === "google" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Google Map
          </button>
          <button
            type="button"
            onClick={() => setMapType("satellite")}
            className={`px-2 py-1 rounded-lg transition-all ${
              mapType === "satellite" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapType("osm")}
            className={`px-2 py-1 rounded-lg transition-all ${
              mapType === "osm" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            OSM
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="text-[11px] text-slate-600 bg-slate-100 px-3 py-1 rounded-lg animate-fade-in flex items-center gap-1.5">
          <Check className="w-3 h-3 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* INTERACTIVE MAP CONTAINER */}
      <div className="w-full h-64 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner relative z-10">
        <MapContainer
          center={[currentLat, currentLng]}
          zoom={14}
          scrollWheelZoom={false}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            key={mapType}
            url={getTileUrl()}
            attribution={mapType.includes("google") ? "&copy; Google Maps" : "&copy; OpenStreetMap contributors"}
          />

          <RecenterController center={[currentLat, currentLng]} />
          <MapClickHandler onSelect={handleLocationSelect} />

          <Marker
            position={[currentLat, currentLng]}
            icon={selectedLocationIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                handleLocationSelect(position.lat, position.lng);
              }
            }}
          >
            <Popup>
              <div className="text-xs p-0.5 space-y-1 font-sans">
                <span className="font-bold text-slate-900 block">Selected Location Pin</span>
                <span className="text-slate-500 text-[11px] block">
                  Lat: {currentLat.toFixed(4)}, Lng: {currentLng.toFixed(4)}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  Drag pin or click map to move
                </span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* SELECTED COORDINATES BADGE & GOOGLE MAPS LINK */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Pinned Coordinates:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-900 font-bold">
            {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
            <Check className="w-3 h-3 text-emerald-600" /> Selected
          </span>
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
        >
          <span>Verify in Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
