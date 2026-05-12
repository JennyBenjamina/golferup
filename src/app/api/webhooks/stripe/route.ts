import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/server/services/stripe";
import { db } from "@/server/db";
import { transactions, listings } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event;
  try {
    event = await constructWebhookEvent(body, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const listingId = paymentIntent.metadata?.listing_id;

        if (listingId) {
          // Mark transaction as completed
          await db
            .update(transactions)
            .set({ status: "completed" })
            .where(eq(transactions.stripePaymentIntentId, paymentIntent.id));

          // Mark listing as sold
          await db
            .update(listings)
            .set({ status: "sold" })
            .where(eq(listings.id, listingId));
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const listingId = paymentIntent.metadata?.listing_id;

        if (listingId) {
          // Revert listing to active
          await db
            .update(listings)
            .set({ status: "active" })
            .where(eq(listings.id, listingId));

          // Mark transaction as refunded
          await db
            .update(transactions)
            .set({ status: "refunded" })
            .where(eq(transactions.stripePaymentIntentId, paymentIntent.id));
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;

        if (paymentIntentId) {
          await db
            .update(transactions)
            .set({ status: "refunded" })
            .where(eq(transactions.stripePaymentIntentId, paymentIntentId));
        }
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object;
        const paymentIntentId =
          typeof dispute.payment_intent === "string"
            ? dispute.payment_intent
            : dispute.payment_intent?.id;

        if (paymentIntentId) {
          await db
            .update(transactions)
            .set({ status: "disputed" })
            .where(eq(transactions.stripePaymentIntentId, paymentIntentId));
        }
        break;
      }

      default:
        // Unhandled event type — that's fine
        break;
    }
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
