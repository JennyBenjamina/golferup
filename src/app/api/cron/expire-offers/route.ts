import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { expireOverdueOffers } from "@/server/trpc/routers/offers";

/**
 * Cron endpoint: expire accepted offers whose payment deadline has passed.
 * Call via Vercel Cron or an external scheduler every 5–15 minutes.
 *
 * Secured by CRON_SECRET env var.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expiredCount = await expireOverdueOffers(db);
    return NextResponse.json({ ok: true, expiredCount });
  } catch (error) {
    console.error("Cron expire-offers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
