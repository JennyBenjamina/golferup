"use client";

import { useState } from "react";
import { MapPin, ChevronDown, Navigation, X } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { LocationSearchModal } from "@/components/listings/LocationSearchModal";
import { cn } from "@/lib/utils";

export function LocationBar() {
  const { location, setLocation, clearLocation } = useLocation();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-2.5 gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                location
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                  : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
              )}
            >
              <MapPin className={cn("w-4 h-4", location ? "text-emerald-600" : "text-gray-400")} />
              {location ? (
                <>
                  <span>{location.label}</span>
                  <span className="text-emerald-500/70">·</span>
                  <span className="text-emerald-600/80">{location.radiusMiles} mi</span>
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-500" />
                </>
              ) : (
                <>
                  <span>Set your location</span>
                  <Navigation className="w-3.5 h-3.5" />
                </>
              )}
            </button>
            {location && (
              <button
                onClick={clearLocation}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Clear location"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <LocationSearchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onApply={(loc) => {
          setLocation(loc);
        }}
        initialLat={location?.lat}
        initialLng={location?.lng}
        initialLabel={location?.label}
        initialRadius={location?.radiusMiles}
      />
    </>
  );
}
