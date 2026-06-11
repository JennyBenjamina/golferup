"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

const faqs = [
  {
    category: "Buying",
    questions: [
      {
        q: "How do I purchase an item?",
        a: "Find an item you like, then click \"Buy Now\" to pay the listed price or \"Make Offer\" to suggest a different price. Once the seller accepts and you complete payment, the item is yours.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept all major credit and debit cards through our secure payment processor, Stripe. Apple Pay and Google Pay are also supported.",
      },
      {
        q: "Is my payment secure?",
        a: "Yes. All payments are processed by Stripe and your card details never touch our servers. Your payment is held securely until the transaction is complete.",
      },
      {
        q: "Can I cancel a purchase?",
        a: "If the seller has not yet shipped or handed off the item, you may be able to cancel. Contact the seller through our messaging system to discuss cancellation.",
      },
    ],
  },
  {
    category: "Selling",
    questions: [
      {
        q: "How do I list an item for sale?",
        a: "Click the \"Sell\" button in the navigation bar, fill out the listing details (title, price, condition, photos, etc.), and submit. Your listing will be visible to buyers once your Stripe account is connected.",
      },
      {
        q: "How do I get paid?",
        a: "You need to connect a Stripe account through your Settings page. Once connected, payments from buyers are deposited directly into your bank account after the transaction is completed.",
      },
      {
        q: "What fees does GolfOnly charge?",
        a: "GolfOnly charges a 10% platform fee on each completed sale. This is automatically deducted from the sale price before the remainder is deposited into your account.",
      },
      {
        q: "Why aren't my listings showing up?",
        a: "Listings are only visible to buyers after you've completed Stripe onboarding in your Settings. This ensures buyers can safely pay for items. Check Settings > Seller Payments to finish setup.",
      },
    ],
  },
  {
    category: "Offers",
    questions: [
      {
        q: "How do offers work?",
        a: "Buyers can submit an offer on any active listing. The seller can accept, decline, or counter. If accepted, the buyer has a limited time (set by the seller) to complete payment before the offer expires.",
      },
      {
        q: "What happens if I don't pay in time?",
        a: "If the payment deadline passes, the offer is automatically cancelled and the listing becomes available again for other buyers.",
      },
    ],
  },
  {
    category: "Account",
    questions: [
      {
        q: "How do I create an account?",
        a: "Click \"Sign In\" and sign in with your Google account. Your account is created automatically on your first sign-in.",
      },
      {
        q: "How do I edit my profile?",
        a: "Go to Settings from the menu to update your display name, bio, and location.",
      },
      {
        q: "How do I delete my account?",
        a: "Please contact us and we'll process your account deletion request.",
      },
    ],
  },
  {
    category: "Safety",
    questions: [
      {
        q: "Is it safe to buy and sell on GolfOnly?",
        a: "We take safety seriously. All payments are processed securely through Stripe, seller identities are verified during Stripe onboarding, and our messaging system keeps your personal contact info private until you choose to share it.",
      },
      {
        q: "What should I do if something goes wrong with a transaction?",
        a: "Contact us through our Contact page and we'll help resolve the issue. Include your transaction details so we can assist you quickly.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-medium text-gray-900 pr-4">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="text-sm text-gray-600 leading-relaxed pb-4 pr-8">{a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Frequently Asked Questions
      </h1>
      <p className="text-gray-600 mb-8">
        Find answers to common questions about buying, selling, and using GolfOnly.
      </p>

      <div className="space-y-8">
        {faqs.map((section) => (
          <div key={section.category}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {section.category}
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 px-6">
              {section.questions.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 p-6 bg-gray-50 rounded-xl text-center">
        <p className="text-sm text-gray-600">
          Still have questions?{" "}
          <Link
            href="/contact"
            className="text-emerald-600 hover:underline font-medium"
          >
            Contact us
          </Link>{" "}
          and we'll be happy to help.
        </p>
      </div>
    </div>
  );
}
