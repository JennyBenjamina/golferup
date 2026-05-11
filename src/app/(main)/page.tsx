"use client";

import { Suspense } from "react";
import { CategoryBar } from "@/components/layout/CategoryBar";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { trpc } from "@/lib/trpc";
import { useSearchParams } from "next/navigation";

function ListingFeed() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? undefined;

  const { data, isLoading } = trpc.listings.feed.useQuery({
    category,
    limit: 20,
  });

  if (isLoading) {
    return (
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
    );
  }

  return <ListingGrid listings={data?.listings ?? []} />;
}

export default function HomePage() {
  return (
    <>
      <Suspense>
        <CategoryBar />
      </Suspense>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Buy &amp; Sell Golf Gear
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Join the community of golf enthusiasts. Find great deals on clubs,
            bags, apparel, and everything golf.
          </p>
        </div>
        <Suspense>
          <ListingFeed />
        </Suspense>
      </div>
    </>
  );
}
