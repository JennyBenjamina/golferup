"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatPrice, timeAgo } from "@/lib/utils";
import { Package, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function OrdersPage() {
  const [tab, setTab] = useState<"purchases" | "sales">("purchases");

  const { data: purchases, isLoading: purchasesLoading } =
    trpc.payments.myPurchases.useQuery();
  const { data: sales, isLoading: salesLoading } =
    trpc.payments.mySales.useQuery();

  const isLoading = tab === "purchases" ? purchasesLoading : salesLoading;
  const orders = tab === "purchases" ? purchases : sales;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-emerald-100 text-emerald-800",
    refunded: "bg-red-100 text-red-800",
    disputed: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("purchases")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
            tab === "purchases"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <ShoppingBag className="w-4 h-4" />
          Purchases
        </button>
        <button
          onClick={() => setTab("sales")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
            tab === "sales"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Package className="w-4 h-4" />
          Sales
        </button>
      </div>

      {/* Order list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-200 h-24 rounded-xl"
            />
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const otherUser =
              "seller" in order ? order.seller : order.buyer;
            return (
              <div
                key={order.transaction.id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4"
              >
                {/* Listing image */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  {order.listing.images?.[0] ? (
                    <img
                      src={order.listing.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/listing/${order.listing.id}`}
                        className="font-medium text-gray-900 hover:text-emerald-600 line-clamp-1"
                      >
                        {order.listing.title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {tab === "purchases" ? "Sold by" : "Bought by"}{" "}
                        <Link
                          href={`/profile/${otherUser.id}`}
                          className="text-emerald-600 hover:underline"
                        >
                          {otherUser.name ?? "Anonymous"}
                        </Link>
                      </p>
                    </div>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 text-xs font-medium rounded-full shrink-0",
                        statusColors[order.transaction.status] ??
                          "bg-gray-100 text-gray-700"
                      )}
                    >
                      {order.transaction.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-lg font-bold text-gray-900">
                      {formatPrice(order.transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {timeAgo(order.transaction.createdAt)}
                    </p>
                  </div>

                  {/* Review prompt for completed orders */}
                  {order.transaction.status === "completed" && (
                    <Link
                      href={`/orders/${order.transaction.id}/review`}
                      className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 mt-2"
                    >
                      <Star className="w-3 h-3" />
                      Leave a review
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {tab === "purchases" ? (
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            ) : (
              <Package className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No {tab} yet
          </h3>
          <p className="text-sm text-gray-500">
            {tab === "purchases"
              ? "Items you buy will show up here."
              : "Items you sell will show up here."}
          </p>
        </div>
      )}
    </div>
  );
}
