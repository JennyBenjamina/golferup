"use client";

import { use, useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { Star, MapPin, Calendar, Trash2, Pencil, Loader2 } from "lucide-react";
import { ListingCard } from "@/components/listings/ListingCard";
import Link from "next/link";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const isOwn = session?.user?.id === id;
  const utils = trpc.useUtils();
  const { data: user, isLoading: userLoading } =
    trpc.users.getProfile.useQuery({ id });
  const { data: userListings, isLoading: listingsLoading } =
    isOwn
      ? trpc.listings.myListings.useQuery()
      : trpc.listings.byUser.useQuery({ userId: id });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteListing = trpc.listings.delete.useMutation({
    onSuccess: () => {
      setDeletingId(null);
      utils.listings.myListings.invalidate();
      utils.listings.byUser.invalidate({ userId: id });
    },
  });

  if (userLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 bg-gray-200 rounded-full" />
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-40" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">User not found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile header */}
      <div className="flex items-start gap-4 mb-8">
        {user.image ? (
          <img src={user.image} alt="" className="w-20 h-20 rounded-full" />
        ) : (
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-emerald-700">
              {(user.nickname ?? user.name)?.charAt(0) ?? "?"}
            </span>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.nickname ?? user.name ?? "Anonymous"}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              {user.ratingAvg ?? "0"} ({user.ratingCount ?? 0} reviews)
            </span>
            {user.locationCity && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {user.locationCity}
                {user.locationState ? `, ${user.locationState}` : ""}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Joined{" "}
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          {user.bio && (
            <p className="text-sm text-gray-700 mt-3 max-w-lg">{user.bio}</p>
          )}
        </div>
      </div>

      {/* User's listings */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Listings ({userListings?.length ?? 0})
        </h2>
        {listingsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-xl" />
                <div className="mt-3 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-20" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : userListings && userListings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {userListings.map((listing) => (
              <div key={listing.id} className="relative group">
                <ListingCard listing={listing} />
                {isOwn && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/sell?edit=${listing.id}`}
                      className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white border border-gray-200"
                    >
                      <Pencil className="w-3.5 h-3.5 text-gray-600" />
                    </Link>
                    {deletingId === listing.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteListing.mutate({ id: listing.id })}
                          disabled={deleteListing.isPending}
                          className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          {deleteListing.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Delete"
                          )}
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1 bg-white text-gray-600 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(listing.id)}
                        className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-red-50 border border-gray-200"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    )}
                  </div>
                )}
                {isOwn && listing.status !== "active" && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-900/70 text-white">
                    {listing.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No listings yet.</p>
        )}
      </div>
    </div>
  );
}
