import { router } from "./init";
import { listingsRouter } from "./routers/listings";
import { usersRouter } from "./routers/users";
import { searchRouter } from "./routers/search";
import { savedSearchesRouter } from "./routers/saved-searches";
import { offersRouter } from "./routers/offers";
import { paymentsRouter } from "./routers/payments";
import { reviewsRouter } from "./routers/reviews";
import { messagesRouter } from "./routers/messages";
import { postsRouter } from "./routers/posts";
import { commentsRouter } from "./routers/comments";
import { followsRouter } from "./routers/follows";

export const appRouter = router({
  listings: listingsRouter,
  users: usersRouter,
  search: searchRouter,
  savedSearches: savedSearchesRouter,
  offers: offersRouter,
  payments: paymentsRouter,
  reviews: reviewsRouter,
  messages: messagesRouter,
  posts: postsRouter,
  comments: commentsRouter,
  follows: followsRouter,
});

export type AppRouter = typeof appRouter;
