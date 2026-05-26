"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
import {
  Loader2,
  DollarSign,
  Check,
  X,
  ArrowRight,
  Tag,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PaymentCountdown } from "@/components/listings/PaymentCountdown";

type Tab = "received" | "sent";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
    declined: "bg-red-50 text-red-700 border-red-200",
    countered: "bg-blue-50 text-blue-700 border-blue-200",
    expired: "bg-gray-50 text-gray-500 border-gray-200",
  };

  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 text-xs font-medium rounded-full border capitalize",
        styles[status] ?? styles.expired
      )}
    >
      {status}
    </span>
  );
}

function CounterModal({
  offerId,
  currentAmount,
  onClose,
}: {
  offerId: string;
  currentAmount: string;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const utils = trpc.useUtils();

  const counter = trpc.offers.counter.useMutation({
    onSuccess: () => {
      utils.offers.receivedOffers.invalidate();
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Counter Offer</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!amount) return;
            counter.mutate({ offerId, amount, message: message || undefined });
          }}
          className="p-4 space-y-3"
        >
          <p className="text-sm text-gray-500">
            Their offer: <span className="font-medium text-gray-900">{formatPrice(currentAmount)}</span>
          </p>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Your counter"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Optional message..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          {counter.error && (
            <p className="text-sm text-red-600">{counter.error.message}</p>
          )}
          <button
            type="submit"
            disabled={!amount || counter.isPending}
            className="w-full py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {counter.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              `Send Counter${amount ? ` — ${formatPrice(amount)}` : ""}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function OffersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("received");
  const [counterTarget, setCounterTarget] = useState<{
    offerId: string;
    amount: string;
  } | null>(null);
  const [acceptDeadlineTarget, setAcceptDeadlineTarget] = useState<string | null>(null);
  const [deadlineHours, setDeadlineHours] = useState(24);

  const {
    data: received,
    isLoading: receivedLoading,
  } = trpc.offers.receivedOffers.useQuery(undefined, {
    enabled: !!session,
  });

  const {
    data: sent,
    isLoading: sentLoading,
  } = trpc.offers.myOffers.useQuery(undefined, {
    enabled: !!session,
  });

  const utils = trpc.useUtils();

  const accept = trpc.offers.accept.useMutation({
    onSuccess: () => {
      utils.offers.receivedOffers.invalidate();
      setAcceptDeadlineTarget(null);
    },
  });
  const decline = trpc.offers.decline.useMutation({
    onSuccess: () => utils.offers.receivedOffers.invalidate(),
  });

  const createCheckout = trpc.payments.createCheckout.useMutation({
    onSuccess: (result) => {
      if (result.transactionId) {
        router.push(`/checkout/${result.transactionId}`);
      }
    },
  });

  const isLoading = tab === "received" ? receivedLoading : sentLoading;

  const pendingCount = received?.filter((r) => r.offer.status === "pending").length ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Offers</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setTab("received")}
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
            tab === "received"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Received{pendingCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("sent")}
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
            tab === "sent"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Sent
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : tab === "received" ? (
        /* Received offers */
        !received?.length ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No offers yet</h3>
            <p className="text-sm text-gray-500">
              When buyers make offers on your listings, they&apos;ll show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {received.map((item) => (
              <div
                key={item.offer.id}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  {/* Listing thumbnail */}
                  <Link href={`/listing/${item.listing.id}`} className="shrink-0">
                    {item.listing.images?.[0] ? (
                      <img
                        src={item.listing.images[0]}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg" />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/listing/${item.listing.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-emerald-600 line-clamp-1"
                        >
                          {item.listing.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Listed at {formatPrice(item.listing.price)}
                        </p>
                      </div>
                      <StatusBadge status={item.offer.status} />
                    </div>

                    {/* Buyer + offer amount */}
                    <div className="flex items-center gap-2 mt-2">
                      {item.buyer.image ? (
                        <img src={item.buyer.image} alt="" className="w-5 h-5 rounded-full" />
                      ) : (
                        <div className="w-5 h-5 bg-gray-200 rounded-full" />
                      )}
                      <span className="text-sm text-gray-600">
                        {item.buyer.name ?? "Anonymous"}
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(item.offer.amount)}
                      </span>
                    </div>

                    {item.offer.message && (
                      <p className="text-sm text-gray-500 mt-1.5 italic">
                        &ldquo;{item.offer.message}&rdquo;
                      </p>
                    )}

                    {/* Actions — only for pending offers */}
                    {item.offer.status === "pending" && (
                      acceptDeadlineTarget === item.offer.id ? (
                        <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                          <p className="text-xs font-medium text-emerald-800 mb-2">
                            How long should the buyer have to pay?
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            {[12, 24, 48, 72].map((h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => setDeadlineHours(h)}
                                className={cn(
                                  "px-2.5 py-1 text-xs rounded-full border transition-colors",
                                  deadlineHours === h
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                                )}
                              >
                                {h}h
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                accept.mutate({
                                  offerId: item.offer.id,
                                  deadlineHours,
                                })
                              }
                              disabled={accept.isPending}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-full hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {accept.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Accept with {deadlineHours}h deadline
                            </button>
                            <button
                              onClick={() => setAcceptDeadlineTarget(null)}
                              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => {
                              setAcceptDeadlineTarget(item.offer.id);
                              setDeadlineHours(24);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-full hover:bg-emerald-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              setCounterTarget({
                                offerId: item.offer.id,
                                amount: item.offer.amount,
                              })
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 border border-emerald-200 rounded-full hover:bg-emerald-50"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Counter
                          </button>
                          <button
                            onClick={() => decline.mutate({ offerId: item.offer.id })}
                            disabled={decline.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-full hover:bg-red-50 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            Decline
                          </button>
                        </div>
                      )
                    )}

                    {/* Accepted offer — show payment countdown for seller */}
                    {item.offer.status === "accepted" && item.offer.paymentDeadline && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-xs text-amber-600">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Waiting for buyer payment</span>
                          <PaymentCountdown
                            deadline={item.offer.paymentDeadline}
                            compact
                            onExpired={() => utils.offers.receivedOffers.invalidate()}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Sent offers */
        !sent?.length ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No offers sent</h3>
            <p className="text-sm text-gray-500">
              Offers you make on listings will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sent.map((item) => (
              <div
                key={item.offer.id}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <Link href={`/listing/${item.listing.id}`} className="shrink-0">
                    {item.listing.images?.[0] ? (
                      <img
                        src={item.listing.images[0]}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg" />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/listing/${item.listing.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-emerald-600 line-clamp-1"
                        >
                          {item.listing.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Listed at {formatPrice(item.listing.price)}
                        </p>
                      </div>
                      <StatusBadge status={item.offer.status} />
                    </div>

                    <p className="text-sm mt-2">
                      Your offer:{" "}
                      <span className="font-semibold text-gray-900">
                        {formatPrice(item.offer.amount)}
                      </span>
                    </p>

                    {item.offer.message && (
                      <p className="text-sm text-gray-500 mt-1 italic">
                        &ldquo;{item.offer.message}&rdquo;
                      </p>
                    )}

                    {/* Accepted offer — show countdown + Pay Now */}
                    {item.offer.status === "accepted" && item.offer.paymentDeadline && (
                      <div className="mt-3 space-y-2">
                        <PaymentCountdown
                          deadline={item.offer.paymentDeadline}
                          onExpired={() => utils.offers.myOffers.invalidate()}
                        />
                        <button
                          onClick={() =>
                            createCheckout.mutate({
                              listingId: item.listing.id,
                              offerId: item.offer.id,
                            })
                          }
                          disabled={createCheckout.isPending}
                          className="w-full py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {createCheckout.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            `Pay Now — ${formatPrice(item.offer.amount)}`
                          )}
                        </button>
                        {createCheckout.error && (
                          <p className="text-sm text-red-600">
                            {createCheckout.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Counter modal */}
      {counterTarget && (
        <CounterModal
          offerId={counterTarget.offerId}
          currentAmount={counterTarget.amount}
          onClose={() => setCounterTarget(null)}
        />
      )}
    </div>
  );
}
