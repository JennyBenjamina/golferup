import { ListingCard } from "./ListingCard";

interface ListingGridProps {
  listings: Array<{
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
    seller: {
      name: string | null;
      image: string | null;
    };
  }>;
}

export function ListingGrid({ listings }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No listings yet
        </h3>
        <p className="text-sm text-gray-500">
          Be the first to list something for sale!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {listings.map(({ listing, seller }) => (
        <ListingCard key={listing.id} listing={listing} seller={seller} />
      ))}
    </div>
  );
}
