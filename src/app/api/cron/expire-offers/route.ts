import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { expireOverdueOffers, expireAbandonedCheckouts } from "@/server/trpc/routers/offers";

/**
 * Cron endpoint: expire accepted offers whose payment deadline has passed
 * AND clean up abandoned Buy Now checkouts (pending > 24 hours).
 *
 * Runs daily via Vercel Cron. Secured by CRON_SECRET env var.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expiredOffers = await expireOverdueOffers(db);
    const abandonedCheckouts = await expireAbandonedCheckouts(db);
    return NextResponse.json({
      ok: true,
      expiredOffers,
      abandonedCheckouts,
    });
  } catch (error) {
    console.error("Cron expire-offers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
