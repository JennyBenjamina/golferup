"use client";

import { use, Suspense } from "react";
import { trpc } from "@/lib/trpc";
import { ListingCard } from "@/components/listings/ListingCard";
import { formatCategory } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const categoryDescriptions: Record<string, string> = {
  drivers:
    "Find the latest drivers from TaylorMade, Callaway, Titleist, and more. New and used drivers at great prices.",
  woods:
    "Fairway woods and utility woods from top brands. Get more distance off the deck.",
  hybrids:
    "Hybrid clubs that blend the best of irons and woods. Easy to hit, great for approach shots.",
  irons:
    "Iron sets and individual irons. From game-improvement to blades, find your perfect set.",
  wedges:
    "Gap wedges, sand wedges, and lob wedges. Dial in your short game with premium wedges.",
  putters:
    "Blade putters, mallet putters, and everything in between. Find the flat stick that fits your stroke.",
  complete_sets:
    "Full golf club sets for beginners and experienced players alike. Everything you need in one package.",
  bags:
    "Stand bags, cart bags, staff bags, and travel bags. Carry your clubs in style.",
  push_carts:
    "Push carts and pull carts for walking the course. Save your energy for your swing.",
  rangefinders:
    "Laser rangefinders and GPS devices. Know your exact distance to the pin.",
  gps_devices:
    "Golf GPS watches and handheld units. Course maps and distance tracking on your wrist.",
  apparel:
    "Golf polos, pants, shorts, jackets, and outerwear. Look good on the course.",
  shoes:
    "Golf shoes from FootJoy, Nike, Adidas, and more. Spiked and spikeless options.",
  gloves: "Golf gloves for men, women, and juniors. Get a better grip on your game.",
  balls:
    "New and used golf balls. Pro V1, Chrome Soft, TP5, and more at discounted prices.",
  accessories:
    "Headcovers, towels, tees, markers, divot tools, and more golf accessories.",
  training_aids:
    "Swing trainers, putting mats, alignment sticks, and other practice tools.",
};

function CategoryContent({ slug }: { slug: string }) {
  const { data, isLoading } = trpc.listings.feed.useQuery({
    category: slug,
    limit: 20,
  });

  const displayName = formatCategory(slug);
  const description =
    categoryDescriptions[slug] ?? `Browse ${displayName.toLowerCase()} listings.`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-emerald-600">
          Home
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 font-medium">{displayName}</span>
      </nav>

      {/* Category header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {displayName}
        </h1>
        <p className="text-gray-600 max-w-2xl">{description}</p>
      </div>

      {/* Quick filter links */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={`/search?category=${slug}&sortBy=newest`}
          className="px-3 py-1.5 text-sm bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
        >
          Newest
        </Link>
        <Link
          href={`/search?category=${slug}&sortBy=price_asc`}
          className="px-3 py-1.5 text-sm bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
        >
          Lowest Price
        </Link>
        <Link
          href={`/search?category=${slug}&condition=new`}
          className="px-3 py-1.5 text-sm bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
        >
          New Only
        </Link>
        <Link
          href={`/search?category=${slug}&condition=like_new`}
          className="px-3 py-1.5 text-sm bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
        >
          Like New
        </Link>
      </div>

      {/* Listings grid */}
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
      ) : data && data.listings.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.listings.map(({ listing, seller }) => (
            <ListingCard key={listing.id} listing={listing} seller={seller} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No {displayName.toLowerCase()} listed yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Be the first to list {displayName.toLowerCase()} for sale!
          </p>
          <Link
            href="/sell"
            className="inline-flex px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700"
          >
            List Yours
          </Link>
        </div>
      )}
    </div>
  );
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <Suspense>
      <CategoryContent slug={slug} />
    </Suspense>
  );
}
