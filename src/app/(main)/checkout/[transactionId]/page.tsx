"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { stripePromise } from "@/lib/stripe";
import { formatPrice } from "@/lib/utils";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

// ─── Inner form (must be inside <Elements>) ─────────────────────────────────

function CheckoutForm({
  transactionId,
  amount,
}: {
  transactionId: string;
  amount: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const confirmCapture = trpc.payments.confirmPayment.useMutation({
    onSuccess: () => setStatus("done"),
    onError: (err) => {
      setError(err.message);
      setStatus("idle");
    },
  });

  const cancelTransaction = trpc.payments.cancelTransaction.useMutation({
    onSuccess: () => router.push("/"),
  });

  if (status === "done") {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Your purchase is confirmed. The seller has been notified.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700"
          >
            Keep Shopping
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setStatus("processing");
    setError(null);

    // Confirm the card with Stripe (authorizes the charge)
    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Payment failed. Please try again.");
      setStatus("idle");
      return;
    }

    // Card authorized — now tell our server to capture the funds
    if (
      result.paymentIntent &&
      (result.paymentIntent.status === "requires_capture" ||
        result.paymentIntent.status === "succeeded")
    ) {
      confirmCapture.mutate({ transactionId });
    } else {
      setError("Unexpected payment status. Please contact support.");
      setStatus("idle");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Security note */}
      <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-emerald-800">
            Buyer Protection
          </p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Your payment is held securely until you confirm receipt of the item.
            If something goes wrong, you can request a refund.
          </p>
        </div>
      </div>

      {/* Stripe PaymentElement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Method
        </label>
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
        <p className="text-xs text-gray-500 mt-2">
          Powered by Stripe. Your card details never touch our servers.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          type="submit"
          disabled={!stripe || status === "processing"}
          className="w-full py-3 bg-emerald-600 text-white font-medium rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {status === "processing" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${formatPrice(amount)}`
          )}
        </button>
        <button
          type="button"
          onClick={() => cancelTransaction.mutate({ transactionId })}
          disabled={cancelTransaction.isPending || status === "processing"}
          className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Outer page (loads clientSecret, wraps in Elements) ─────────────────────

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const { transactionId } = use(params);

  const { data, isLoading, error } = trpc.payments.getCheckoutDetails.useQuery({
    transactionId,
  });

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-4" />
        <p className="text-gray-500">Loading checkout...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Checkout Error
        </h1>
        <p className="text-gray-600 mb-6">
          {error?.message ?? "Could not load checkout details."}
        </p>
        <Link
          href="/"
          className="inline-flex px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout</h1>

      {/* Order summary */}
      <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
        {data.listing.images?.[0] ? (
          <img
            src={data.listing.images[0]}
            alt=""
            className="w-14 h-14 rounded-lg object-cover"
          />
        ) : (
          <div className="w-14 h-14 bg-gray-200 rounded-lg" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {data.listing.title}
          </p>
          <p className="text-lg font-bold text-gray-900">
            {formatPrice(data.amount)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: data.clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#059669",
                borderRadius: "8px",
              },
            },
          }}
        >
          <CheckoutForm
            transactionId={transactionId}
            amount={data.amount}
          />
        </Elements>
      </div>
    </div>
  );
}
