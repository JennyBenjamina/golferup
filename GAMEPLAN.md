# GolfOnly — Game Plan & Technical Blueprint

## Vision

GolfOnly is a marketplace and community platform where golf enthusiasts buy, sell, and trade gear — and connect with fellow golfers. Think OfferUp, but built from the ground up for the golf world: clubs, bags, apparel, accessories, rangefinders, carts, and everything in between — wrapped in a community layer where people can geek out about the game.

---

## Tech Stack

### Frontend

| Layer            | Technology                                     | Why                                                                                                       |
| ---------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Framework        | **Next.js 15 (App Router)**                    | Server components, API routes, middleware, ISR — everything in one framework. Deploys natively on Vercel. |
| Language         | **TypeScript**                                 | Type safety across the entire stack. Non-negotiable for a project this size.                              |
| Styling          | **Tailwind CSS 4 + shadcn/ui**                 | Utility-first CSS with a polished, accessible component library. Fast to build, easy to customize.        |
| State Management | **TanStack Query (React Query)**               | Server state caching, optimistic updates, infinite scroll — perfect for a marketplace feed.               |
| Forms            | **React Hook Form + Zod**                      | Performant forms with schema-based validation that's shared with the backend.                             |
| Real-time        | **Socket.io Client**                           | Powers the chat/messaging system with presence indicators and typing status.                              |
| Maps             | **Mapbox GL JS**                               | Display local listings on a map (golf is inherently local — people want nearby deals).                    |
| Image Handling   | **react-dropzone + browser-image-compression** | Client-side image compression before upload to keep storage costs down.                                   |

### Backend

| Layer              | Technology                                | Why                                                                                                                                   |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| API Layer          | **Next.js Route Handlers + tRPC**         | tRPC gives you end-to-end type safety between client and server. No code generation, no schema drift.                                 |
| Database           | **PostgreSQL (via Neon)**                 | Serverless Postgres that scales to zero — perfect for Vercel. Branching for dev/staging environments.                                 |
| ORM                | **Drizzle ORM**                           | Lightweight, type-safe, SQL-like syntax. Faster and leaner than Prisma for serverless.                                                |
| Auth               | **NextAuth.js v5 (Auth.js)**              | Google, Apple, email magic links. Built for Next.js, handles sessions and JWT out of the box.                                         |
| Real-time Server   | **Socket.io (on a separate Node server)** | Handles WebSocket connections for chat. Deployed as a standalone service (Railway or Fly.io).                                         |
| Payments           | **Stripe Connect**                        | Marketplace payments with escrow. Stripe handles payouts to sellers, takes a platform fee.                                            |
| File Storage       | **Uploadthing or Cloudflare R2**          | Image uploads for listings and profiles. R2 has no egress fees; Uploadthing is simpler to integrate.                                  |
| Search             | **Meilisearch (via Meilisearch Cloud)**   | Typo-tolerant, fast, faceted search. Filter by brand, club type, condition, price range, location.                                    |
| Email              | **Resend + React Email**                  | Transactional emails (order confirmations, messages, password resets) with React-based templates.                                     |
| Background Jobs    | **Inngest**                               | Serverless-friendly job queue. Handles things like: send notification after purchase, expire stale listings, generate search indexes. |
| Push Notifications | **Web Push API + FCM**                    | Browser push for new messages, offers, and price drops.                                                                               |

### Infrastructure & DevOps

| Layer             | Technology                                             | Why                                                                                       |
| ----------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Hosting           | **Vercel**                                             | Zero-config Next.js deployment, edge functions, preview deployments on every PR.          |
| Real-time Hosting | **Railway or Fly.io**                                  | Socket.io server needs a persistent process — can't run on Vercel's serverless functions. |
| CI/CD             | **GitHub Actions**                                     | Automated testing, linting, type checking on every push. Vercel handles the deploy.       |
| Monitoring        | **Sentry**                                             | Error tracking, performance monitoring, session replay for debugging.                     |
| Analytics         | **PostHog**                                            | Product analytics, feature flags, session recordings. Open-source friendly.               |
| CDN / Images      | **Vercel Image Optimization** or **Cloudflare Images** | Automatic resizing, WebP/AVIF conversion, lazy loading.                                   |

---

## Database Schema (Core Entities)

