"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
import { Loader2, ShieldCheck, CreditCard, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const { transactionId } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<"paying" | "confirming" | "done">("paying");

  const confirmPayment = trpc.payments.confirmPayment.useMutation({
    onSuccess: () => {
      setStatus("done");
    },
  });

  const cancelTransaction = trpc.payments.cancelTransaction.useMutation({
    onSuccess: () => {
      router.push("/");
    },
  });

  if (status === "done") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Your purchase is confirmed. The seller has been notified and will ship
          your item shortly.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/orders"
            className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700"
          >
            View Orders
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50"
          >
            Keep Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Security note */}
        <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Buyer Protection
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Your payment is held securely until you confirm receipt of the
              item. If something goes wrong, you can request a refund.
            </p>
          </div>
        </div>

        {/* Card payment placeholder */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <CreditCard className="w-5 h-5" />
              <span>
                Stripe payment form will load here.
                <br />
                Add <code className="text-xs bg-gray-200 px-1 rounded">@stripe/react-stripe-js</code> to enable the card element.
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Powered by Stripe. Your card details never touch our servers.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => {
              setStatus("confirming");
              confirmPayment.mutate({ transactionId });
            }}
            disabled={confirmPayment.isPending}
            className="w-full py-3 bg-emerald-600 text-white font-medium rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {confirmPayment.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Payment"
            )}
          </button>
          <button
            onClick={() => cancelTransaction.mutate({ transactionId })}
            disabled={cancelTransaction.isPending}
            className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>

        {confirmPayment.error && (
          <p className="text-sm text-red-600 text-center">
            {confirmPayment.error.message}
          </p>
        )}
      </div>
    </div>
  );
}
