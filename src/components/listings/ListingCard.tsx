import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { formatPrice, formatCondition, timeAgo } from "@/lib/utils";

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: string;
    condition: string;
    images: string[];
    locationCity: string | null;
    locationState: string | null;
    createdAt: Date;
  };
  seller?: {
    name: string | null;
    image: string | null;
  };
}

export function ListingCard({ listing, seller }: ListingCardProps) {
  const primaryImage = listing.images?.[0];

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="w-12 h-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            // TODO: toggle save
          }}
          className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <Heart className="w-4 h-4 text-gray-600" />
        </button>
        <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
          {formatCondition(listing.condition)}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-lg font-bold text-gray-900">
          {formatPrice(listing.price)}
        </p>
        <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">
          {listing.title}
        </p>
        <div className="flex items-center justify-between mt-2">
          {listing.locationCity && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              {listing.locationCity}
              {listing.locationState ? `, ${listing.locationState}` : ""}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {timeAgo(listing.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
