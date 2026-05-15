"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
  label: string;
  radiusMiles: number;
}

interface LocationContextType {
  location: UserLocation | null;
  setLocation: (location: UserLocation | null) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType>({
  location: null,
  setLocation: () => {},
  clearLocation: () => {},
});

const STORAGE_KEY = "golferup_location";

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<UserLocation | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.lat && parsed.lng) {
          setLocationState(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const setLocation = (loc: UserLocation | null) => {
    setLocationState(loc);
    if (loc) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearLocation = () => setLocation(null);

  return (
    <LocationContext.Provider value={{ location, setLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
