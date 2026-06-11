"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReviewPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const { transactionId } = use(params);
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Review Submitted
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Thanks for helping build trust in the GolfOnly community!
        </p>
        <button
          onClick={() => router.push("/orders")}
          className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Leave a Review</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Star rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="p-1"
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors",
                    (hoveredRating || rating) >= star
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300",
                  )}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Great"}
              {rating === 5 && "Excellent"}
            </p>
          )}
        </div>

        {/* Written review */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Review (optional)
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="How was the transaction? Was the item as described? Would you buy from this seller again?"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
        </div>

        {createReview.error && (
          <p className="text-sm text-red-600">{createReview.error.message}</p>
        )}

        <button
          onClick={() =>
            createReview.mutate({
              transactionId,
              rating,
              body: body || undefined,
            })
          }
          disabled={rating === 0 || createReview.isPending}
          className="w-full py-3 bg-emerald-600 text-white font-medium rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {createReview.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </button>
      </div>
    </div>
  );
}
