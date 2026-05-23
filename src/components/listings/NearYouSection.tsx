"use client";

import { useLocation } from "@/contexts/LocationContext";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { ListingCard } from "./ListingCard";
import { MapPin, ArrowRight, SearchX } from "lucide-react";
import Link from "next/link";

export function NearYouSection() {
  const { location } = useLocation();
  const { data: session } = useSession();

  // Primary query: items within the user's chosen radius
  const { data, isLoading } = trpc.search.search.useQuery(
    {
      query: "",
      locationLat: location?.lat,
      locationLng: location?.lng,
      radiusMiles: location?.radiusMiles,
      sortBy: "nearest",
      limit: 10,
    },
    { enabled: !!location }
  );

  const hasResults = !!data && data.hits.length > 0;

  // Fallback query: if nothing in radius, search up to 500 miles
  const { data: widerData, isLoading: widerLoading } = trpc.search.search.useQuery(
    {
      query: "",
      locationLat: location?.lat,
      locationLng: location?.lng,
      radiusMiles: 500,
      sortBy: "nearest",
      limit: 10,
    },
    { enabled: !!location && !isLoading && !hasResults }
  );

  // Determine which hits to display
  const displayHits = hasResults ? data.hits : (widerData?.hits ?? []);

  // Check which results are saved
  const hitIds = displayHits.map((h: any) => h.id);
  const { data: savedData } = trpc.savedListings.checkSaved.useQuery(
    { listingIds: hitIds },
    { enabled: !!session && hitIds.length > 0 }
  );
  const savedIds = new Set(savedData?.savedIds ?? []);

  if (!location) return null;

  // Loading state
  if (isLoading || (!hasResults && widerLoading)) {
    return (
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">Near You</h2>
            <span className="text-sm text-gray-500">
              within {location.radiusMiles} mi of {location.label}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-xl" />
              <div className="mt-3 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Both queries returned nothing — no listings anywhere nearby
  if (!hasResults && displayHits.length === 0) {
    return (
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl font-bold text-gray-900">Near You</h2>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <SearchX className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-base font-medium text-amber-800">
            No items for sale near {location.label}
          </p>
          <p className="text-sm text-amber-600 mt-1">
            There are no listings within 500 miles of your location yet. Check back soon or browse all listings below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <MapPin className="w-5 h-5 text-emerald-600" />
          {hasResults ? (
            <>
              <h2 className="text-xl font-bold text-gray-900">Near You</h2>
              <span className="text-sm text-gray-500">
                within {location.radiusMiles} mi of {location.label}
              </span>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900">
                0 items in {location.label}
              </h2>
            </>
          )}
        </div>
        {hasResults && (
          <Link
            href={`/search?lat=${location.lat}&lng=${location.lng}&radius=${location.radiusMiles}&label=${encodeURIComponent(location.label)}`}
            className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors shrink-0"
          >
            See all
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Empty-in-radius notice — shown when we're falling back to wider results */}
      {!hasResults && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 flex items-start gap-3">
          <SearchX className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              No items for sale within {location.radiusMiles} miles of {location.label}
            </p>
            <p className="text-sm text-amber-600 mt-0.5">
              Here are the closest listings we found:
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {displayHits.map((hit: any) => (
          <ListingCard
            key={hit.id}
            listing={{
              id: hit.id,
              title: hit.title,
              price: String(hit.price),
              condition: hit.condition,
              images: hit.images,
              locationCity: hit.locationCity,
              locationState: hit.locationState,
              createdAt: new Date(hit.createdAt),
            }}
            seller={{
              name: hit.sellerName,
              image: hit.sellerImage,
            }}
            isSaved={savedIds.has(hit.id)}
            distanceMiles={hit.distanceMiles}
          />
        ))}
      </div>
    </div>
  );
}
