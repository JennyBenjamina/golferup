"use client";

import { useState } from "react";
import { X, Loader2, DollarSign } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";

interface OfferModalProps {
  listingId: string;
  listingTitle: string;
  askingPrice: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function OfferModal({
  listingId,
  listingTitle,
  askingPrice,
  onClose,
  onSuccess,
}: OfferModalProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const createOffer = trpc.offers.create.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    createOffer.mutate({
      listingId,
      amount,
      message: message || undefined,
    });
  };

  const quickOffers = [0.8, 0.85, 0.9, 0.95].map((pct) => {
    const val = Math.round(parseFloat(askingPrice) * pct);
    return { label: formatPrice(val), value: String(val) };
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Make an Offer</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">{listingTitle}</p>
            <p className="text-sm text-gray-500">
              Asking price: <span className="font-medium text-gray-900">{formatPrice(askingPrice)}</span>
            </p>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Offer
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Quick offer buttons */}
          <div className="flex gap-2">
            {quickOffers.map((qo) => (
              <button
                key={qo.value}
                type="button"
                onClick={() => setAmount(qo.value)}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {qo.label}
              </button>
            ))}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Any details for the seller..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {createOffer.error && (
            <p className="text-sm text-red-600">
              {createOffer.error.message}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!amount || createOffer.isPending}
            className="w-full py-3 bg-emerald-600 text-white font-medium rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createOffer.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              `Send Offer${amount ? ` — ${formatPrice(amount)}` : ""}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
