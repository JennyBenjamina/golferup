import { z } from "zod";
import { router, publicProcedure } from "../init";
import { listings, users } from "@/server/db/schema";
import { eq, and, gte, lte, ilike, or, desc, asc, sql } from "drizzle-orm";

export const searchRouter = router({
  // Full-text search with filters using PostgreSQL
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
        sortBy: z
          .enum(["relevance", "price_asc", "price_desc", "newest"])
          .default("relevance"),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(listings.status, "active")];

      // Text search: match against title, description, brand, model
      if (input.query.trim()) {
        const searchTerm = `%${input.query.trim()}%`;
        conditions.push(
          or(
            ilike(listings.title, searchTerm),
            ilike(listings.description, searchTerm),
            ilike(listings.brand, searchTerm),
            ilike(listings.model, searchTerm)
          )!
        );
      }

      if (input.category) {
        conditions.push(eq(listings.category, input.category as any));
      }
      if (input.condition) {
        conditions.push(eq(listings.condition, input.condition as any));
      }
      if (input.brand) {
        conditions.push(ilike(listings.brand, `%${input.brand}%`));
      }
      if (input.hand) {
        conditions.push(eq(listings.hand, input.hand as any));
      }
      if (input.priceMin !== undefined) {
        conditions.push(gte(sql`${listings.price}::numeric`, input.priceMin));
      }
      if (input.priceMax !== undefined) {
        conditions.push(lte(sql`${listings.price}::numeric`, input.priceMax));
      }
      if (input.locationState) {
        conditions.push(eq(listings.locationState, input.locationState));
      }

      // Determine sort order
      let orderBy;
      switch (input.sortBy) {
        case "price_asc":
          orderBy = asc(sql`${listings.price}::numeric`);
          break;
        case "price_desc":
          orderBy = desc(sql`${listings.price}::numeric`);
          break;
        case "newest":
          orderBy = desc(listings.createdAt);
          break;
        default:
          // "relevance" — newest first as default
          orderBy = desc(listings.createdAt);
      }

      // Get total count
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(listings)
        .where(and(...conditions));

      const totalHits = countResult?.count ?? 0;

      // Get results
      const results = await ctx.db
        .select({
          id: listings.id,
          title: listings.title,
          description: listings.description,
          price: listings.price,
          condition: listings.condition,
          category: listings.category,
          brand: listings.brand,
          model: listings.model,
          hand: listings.hand,
          flex: listings.flex,
          loft: listings.loft,
          images: listings.images,
          locationCity: listings.locationCity,
          locationState: listings.locationState,
          createdAt: listings.createdAt,
          sellerId: listings.sellerId,
          sellerName: users.name,
          sellerImage: users.image,
          sellerRatingAvg: users.ratingAvg,
        })
        .from(listings)
        .innerJoin(users, eq(listings.sellerId, users.id))
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(input.offset);

      // Map to a consistent shape for the frontend
      const hits = results.map((r) => ({
        id: r.id,
        title: r.title,
        price: parseFloat(r.price),
        condition: r.condition,
        category: r.category,
        brand: r.brand,
        model: r.model,
        hand: r.hand,
        flex: r.flex,
        loft: r.loft,
        images: r.images ?? [],
        locationCity: r.locationCity,
        locationState: r.locationState,
        createdAt: new Date(r.createdAt).getTime(),
        sellerId: r.sellerId,
        sellerName: r.sellerName,
        sellerImage: r.sellerImage,
        sellerRatingAvg: r.sellerRatingAvg,
      }));

      return {
        hits,
        totalHits,
        query: input.query,
      };
    }),
});
