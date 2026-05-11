"use client";

import { trpc } from "@/lib/trpc";
import { Bookmark, Bell, BellOff, Trash2, Search } from "lucide-react";
import Link from "next/link";

export default function SavedSearchesPage() {
  const { data: searches, isLoading } = trpc.savedSearches.list.useQuery();
  const utils = trpc.useUtils();

  const toggleNotify = trpc.savedSearches.toggleNotify.useMutation({
    onSuccess: () => utils.savedSearches.list.invalidate(),
  });

  const deleteSearch = trpc.savedSearches.delete.useMutation({
    onSuccess: () => utils.savedSearches.list.invalidate(),
  });

  const buildSearchUrl = (search: NonNullable<typeof searches>[number]) => {
    const params = new URLSearchParams();
    if (search.query) params.set("q", search.query);
    if (search.category) params.set("category", search.category);
    return `/search?${params.toString()}`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saved Searches</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-200 h-16 rounded-xl"
            />
          ))}
        </div>
      ) : searches && searches.length > 0 ? (
        <div className="space-y-3">
          {searches.map((search) => (
            <div
              key={search.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
            >
              <Link
                href={buildSearchUrl(search)}
                className="flex-1 min-w-0"
              >
                <p className="font-medium text-gray-900 truncate">
                  {search.name}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {search.query && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                      &quot;{search.query}&quot;
                    </span>
                  )}
                  {search.category && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                      {search.category.replace(/_/g, " ")}
                    </span>
                  )}
                  {search.brand && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                      {search.brand}
                    </span>
                  )}
                  {search.condition && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                      {search.condition.replace(/_/g, " ")}
                    </span>
                  )}
                  {(search.priceMin || search.priceMax) && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                      ${search.priceMin ?? 0} – ${search.priceMax ?? "∞"}
                    </span>
                  )}
                </div>
              </Link>
              <div className="flex items-center gap-1 ml-4 shrink-0">
                <button
                  onClick={() =>
                    toggleNotify.mutate({
                      id: search.id,
                      enabled: !search.notifyEnabled,
                    })
                  }
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                  title={
                    search.notifyEnabled
                      ? "Notifications on"
                      : "Notifications off"
                  }
                >
                  {search.notifyEnabled ? (
                    <Bell className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <BellOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => deleteSearch.mutate({ id: search.id })}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No saved searches
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
            Save a search from the search page to get notified when new listings
            match your criteria.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700"
          >
            <Search className="w-4 h-4" />
            Start Searching
          </Link>
        </div>
      )}
    </div>
  );
}
