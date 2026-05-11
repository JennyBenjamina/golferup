import { Meilisearch } from "meilisearch";

const LISTINGS_INDEX = "listings";

export const meili = new Meilisearch({
  host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_API_KEY || "",
});

// Configure the listings index with searchable attributes and filters
export async function configureMeilisearchIndex() {
  const index = meili.index(LISTINGS_INDEX);

  await index.updateSettings({
    searchableAttributes: [
      "title",
      "description",
      "brand",
      "model",
      "category",
    ],
    filterableAttributes: [
      "category",
      "condition",
      "brand",
      "hand",
      "status",
      "price",
      "locationState",
      "locationCity",
      "_geo",
    ],
    sortableAttributes: ["price", "createdAt", "_geo"],
    displayedAttributes: [
      "id",
      "title",
      "price",
      "condition",
      "category",
      "brand",
      "model",
      "hand",
      "flex",
      "loft",
      "images",
      "locationCity",
      "locationState",
      "createdAt",
      "sellerId",
      "sellerName",
      "sellerImage",
      "sellerRatingAvg",
    ],
  });

  return index;
}

// Shape a listing record for Meilisearch
export interface MeiliListing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  condition: string;
  category: string;
  brand: string | null;
  model: string | null;
  hand: string | null;
  flex: string | null;
  loft: string | null;
  images: string[];
  locationCity: string | null;
  locationState: string | null;
  _geo?: { lat: number; lng: number };
  status: string;
  createdAt: number; // unix timestamp for sorting
  sellerId: string;
  sellerName: string | null;
  sellerImage: string | null;
  sellerRatingAvg: string | null;
}

// Add or update listings in the search index
export async function indexListings(listings: MeiliListing[]) {
  const index = meili.index(LISTINGS_INDEX);
  return index.addDocuments(listings, { primaryKey: "id" });
}

// Remove a listing from the search index
export async function removeFromIndex(listingId: string) {
  const index = meili.index(LISTINGS_INDEX);
  return index.deleteDocument(listingId);
}

// Search listings
export async function searchListings(params: {
  query: string;
  filters?: string[];
  sort?: string[];
  limit?: number;
  offset?: number;
  geoPoint?: { lat: number; lng: number; distanceInMeters: number };
}) {
  const index = meili.index(LISTINGS_INDEX);

  const filterArray = [...(params.filters ?? []), 'status = "active"'];

  if (params.geoPoint) {
    filterArray.push(
      `_geoRadius(${params.geoPoint.lat}, ${params.geoPoint.lng}, ${params.geoPoint.distanceInMeters})`
    );
  }

  return index.search(params.query, {
    filter: filterArray,
    sort: params.sort,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });
}