```
users
├── id, email, name, avatar_url, bio
├── location (lat/lng + city/state)
├── rating_avg, rating_count
├── stripe_account_id
└── created_at, updated_at

listings
├── id, seller_id (→ users)
├── title, description, price, condition
├── category (driver, iron, putter, bag, apparel, accessories, etc.)
├── brand, model, flex, loft, hand (left/right)
├── images[] (array of URLs)
├── location (lat/lng + city/state)
├── status (active, sold, reserved, expired)
└── created_at, updated_at, expires_at

offers
├── id, listing_id (→ listings), buyer_id (→ users)
├── amount, message
├── status (pending, accepted, declined, countered)
└── created_at

transactions
├── id, listing_id, buyer_id, seller_id
├── amount, platform_fee
├── stripe_payment_intent_id
├── status (pending, completed, refunded, disputed)
└── created_at

conversations
├── id, listing_id (nullable)
├── participant_ids[]
└── created_at, last_message_at

messages
├── id, conversation_id (→ conversations)
├── sender_id (→ users)
├── body, image_url (nullable)
├── read_at
└── created_at

posts (community/forum)
├── id, author_id (→ users)
├── title, body, images[]
├── category (gear-talk, course-reviews, swing-tips, deals, general)
├── upvote_count, comment_count
└── created_at, updated_at

comments
├── id, post_id (→ posts), author_id (→ users)
├── parent_id (nullable, for threading)
├── body
├── upvote_count
└── created_at

reviews
├── id, reviewer_id, reviewed_id (both → users)
├── transaction_id (→ transactions)
├── rating (1-5), body
└── created_at

saved_listings (wishlist)
├── user_id, listing_id
└── created_at

follows
├── follower_id, following_id (both → users)
└── created_at
```

---

## Feature Breakdown by Phase

### Phase 1 — Foundation (Weeks 1–3)

**Goal:** Get the skeleton app running with auth and basic listing CRUD.

- Project scaffolding: Next.js 15 + TypeScript + Tailwind + shadcn/ui
- Database setup: Neon Postgres + Drizzle ORM + initial migrations
- Authentication: NextAuth.js with Google OAuth + email magic links
- User profiles: avatar upload, bio, location
- Listing CRUD: create, edit, delete listings with multi-image upload
- Basic listing feed: infinite scroll, sort by newest/price
- Responsive layout: mobile-first (marketplace apps are 70%+ mobile traffic)
- Basic SEO: meta tags, Open Graph images for shared listings

### Phase 2 — Search & Discovery (Weeks 4–5)

**Goal:** Make it easy to find the right gear.

- Meilisearch integration: full-text search with typo tolerance
- Faceted filters: category, brand, condition, price range, hand (L/R)
- Location-based search: "within X miles" using PostGIS or Mapbox geocoding
- Map view: browse listings on a map
- Saved searches: get notified when new listings match your criteria
- Category landing pages: `/drivers`, `/putters`, `/bags`, etc.

### Phase 3 — Transactions & Payments (Weeks 6–8)

**Goal:** Enable safe, in-app purchases.

- Stripe Connect onboarding: sellers connect their bank accounts
- Make an offer flow: buyer submits offer → seller accepts/declines/counters
- Checkout flow: Stripe payment intent, hold funds in escrow
- Order management: track status (paid → shipped → delivered)
- Shipping label generation: integrate with Shippo or EasyPost
- Buyer/seller protection: dispute flow, refund handling
- Reviews & ratings: leave a review after a completed transaction
- Platform fee: take a percentage (e.g., 8-10%) on each sale

### Phase 4 — Messaging (Weeks 9–10)

**Goal:** Let buyers and sellers communicate in real time.

- Conversation threads: tied to a listing or standalone
- Real-time messaging: Socket.io with presence indicators
- Typing indicators, read receipts
- Image sharing in chat
- Push notifications for new messages (Web Push API)
- Unread badge counts
- Block/report users

### Phase 5 — Community (Weeks 11–13)

**Goal:** Build the social layer that makes GolfOnly sticky.

- Forum/feed: posts with categories (gear talk, course reviews, swing tips, deals)
- Rich text editor: support for images, links, formatting (Tiptap)
- Upvotes and threaded comments
- Follow users: see their new listings and posts in your feed
- User reputation system: badges based on activity (trades completed, helpful posts)
- Trending/popular posts algorithm
- Share to social media

### Phase 6 — Polish & Growth (Weeks 14–16)

**Goal:** Optimize for retention, performance, and growth.

- Email notifications: digest of new listings, messages, community activity (Resend)
- Saved listings / wishlist
- Price drop alerts
- PWA support: installable on mobile, offline listing browsing
- Performance optimization: image lazy loading, skeleton screens, prefetching
- Admin dashboard: content moderation, reported users, listing approval queue
- Analytics integration: PostHog for funnels, retention, feature usage
- A/B testing framework via PostHog feature flags
- SEO optimization: structured data for listings (Product schema), sitemap generation

---

## Project Structure

