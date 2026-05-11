"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Plus,
  ArrowBigUp,
  MessageCircle,
  TrendingUp,
  Clock,
  Award,
} from "lucide-react";
import { cn, timeAgo, formatCategory } from "@/lib/utils";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";

const forumCategories = [
  { label: "All", value: "" },
  { label: "Gear Talk", value: "gear_talk" },
  { label: "Course Reviews", value: "course_reviews" },
  { label: "Swing Tips", value: "swing_tips" },
  { label: "Deals", value: "deals" },
  { label: "General", value: "general" },
] as const;

const sortOptions = [
  { label: "Newest", value: "newest", icon: Clock },
  { label: "Trending", value: "trending", icon: TrendingUp },
  { label: "Top", value: "top", icon: Award },
] as const;

type CategoryValue = "" | "gear_talk" | "course_reviews" | "swing_tips" | "deals" | "general";
type SortValue = "newest" | "trending" | "top";

function CommunityPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialCat = (searchParams.get("cat") ?? "") as CategoryValue;
  const [activeCategory, setActiveCategory] = useState<CategoryValue>(initialCat);
  const [sort, setSort] = useState<SortValue>("newest");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.posts.feed.useInfiniteQuery(
      {
        category: activeCategory || undefined,
        sort,
        limit: 20,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const utils = trpc.useUtils();
  const toggleUpvote = trpc.posts.toggleUpvote.useMutation({
    onSuccess: () => {
      utils.posts.feed.invalidate();
    },
  });

  const allPosts = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community</h1>
          <p className="text-sm text-gray-600 mt-1">
            Talk gear, share tips, and connect with fellow golfers.
          </p>
        </div>
        {session && (
          <Link
            href="/community/new"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Post
          </Link>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto mb-4 pb-1">
        {forumCategories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value as CategoryValue)}
            className={cn(
              "px-4 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors",
              activeCategory === cat.value
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 mb-6">
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value as SortValue)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-sm rounded-lg transition-colors",
              sort === opt.value
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <opt.icon className="w-3.5 h-3.5" />
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && allPosts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center py-16">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Start the conversation
          </h3>
          <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
            Be the first to share something with the GolferUp community. Talk
            about your latest round, review a course, or share a deal you
            found.
          </p>
          {session && (
            <Link
              href="/community/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Post
            </Link>
          )}
        </div>
      )}

      {/* Post cards */}
      {allPosts.length > 0 && (
        <div className="space-y-3">
          {allPosts.map((item) => (
            <article
              key={item.post.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
            >
              <div className="flex gap-3">
                {/* Upvote column */}
                <div className="flex flex-col items-center gap-0.5 pt-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (!session) return;
                      toggleUpvote.mutate({ postId: item.post.id });
                    }}
                    className={cn(
                      "p-1 rounded-md transition-colors",
                      item.hasUpvoted
                        ? "text-emerald-600 bg-emerald-50"
                        : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                    )}
                    disabled={!session}
                  >
                    <ArrowBigUp
                      className={cn(
                        "w-5 h-5",
                        item.hasUpvoted && "fill-emerald-600"
                      )}
                    />
                  </button>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      item.hasUpvoted ? "text-emerald-600" : "text-gray-500"
                    )}
                  >
                    {item.post.upvoteCount ?? 0}
                  </span>
                </div>

                {/* Post content */}
                <div className="flex-1 min-w-0">
                  {/* Author row */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <Link
                      href={`/profile/${item.author.id}`}
                      className="shrink-0"
                    >
                      {item.author.image ? (
                        <img
                          src={item.author.image}
                          alt=""
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-emerald-700 text-xs font-semibold">
                            {item.author.name?.charAt(0) ?? "?"}
                          </span>
                        </div>
                      )}
                    </Link>
                    <Link
                      href={`/profile/${item.author.id}`}
                      className="text-xs font-medium text-gray-700 hover:text-emerald-600"
                    >
                      {item.author.name ?? "Anonymous"}
                    </Link>
                    <span className="text-xs text-gray-400">
                      {timeAgo(item.post.createdAt)}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500">
                      {formatCategory(item.post.category)}
                    </span>
                  </div>

                  {/* Title */}
                  <Link href={`/community/${item.post.id}`}>
                    <h3 className="text-base font-semibold text-gray-900 hover:text-emerald-600 transition-colors mb-1">
                      {item.post.title}
                    </h3>
                  </Link>

                  {/* Body preview */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {item.post.body}
                  </p>

                  {/* Image thumbnails */}
                  {item.post.images && item.post.images.length > 0 && (
                    <div className="flex gap-2 mb-2">
                      {item.post.images.slice(0, 3).map((img, i) => (
                        <div
                          key={i}
                          className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100"
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {item.post.images.length > 3 && (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                          +{item.post.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comment count */}
                  <Link
                    href={`/community/${item.post.id}`}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {item.post.commentCount ?? 0} comments
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {/* Load more */}
          {hasNextPage && (
            <div className="text-center pt-4">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-6 py-2 text-sm font-medium text-emerald-600 border border-emerald-600 rounded-full hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-sm text-gray-500">Loading community...</p>
        </div>
      }
    >
      <CommunityPageContent />
    </Suspense>
  );
}
