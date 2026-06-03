import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  decimal,
  integer,
  boolean,
  pgEnum,
  index,
  primaryKey,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const listingStatusEnum = pgEnum("listing_status", [
  "active",
  "sold",
  "reserved",
  "expired",
  "draft",
  "deleted",
]);

export const listingConditionEnum = pgEnum("listing_condition", [
  "new",
  "like_new",
  "excellent",
  "good",
  "fair",
  "poor",
]);

export const listingCategoryEnum = pgEnum("listing_category", [
  "drivers",
  "woods",
  "hybrids",
  "irons",
  "wedges",
  "putters",
  "complete_sets",
  "bags",
  "push_carts",
  "rangefinders",
  "gps_devices",
  "apparel",
  "shoes",
  "gloves",
  "balls",
  "accessories",
  "training_aids",
  "miscellaneous",
  "other",
]);

export const handEnum = pgEnum("hand", ["right", "left"]);

export const offerStatusEnum = pgEnum("offer_status", [
  "pending",
  "accepted",
  "declined",
  "countered",
  "expired",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "completed",
  "refunded",
  "disputed",
]);

export const postCategoryEnum = pgEnum("post_category", [
  "gear_talk",
  "course_reviews",
  "swing_tips",
  "deals",
  "general",
]);

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    image: text("image"),
    bio: text("bio"),
    locationCity: varchar("location_city", { length: 255 }),
    locationState: varchar("location_state", { length: 100 }),
    locationLat: doublePrecision("location_lat"),
    locationLng: doublePrecision("location_lng"),
    ratingAvg: decimal("rating_avg", { precision: 3, scale: 2 }).default("0"),
    ratingCount: integer("rating_count").default(0),
    stripeAccountId: varchar("stripe_account_id", { length: 255 }),
    stripeOnboarded: boolean("stripe_onboarded").default(false),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_location_idx").on(table.locationLat, table.locationLng),
  ]
);

// NextAuth.js required tables
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 })
    .notNull()
    .primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

// ─── Listings ────────────────────────────────────────────────────────────────

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    condition: listingConditionEnum("condition").notNull(),
    category: listingCategoryEnum("category").notNull(),
    brand: varchar("brand", { length: 100 }),
    model: varchar("model", { length: 100 }),
    flex: varchar("flex", { length: 50 }),
    loft: varchar("loft", { length: 50 }),
    shaft: varchar("shaft", { length: 100 }),
    hand: handEnum("hand"),
    size: varchar("size", { length: 50 }),
    gender: varchar("gender", { length: 20 }),
    color: varchar("color", { length: 50 }),
    wheelCount: varchar("wheel_count", { length: 10 }),
    images: text("images")
      .array()
      .default([])
      .notNull(),
    locationCity: varchar("location_city", { length: 255 }),
    locationState: varchar("location_state", { length: 100 }),
    locationLat: doublePrecision("location_lat"),
    locationLng: doublePrecision("location_lng"),
    status: listingStatusEnum("status").default("active").notNull(),
    viewCount: integer("view_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [
    index("listings_seller_idx").on(table.sellerId),
    index("listings_category_idx").on(table.category),
    index("listings_status_idx").on(table.status),
    index("listings_location_idx").on(table.locationLat, table.locationLng),
    index("listings_created_idx").on(table.createdAt),
    index("listings_price_idx").on(table.price),
  ]
);

// ─── Offers ──────────────────────────────────────────────────────────────────

export const offers = pgTable(
  "offers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    message: text("message"),
    status: offerStatusEnum("status").default("pending").notNull(),
    paymentDeadline: timestamp("payment_deadline"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("offers_listing_idx").on(table.listingId),
    index("offers_buyer_idx").on(table.buyerId),
  ]
);

// ─── Transactions ────────────────────────────────────────────────────────────

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id),
  buyerId: uuid("buyer_id")
    .notNull()
    .references(() => users.id),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  status: transactionStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Conversations & Messages ────────────────────────────────────────────────

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").references(() => listings.id),
  participantOneId: uuid("participant_one_id")
    .notNull()
    .references(() => users.id),
  participantTwoId: uuid("participant_two_id")
    .notNull()
    .references(() => users.id),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    imageUrl: text("image_url"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("messages_conversation_idx").on(table.conversationId),
    index("messages_sender_idx").on(table.senderId),
  ]
);

// ─── Community Posts & Comments ──────────────────────────────────────────────

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    images: text("images").array().default([]),
    category: postCategoryEnum("category").default("general").notNull(),
    upvoteCount: integer("upvote_count").default(0),
    commentCount: integer("comment_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("posts_author_idx").on(table.authorId),
    index("posts_category_idx").on(table.category),
    index("posts_created_idx").on(table.createdAt),
  ]
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    body: text("body").notNull(),
    upvoteCount: integer("upvote_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("comments_post_idx").on(table.postId),
    index("comments_author_idx").on(table.authorId),
    index("comments_parent_idx").on(table.parentId),
  ]
);

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id),
    reviewedId: uuid("reviewed_id")
      .notNull()
      .references(() => users.id),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id),
    rating: integer("rating").notNull(),
    body: text("body"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("reviews_reviewed_idx").on(table.reviewedId),
    index("reviews_transaction_idx").on(table.transactionId),
  ]
);

// ─── Saved Listings (Wishlist) ───────────────────────────────────────────────

export const savedListings = pgTable(
  "saved_listings",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.listingId] })]
);

// ─── Follows ─────────────────────────────────────────────────────────────────

export const follows = pgTable(
  "follows",
  {
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.followerId, table.followingId] })]
);

// ─── Post Upvotes ────────────────────────────────────────────────────────────

export const postUpvotes = pgTable(
  "post_upvotes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.postId] })]
);

// ─── Saved Searches ──────────────────────────────────────────────────────────

export const savedSearches = pgTable(
  "saved_searches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    query: varchar("query", { length: 255 }),
    category: varchar("category", { length: 50 }),
    condition: varchar("condition", { length: 50 }),
    brand: varchar("brand", { length: 100 }),
    hand: varchar("hand", { length: 10 }),
    priceMin: decimal("price_min", { precision: 10, scale: 2 }),
    priceMax: decimal("price_max", { precision: 10, scale: 2 }),
    locationState: varchar("location_state", { length: 100 }),
    radiusMiles: integer("radius_miles"),
    notifyEnabled: boolean("notify_enabled").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("saved_searches_user_idx").on(table.userId)]
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  offers: many(offers),
  posts: many(posts),
  reviews: many(reviews, { relationName: "reviewsReceived" }),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  seller: one(users, {
    fields: [listings.sellerId],
    references: [users.id],
  }),
  offers: many(offers),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  listing: one(listings, {
    fields: [offers.listingId],
    references: [listings.id],
  }),
  buyer: one(users, {
    fields: [offers.buyerId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));