```
golfer-up/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, signup, forgot password
│   │   ├── (main)/             # Main layout (header, nav, footer)
│   │   │   ├── page.tsx        # Home / listing feed
│   │   │   ├── listing/[id]/   # Listing detail page
│   │   │   ├── sell/           # Create listing flow
│   │   │   ├── messages/       # Messaging inbox
│   │   │   ├── community/      # Forum / posts
│   │   │   ├── profile/[id]/   # User profiles
│   │   │   └── settings/       # Account settings
│   │   ├── api/                # API route handlers
│   │   │   └── trpc/[trpc]/    # tRPC API endpoint
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── listings/           # ListingCard, ListingGrid, ListingForm
│   │   ├── chat/               # ChatWindow, MessageBubble, ConversationList
│   │   ├── community/          # PostCard, CommentThread, PostEditor
│   │   └── layout/             # Header, Footer, Sidebar, MobileNav
│   ├── server/
│   │   ├── db/                 # Drizzle schema, migrations, connection
│   │   ├── trpc/               # tRPC router definitions
│   │   ├── auth/               # NextAuth config
│   │   └── services/           # Business logic (stripe, search, notifications)
│   ├── lib/                    # Shared utilities, constants, types
│   └── hooks/                  # Custom React hooks
├── public/                     # Static assets
├── drizzle/                    # Migration files
├── .env.local                  # Environment variables
├── next.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
└── package.json
```

---

## Key Architectural Decisions

**Why tRPC over REST or GraphQL?**
With a single Next.js codebase, tRPC gives you full type safety from database → API → UI with zero code generation. You change a return type on the server and TypeScript catches every broken client call instantly. For a solo/small-team project, this is a massive productivity win.

**Why Drizzle over Prisma?**
Prisma's query engine adds cold start latency on serverless (Vercel). Drizzle compiles to raw SQL with no engine overhead. It's also more explicit — you write queries that look like SQL, so you always know what's hitting the database.

**Why a separate Socket.io server?**
Vercel doesn't support persistent WebSocket connections. The chat server runs as a lightweight Node.js process on Railway (~$5/month) or Fly.io (free tier). It connects to the same Neon database and authenticates via the same JWT tokens.

**Why Stripe Connect (not regular Stripe)?**
OfferUp-style marketplaces need split payments: the buyer pays, the platform takes a fee, and the seller gets the rest. Stripe Connect handles this, including seller identity verification, tax forms (1099s), and payouts.

**Why Meilisearch over Algolia?**
Comparable search quality at a fraction of the cost. Self-hostable if you outgrow the cloud tier. Golf gear has very specific filter requirements (brand, flex, loft, hand, condition) and Meilisearch handles faceted filtering natively.

---

## Third-Party Accounts You'll Need

| Service                              | Purpose                | Pricing                        |
| ------------------------------------ | ---------------------- | ------------------------------ |
| **Vercel**                           | App hosting            | Free tier → Pro at $20/mo      |
| **Neon**                             | PostgreSQL database    | Free tier (0.5 GB) → Scale     |
| **Stripe**                           | Payments               | 2.9% + $0.30 per transaction   |
| **Meilisearch Cloud**                | Search                 | Free tier (10K docs) → $30/mo  |
| **Uploadthing** or **Cloudflare R2** | Image storage          | Free tier → pay per GB         |
| **Resend**                           | Transactional email    | Free (100 emails/day) → $20/mo |
| **Railway** or **Fly.io**            | Socket.io server       | Free tier → $5/mo              |
| **Sentry**                           | Error monitoring       | Free tier (5K errors/mo)       |
| **PostHog**                          | Analytics              | Free tier (1M events/mo)       |
| **Mapbox**                           | Maps & geocoding       | Free tier (50K loads/mo)       |
| **GitHub**                           | Source control + CI/CD | Free                           |

**Estimated monthly cost at launch: $0–30/month** (most services have generous free tiers).

---

## Development Workflow

1. **Version control:** GitHub with branch protection on `main`. Feature branches with PR reviews.
2. **Preview deployments:** Every PR gets a unique Vercel preview URL for testing.
3. **Database branching:** Neon supports branch databases — each PR can have its own DB branch.
4. **Testing:** Vitest for unit tests, Playwright for E2E. Test critical flows: auth, listing creation, checkout, messaging.
5. **Linting:** ESLint + Prettier, enforced via GitHub Actions. Husky for pre-commit hooks.
6. **Type checking:** `tsc --noEmit` in CI — catches type errors before they ship.

---

## What to Build First

Start here, in this order:

1. `npx create-next-app@latest golfer-up --typescript --tailwind --app --src-dir`
2. Install core deps: `drizzle-orm`, `@auth/nextjs`, `@trpc/server`, `shadcn/ui`
3. Set up Neon database + Drizzle schema for `users` and `listings`
4. Wire up NextAuth with Google OAuth
5. Build the listing creation form (title, description, price, category, images)
6. Build the listing feed with infinite scroll
7. Ship it. Get feedback. Iterate.

The best marketplace is the one that exists. Get Phase 1 live, put real listings on it, and let user behavior guide what you build next.
