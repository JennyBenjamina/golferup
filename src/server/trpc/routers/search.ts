import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../init";
import { searchListings, indexListings, removeFromIndex } from "@/server/services/meilisearch";
import { listings, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import type { MeiliListing } from "@/server/services/meilisearch";

const MILES_TO_METERS = 1609.34;

export const searchRouter = router({
  // Full-text search with filters
  search: publicProcedure
    .input(
      z.object({
        query: z.string().default(""),
        category: z.string().optional(),
        condition: z.string().optional(),
        brand: z.string().optional(),
        hand: z.enum(["right", "left"]).optional(),
        priceMin: z.number().optional(),
        priceMax: z.number().optional(),
        locationState: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        radiusMiles: z.number().default(50),
        sortBy: z
          .enum(["relevance", "price_asc", "price_desc", "newest", "nearest"])
          .default("relevance"),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const filters: string[] = [];

      if (input.category) {
        filters.push(`category = "${input.category}"`);
      }
      if (input.condition) {
        filters.push(`condition = "${input.condition}"`);
      }
      if (input.brand) {
        filters.push(`brand = "${input.brand}"`);
      }
      if (input.hand) {
        filters.push(`hand = "${input.hand}"`);
      }
      if (input.priceMin !== undefined) {
        filters.push(`price >= ${input.priceMin}`);
      }
      if (input.priceMax !== undefined) {
        filters.push(`price <= ${input.priceMax}`);
      }
      if (input.locationState) {
        filters.push(`locationState = "${input.locationState}"`);
      }

      let sort: string[] | undefined;
      switch (input.sortBy) {
        case "price_asc":
          sort = ["price:asc"];
          break;
        case "price_desc":
          sort = ["price:desc"];
          break;
        case "newest":
          sort = ["createdAt:desc"];
          break;
        case "nearest":
          if (input.lat !== undefined && input.lng !== undefined) {
            sort = [`_geoPoint(${input.lat}, ${input.lng}):asc`];
          }
          break;
        // "relevance" uses Meilisearch's default ranking
      }

      let geoPoint: { lat: number; lng: number; distanceInMeters: number } | undefined;
      if (input.lat !== undefined && input.lng !== undefined) {
        geoPoint = {
          lat: input.lat,
          lng: input.lng,
          distanceInMeters: input.radiusMiles * MILES_TO_METERS,
        };
      }

      const results = await searchListings({
        query: input.query,
        filters,
        sort,
        limit: input.limit,
        offset: input.offset,
        geoPoint,
      });

      return {
        hits: results.hits as MeiliListing[],
        totalHits: results.estimatedTotalHits ?? 0,
        query: results.query,
        processingTimeMs: results.processingTimeMs,
      };
    }),

  // Reindex all active listings (admin utility)
  reindex: protectedProcedure.mutation(async ({ ctx }) => {
    const allListings = await ctx.db
      .select({
        listing: listings,
        seller: {
          name: users.name,
          image: users.image,
          ratingAvg: users.ratingAvg,
        },
      })
      .from(listings)
      .innerJoin(users, eq(listings.sellerId, users.id))
      .where(eq(listings.status, "active"));

    const documents: MeiliListing[] = allListings.map(({ listing, seller }) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: parseFloat(listing.price),
      condition: listing.condition,
      category: listing.category,
      brand: listing.brand,
      model: listing.model,
      hand: listing.hand,
      flex: listing.flex,
      loft: listing.loft,
      images: listing.images ?? [],
      locationCity: listing.locationCity,
      locationState: listing.locationState,
      ...(listing.locationLat && listing.locationLng
        ? { _geo: { lat: listing.locationLat, lng: listing.locationLng } }
        : {}),
      status: listing.status,
      createdAt: new Date(listing.createdAt).getTime(),
      sellerId: listing.sellerId,
      sellerName: seller.name,
      sellerImage: seller.image,
      sellerRatingAvg: seller.ratingAvg,
    }));

    const result = await indexListings(documents);

    return { indexed: documents.length, taskUid: result.taskUid };
  }),
});
