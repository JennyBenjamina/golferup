"use client";

import { useLocation } from "@/contexts/LocationContext";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { ListingCard } from "./ListingCard";
import { MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";

export function NearYouSection() {
  const { location } = useLocation();
  const { data: session } = useSession();

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

  // Check which results are saved
  const hitIds = data?.hits?.map((h) => h.id) ?? [];
  const { data: savedData } = trpc.savedListings.checkSaved.useQuery(
    { listingIds: hitIds },
    { enabled: !!session && hitIds.length > 0 }
  );
  const savedIds = new Set(savedData?.savedIds ?? []);

  if (!location) return null;
  if (isLoading) {
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

  if (!data || data.hits.length === 0) return null;

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
        <Link
          href={`/search?lat=${location.lat}&lng=${location.lng}&radius=${location.radiusMiles}&label=${encodeURIComponent(location.label)}`}
          className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          See all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data.hits.map((hit: any) => (
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
