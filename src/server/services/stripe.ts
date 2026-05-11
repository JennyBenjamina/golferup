import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

const PLATFORM_FEE_PERCENT = 10; // 10% platform fee

/**
 * Create a Stripe Connect Express account for a seller
 */
export async function createConnectAccount(params: {
  email: string;
  userId: string;
}) {
  const account = await stripe.accounts.create({
    type: "express",
    email: params.email,
    metadata: {
      golferup_user_id: params.userId,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  return account;
}

/**
 * Generate an onboarding link for a seller to complete Stripe verification
 */
export async function createOnboardingLink(params: {
  stripeAccountId: string;
  returnUrl: string;
  refreshUrl: string;
}) {
  const accountLink = await stripe.accountLinks.create({
    account: params.stripeAccountId,
    return_url: params.returnUrl,
    refresh_url: params.refreshUrl,
    type: "account_onboarding",
  });

  return accountLink;
}

/**
 * Check if a Connect account has completed onboarding
 */
export async function checkAccountStatus(stripeAccountId: string) {
  const account = await stripe.accounts.retrieve(stripeAccountId);

  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    requirements: account.requirements,
  };
}

/**
 * Create a Stripe login link so the seller can access their dashboard
 */
export async function createDashboardLink(stripeAccountId: string) {
  const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
  return loginLink;
}

/**
 * Create a Payment Intent with automatic transfer to the seller
 * Funds are held until capture (manual capture for escrow-like behavior)
 */
export async function createPaymentIntent(params: {
  amount: number; // in dollars
  sellerStripeAccountId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
}) {
  const amountInCents = Math.round(params.amount * 100);
  const platformFeeInCents = Math.round(
    amountInCents * (PLATFORM_FEE_PERCENT / 100)
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    payment_method_types: ["card"],
    capture_method: "manual", // Hold funds, capture later when confirmed
    application_fee_amount: platformFeeInCents,
    transfer_data: {
      destination: params.sellerStripeAccountId,
    },
    metadata: {
      listing_id: params.listingId,
      buyer_id: params.buyerId,
      seller_id: params.sellerId,
      platform_fee_cents: String(platformFeeInCents),
    },
  });

  return paymentIntent;
}

/**
 * Capture a held payment (finalize the transaction)
 */
export async function capturePayment(paymentIntentId: string) {
  return stripe.paymentIntents.capture(paymentIntentId);
}

/**
 * Cancel/refund a payment intent
 */
export async function cancelPayment(paymentIntentId: string) {
  return stripe.paymentIntents.cancel(paymentIntentId);
}

/**
 * Issue a refund for a completed payment
 */
export async function refundPayment(
  paymentIntentId: string,
  reason?: "duplicate" | "fraudulent" | "requested_by_customer"
) {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason,
    refund_application_fee: true,
    reverse_transfer: true,
  });
}

/**
 * Construct and verify a Stripe webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

export { PLATFORM_FEE_PERCENT };
