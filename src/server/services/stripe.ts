// Use dynamic import so the stripe package is never evaluated at build time.
// This prevents "Neither apiKey nor config.authenticator provided" during `next build`.

let _stripe: any = null;

async function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set.");
    }
    const { default: Stripe } = await import("stripe");
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

const PLATFORM_FEE_PERCENT = 10; // 10% platform fee

/**
 * Create a Stripe Connect Express account for a seller
 */
export async function createConnectAccount(params: {
  email: string;
  userId: string;
}) {
  const stripe = await getStripe();
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
    business_type: "individual",
    business_profile: {
      url: "https://golferup.golf",
      mcc: "5941",
      product_description:
        "Selling used golf equipment (clubs, balls, apparel, accessories) on the GolferUp marketplace.",
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
  const stripe = await getStripe();
  const accountLink = await stripe.accountLinks.create({
    account: params.stripeAccountId,
    return_url: params.returnUrl,
    refresh_url: params.refreshUrl,
    type: "account_onboarding",
    collection_options: {
      fields: "currently_due",
    },
  });

  return accountLink;
}

/**
 * Check if a Connect account has completed onboarding
 */
export async function checkAccountStatus(stripeAccountId: string) {
  const stripe = await getStripe();
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
  const stripe = await getStripe();
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
  const stripe = await getStripe();
  const amountInCents = Math.round(params.amount * 100);
  const platformFeeInCents = Math.round(
    amountInCents * (PLATFORM_FEE_PERCENT / 100)
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    payment_method_types: ["card"],
    capture_method: "manual",
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
  const stripe = await getStripe();
  return stripe.paymentIntents.capture(paymentIntentId);
}

/**
 * Cancel/refund a payment intent
 */
export async function cancelPayment(paymentIntentId: string) {
  const stripe = await getStripe();
  return stripe.paymentIntents.cancel(paymentIntentId);
}

/**
 * Issue a refund for a completed payment
 */
export async function refundPayment(
  paymentIntentId: string,
  reason?: "duplicate" | "fraudulent" | "requested_by_customer"
) {
  const stripe = await getStripe();
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
export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  const stripe = await getStripe();
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

/**
 * Create an Account Session for embedded Connect components
 */
export async function createAccountSession(stripeAccountId: string) {
  const stripe = await getStripe();
  const accountSession = await stripe.accountSessions.create({
    account: stripeAccountId,
    components: {
      account_onboarding: { enabled: true },
    },
  });
  return accountSession;
}

/**
 * Retrieve a Payment Intent (to get client_secret for the frontend)
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  const stripe = await getStripe();
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

export { PLATFORM_FEE_PERCENT };
