"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, MapPin, Navigation, Loader2 } from "lucide-react";

interface LocationSearchModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (location: {
    lat: number;
    lng: number;
    label: string;
    radiusMiles: number;
  }) => void;
  initialLat?: number;
  initialLng?: number;
  initialLabel?: string;
  initialRadius?: number;
}

// Default: center of US
const DEFAULT_LAT = 37.0902;
const DEFAULT_LNG = -95.7129;
const DEFAULT_RADIUS = 25;

export function LocationSearchModal({
  open,
  onClose,
  onApply,
  initialLat,
  initialLng,
  initialLabel,
  initialRadius,
}: LocationSearchModalProps) {
  const [lat, setLat] = useState(initialLat ?? DEFAULT_LAT);
  const [lng, setLng] = useState(initialLng ?? DEFAULT_LNG);
  const [label, setLabel] = useState(initialLabel ?? "");
  const [radiusMiles, setRadiusMiles] = useState(initialRadius ?? DEFAULT_RADIUS);
  const [searchInput, setSearchInput] = useState(initialLabel ?? "");
  const [searching, setSearching] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const leafletRef = useRef<any>(null);

  // Load Leaflet dynamically (client only)
  useEffect(() => {
    if (!open) return;

    const loadLeaflet = async () => {
      if (leafletRef.current) return leafletRef.current;
      const L = (await import("leaflet")).default;

      // Fix default icon paths (leaflet CSS issue with bundlers)
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      leafletRef.current = L;
      return L;
    };

    const initMap = async () => {
      const L = await loadLeaflet();

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lng], getZoomForRadius(radiusMiles));
        updateCircle(L);
        return;
      }

      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: getZoomForRadius(radiusMiles),
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add marker
      markerRef.current = L.marker([lat, lng]).addTo(map);

      // Add radius circle
      circleRef.current = L.circle([lat, lng], {
        radius: milesToMeters(radiusMiles),
        color: "#10b981",
        fillColor: "#10b981",
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);

      // Click on map to set location
      map.on("click", async (e: any) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        setLat(newLat);
        setLng(newLng);

        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=10`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            "";
          const state = data.address?.state || "";
          const newLabel = city && state ? `${city}, ${state}` : data.display_name?.split(",").slice(0, 2).join(",") || "";
          setLabel(newLabel);
          setSearchInput(newLabel);
        } catch {
          // Ignore geocoding errors
        }
      });
    };

    // Inject Leaflet CSS if not already present
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }

    const timer = setTimeout(initMap, 100);
    return () => clearTimeout(timer);
  }, [open]);

  // Update map when lat/lng/radius changes
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = mapInstanceRef.current;

    map.setView([lat, lng], getZoomForRadius(radiusMiles));

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }

    updateCircle(L);
  }, [lat, lng, radiusMiles]);

  function updateCircle(L: any) {
    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(milesToMeters(radiusMiles));
    }
  }

  // Geocode search input via Nominatim
  const geocodeSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&countrycodes=us&limit=5`
      );
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => geocodeSearch(value), 400);
  };

  const selectSuggestion = (s: { display_name: string; lat: string; lon: string }) => {
    const newLat = parseFloat(s.lat);
    const newLng = parseFloat(s.lon);
    setLat(newLat);
    setLng(newLng);
    // Clean up the display name to "City, State" format
    const parts = s.display_name.split(",").map((p) => p.trim());
    const short = parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : parts[0];
    setLabel(short);
    setSearchInput(short);
    setShowSuggestions(false);
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setLat(newLat);
        setLng(newLng);

        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=10`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            "";
          const state = data.address?.state || "";
          const newLabel = city && state ? `${city}, ${state}` : "Current Location";
          setLabel(newLabel);
          setSearchInput(newLabel);
        } catch {
          setLabel("Current Location");
          setSearchInput("Current Location");
        }
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
      }
    );
  };

  const handleApply = () => {
    onApply({ lat, lng, label: label || searchInput, radiusMiles });
    onClose();
  };

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        circleRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Set Location</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 pt-4 relative">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Enter city or zip code..."
              className="w-full pl-10 pr-12 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <button
              onClick={detectCurrentLocation}
              disabled={detectingLocation}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              title="Use my current location"
            >
              {detectingLocation ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 text-emerald-600" />
              )}
            </button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div className="absolute left-5 right-5 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 first:rounded-t-xl last:rounded-b-xl"
                >
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{s.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="px-5 pt-4">
          <div
            ref={mapRef}
            className="w-full h-56 rounded-xl overflow-hidden border border-gray-200"
            style={{ zIndex: 0 }}
          />
        </div>

        {/* Radius slider */}
        <div className="px-5 pt-5 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Search Radius</span>
            <span className="text-sm font-semibold text-emerald-600">
              {radiusMiles} mile{radiusMiles !== 1 ? "s" : ""}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={200}
            value={radiusMiles}
            onChange={(e) => setRadiusMiles(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1 mi</span>
            <span>200 mi</span>
          </div>
        </div>

        {/* Apply button */}
        <div className="px-5 py-4">
          <button
            onClick={handleApply}
            disabled={!label && !searchInput}
            className="w-full py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// Helpers
function milesToMeters(miles: number): number {
  return miles * 1609.34;
}

function getZoomForRadius(miles: number): number {
  if (miles <= 5) return 12;
  if (miles <= 10) return 11;
  if (miles <= 25) return 10;
  if (miles <= 50) return 9;
  if (miles <= 100) return 8;
  if (miles <= 200) return 7;
  return 6;
}
