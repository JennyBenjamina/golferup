"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import {
  SearchFilters,
  type SearchFilterValues,
} from "@/components/listings/SearchFilters";
import { ListingCard } from "@/components/listings/ListingCard";
import { Search, Bookmark, Loader2 } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const initialQuery = searchParams.get("q") ?? "";
  const initialCategory = searchParams.get("category") ?? undefined;

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilterValues>({
    category: initialCategory,
    sortBy: "relevance",
  });
  const [saveSearchName, setSaveSearchName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const { data, isLoading } = trpc.search.search.useQuery({
    query,
    ...filters,
    hand: filters.hand,
  });

  const saveSearch = trpc.savedSearches.create.useMutation({
    onSuccess: () => {
      setShowSaveDialog(false);
      setSaveSearchName("");
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (filters.category) params.set("category", filters.category);
    router.push(`/search?${params.toString()}`);
  };

  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) return;
    saveSearch.mutate({
      name: saveSearchName,
      query: query || undefined,
      category: filters.category,
      condition: filters.condition,
      brand: filters.brand,
      hand: filters.hand,
      priceMin: filters.priceMin?.toString(),
      priceMax: filters.priceMax?.toString(),
      locationState: filters.locationState,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for clubs, bags, apparel..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </form>

      {/* Filters */}
      <div className="mb-6">
        <SearchFilters
          values={filters}
          onChange={setFilters}
          totalResults={data?.totalHits ?? 0}
        />
      </div>

      {/* Save search button */}
      {session && (query || Object.values(filters).some((v) => v && v !== "relevance")) && (
        <div className="mb-6">
          {showSaveDialog ? (
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                placeholder="Name this search..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              <button
                onClick={handleSaveSearch}
                disabled={saveSearch.isPending}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {saveSearch.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
            >
              <Bookmark className="w-4 h-4" />
              Save this search
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
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
      ) : data && data.hits.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.hits.map((hit) => (
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
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No results found
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
        </div>
      )}

      {/* Search metadata */}
      {data && data.hits.length > 0 && (
        <p className="text-center text-xs text-gray-400 mt-8">
          {data.totalHits.toLocaleString()} results in {data.processingTimeMs}ms
        </p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
