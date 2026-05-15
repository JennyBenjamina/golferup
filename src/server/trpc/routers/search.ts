import { z } from "zod";
import { router, publicProcedure } from "../init";
import { listings, users } from "@/server/db/schema";
import { eq, and, gte, lte, ilike, desc, asc, sql } from "drizzle-orm";

/**
 * Haversine distance in miles between two lat/lng points, computed in SQL.
 * Returns a SQL fragment that evaluates to the distance in miles.
 */
function haversineDistance(
  lat: number,
  lng: number,
  latCol: typeof listings.locationLat,
  lngCol: typeof listings.locationLng
) {
  return sql<number>`(
    3959 * acos(
      cos(radians(${lat}))
      * cos(radians(${latCol}))
      * cos(radians(${lngCol}) - radians(${lng}))
      + sin(radians(${lat}))
      * sin(radians(${latCol}))
    )
  )`;
}

/**
 * Build a weighted tsvector from multiple columns.
 * Weight A (highest) = title, brand
 * Weight B = model, category
 * Weight C = description
 *
 * This means a match on the title or brand ranks higher than one buried
 * in the description.
 */
const searchVector = sql`(
  setweight(to_tsvector('english', coalesce(${listings.title}, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(${listings.brand}, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(${listings.model}, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(${listings.category}::text, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(${listings.description}, '')), 'C')
)`;

/**
 * Convert a user query string into a tsquery.
 * - Splits on spaces, adds :* prefix matching so "taylor" matches "taylormade"
 * - Joins with & (AND) so all terms must appear
 */
function buildTsQuery(query: string) {
  const cleaned = query
    .trim()
    .replace(/[^\w\s]/g, "") // strip special chars
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word}:*`)
    .join(" & ");

  return cleaned || "";
}

export const searchRouter = router({
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
        locationLat: z.number().optional(),
        locationLng: z.number().optional(),
        radiusMiles: z.number().min(1).max(500).optional(),
        sortBy: z
          .enum(["relevance", "price_asc", "price_desc", "newest", "nearest"])
          .default("relevance"),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(listings.status, "active")];
      const hasQuery = input.query.trim().length > 0;

      // Full-text search condition
      if (hasQuery) {
        const tsQueryString = buildTsQuery(input.query);
        if (tsQueryString) {
          conditions.push(
            sql`${searchVector} @@ to_tsquery('english', ${tsQueryString})`
          );
        }
      }

      // Filters
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

      // Geo-radius filtering: only include listings within N miles of the given point
      const hasGeo =
        input.locationLat !== undefined &&
        input.locationLng !== undefined &&
        input.radiusMiles !== undefined;

      if (hasGeo) {
        // Only consider listings that actually have lat/lng set
        conditions.push(sql`${listings.locationLat} IS NOT NULL`);
        conditions.push(sql`${listings.locationLng} IS NOT NULL`);

        const distExpr = haversineDistance(
          input.locationLat!,
          input.locationLng!,
          listings.locationLat,
          listings.locationLng
        );
        conditions.push(sql`${distExpr} <= ${input.radiusMiles!}`);
      }

      // Sort order
      let orderBy;
      if (input.sortBy === "nearest" && hasGeo) {
        // Sort by distance ascending (closest first)
        const distExpr = haversineDistance(
          input.locationLat!,
          input.locationLng!,
          listings.locationLat,
          listings.locationLng
        );
        orderBy = asc(distExpr);
      } else if (input.sortBy === "relevance" && hasQuery) {
        // Rank by full-text relevance (higher score = better match)
        const tsQueryString = buildTsQuery(input.query);
        orderBy = desc(
          sql`ts_rank_cd(${searchVector}, to_tsquery('english', ${tsQueryString}))`
        );
      } else {
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
            orderBy = desc(listings.createdAt);
        }
      }

      // Count
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(listings)
        .where(and(...conditions));

      const totalHits = countResult?.count ?? 0;

      // Build select columns — include distance if geo search is active
      const selectColumns: Record<string, any> = {
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
      };

      if (hasGeo) {
        selectColumns.distanceMiles = haversineDistance(
          input.locationLat!,
          input.locationLng!,
          listings.locationLat,
          listings.locationLng
        );
      }

      // Results
      const results = await ctx.db
        .select(selectColumns)
        .from(listings)
        .innerJoin(users, eq(listings.sellerId, users.id))
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(input.offset);

      const hits = results.map((r: any) => ({
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
        ...(r.distanceMiles !== undefined
          ? { distanceMiles: Math.round(r.distanceMiles * 10) / 10 }
          : {}),
      }));

      return {
        hits,
        totalHits,
        query: input.query,
      };
    }),
});
