import { z } from "zod";
import { eq, ne, desc, and, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../init";
import { listings, users } from "@/server/db/schema";

const createListingSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  condition: z.enum(["new", "like_new", "excellent", "good", "fair", "poor"]),
  category: z.enum([
    "drivers", "woods", "hybrids", "irons", "wedges", "putters",
    "complete_sets", "bags", "push_carts", "rangefinders", "gps_devices",
    "apparel", "shoes", "gloves", "balls", "accessories", "training_aids", "miscellaneous", "other",
  ]),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  flex: z.string().max(50).optional(),
  loft: z.string().max(50).optional(),
  shaft: z.string().max(100).optional(),
  hand: z.enum(["right", "left"]).optional(),
  serialNumber: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
  gender: z.string().max(20).optional(),
  color: z.string().max(50).optional(),
  wheelCount: z.string().max(10).optional(),
  images: z.array(z.string().url()).default([]),
  locationCity: z.string().max(255).optional(),
  locationState: z.string().max(100).optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
});

export const listingsRouter = router({
  // Get a paginated feed of active listings
  feed: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
        category: z.string().optional(),
        sortBy: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, category, sortBy } = input;

      let orderBy;
      switch (sortBy) {
        case "price_asc":
          orderBy = sql`${listings.price}::numeric ASC`;
          break;
        case "price_desc":
          orderBy = sql`${listings.price}::numeric DESC`;
          break;
        default:
          orderBy = desc(listings.createdAt);
      }

      const conditions = [
        eq(listings.status, "active"),
        eq(users.stripeOnboarded, true),
      ];
      if (category) {
        conditions.push(eq(listings.category, category as any));
      }

      const results = await ctx.db
        .select({
          listing: listings,
          seller: {
            id: users.id,
            name: users.name,
            nickname: users.nickname,
            image: users.image,
            ratingAvg: users.ratingAvg,
          },
        })
        .from(listings)
        .innerJoin(users, eq(listings.sellerId, users.id))
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit + 1);

      let nextCursor: string | undefined;
      if (results.length > limit) {
        const next = results.pop();
        nextCursor = next?.listing.id;
      }

      return {
        listings: results,
        nextCursor,
      };
    }),

  // Get a single listing by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          listing: listings,
          seller: {
            id: users.id,
            name: users.name,
            nickname: users.nickname,
            image: users.image,
            ratingAvg: users.ratingAvg,
            ratingCount: users.ratingCount,
            locationCity: users.locationCity,
            locationState: users.locationState,
            createdAt: users.createdAt,
          },
        })
        .from(listings)
        .innerJoin(users, eq(listings.sellerId, users.id))
        .where(eq(listings.id, input.id))
        .limit(1);

      if (!result[0]) {
        return null;
      }

      // Increment view count
      await ctx.db
        .update(listings)
        .set({ viewCount: sql`${listings.viewCount} + 1` })
        .where(eq(listings.id, input.id));

      return result[0];
    }),

  // Create a new listing
  create: protectedProcedure
    .input(createListingSchema)
    .mutation(async ({ ctx, input }) => {
      // If listing doesn't have location, inherit from seller's profile
      let { locationCity, locationState, locationLat, locationLng } = input;

      if (!locationCity && !locationState && !locationLat && !locationLng) {
        const [seller] = await ctx.db
          .select({
            locationCity: users.locationCity,
            locationState: users.locationState,
            locationLat: users.locationLat,
            locationLng: users.locationLng,
          })
          .from(users)
          .where(eq(users.id, ctx.userId))
          .limit(1);

        if (seller) {
          locationCity = seller.locationCity ?? undefined;
          locationState = seller.locationState ?? undefined;
          locationLat = seller.locationLat ?? undefined;
          locationLng = seller.locationLng ?? undefined;
        }
      }

      const [listing] = await ctx.db
        .insert(listings)
        .values({
          ...input,
          locationCity,
          locationState,
          locationLat,
          locationLng,
          sellerId: ctx.userId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        })
        .returning();

      return listing;
    }),

  // Update a listing (only by the seller)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: createListingSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [listing] = await ctx.db
        .update(listings)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(and(eq(listings.id, input.id), eq(listings.sellerId, ctx.userId)))
        .returning();

      return listing;
    }),

  // Soft-delete a listing (only by the seller)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(listings)
        .set({ status: "deleted" })
        .where(and(eq(listings.id, input.id), eq(listings.sellerId, ctx.userId)));

      return { success: true };
    }),

  // Get listings by a specific user (only show if seller has completed Stripe onboarding)
  byUser: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({ listing: listings })
        .from(listings)
        .innerJoin(users, eq(listings.sellerId, users.id))
        .where(
          and(
            eq(listings.sellerId, input.userId),
            eq(listings.status, "active"),
            eq(users.stripeOnboarded, true)
          )
        )
        .orderBy(desc(listings.createdAt))
        .then((rows) => rows.map((r) => r.listing));
    }),

  // Get current user's listings (all statuses except deleted)
  myListings: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.sellerId, ctx.userId),
          ne(listings.status, "deleted")
        )
      )
      .orderBy(desc(listings.createdAt));
  }),
});
