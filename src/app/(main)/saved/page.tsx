"use client";

import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { ListingCard } from "@/components/listings/ListingCard";
import { Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SavedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const { data, isLoading } = trpc.savedListings.list.useQuery(undefined, {
    enabled: !!session,
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Saved Items</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
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

  const savedItems = data ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Saved Items
        {savedItems.length > 0 && (
          <span className="text-base font-normal text-gray-500 ml-2">
            ({savedItems.length})
          </span>
        )}
      </h1>

      {savedItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {savedItems.map(({ listing, seller }) => (
            <ListingCard
              key={listing.id}
              listing={{
                ...listing,
                createdAt: new Date(listing.createdAt),
              }}
              seller={seller}
              isSaved={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No saved items yet
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
            Tap the heart icon on any listing to save it here for later.
          </p>
          <Link
            href="/"
            className="inline-flex px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700"
          >
            Browse Listings
          </Link>
        </div>
      )}
    </div>
  );
}
