"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Check,
  MapPin,
  Navigation,
  CreditCard,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LocationSearchModal } from "@/components/listings/LocationSearchModal";
import dynamic from "next/dynamic";

const ConnectComponentsProvider = dynamic(
  () => import("@stripe/react-connect-js").then((m) => m.ConnectComponentsProvider),
  { ssr: false }
);
const ConnectAccountOnboarding = dynamic(
  () => import("@stripe/react-connect-js").then((m) => m.ConnectAccountOnboarding),
  { ssr: false }
);

const profileSchema = z.object({
  name: z.string().min(1).max(255),
  bio: z.string().max(500).optional(),
  locationCity: z.string().max(255).optional(),
  locationState: z.string().max(100).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function SellerPaymentsCard() {
  const { data: status, isLoading } = trpc.payments.sellerStatus.useQuery();
  const utils = trpc.useUtils();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const createSession = trpc.payments.createAccountSession.useMutation();

  const dashboard = trpc.payments.dashboardLink.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
  });

  const handleStartOnboarding = useCallback(async () => {
    setError(null);
    try {
      const { loadConnectAndInitialize } = await import("@stripe/connect-js");
      const instance = loadConnectAndInitialize({
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        fetchClientSecret: async () => {
          const result = await createSession.mutateAsync();
          return result.clientSecret;
        },
        appearance: {
          overlays: "dialog",
          variables: {
            colorPrimary: "#059669",
            borderRadius: "8px",
          },
        },
      });
      setStripeInstance(instance);
      setShowOnboarding(true);
    } catch (err: any) {
      setError(err.message || "Failed to start onboarding");
    }
  }, [createSession]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-emerald-600" />
        <h2 className="text-lg font-semibold text-gray-900">Seller Payments</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Connect your bank account through Stripe to receive payments when you sell items. GolferUp takes a 10% platform fee on each sale.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking status...
        </div>
      ) : status?.status === "active" ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">
                Payments connected
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                You can receive payments from buyers.
              </p>
            </div>
          </div>
          <button
            onClick={() => dashboard.mutate()}
            disabled={dashboard.isPending}
            className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            {dashboard.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            View Stripe Dashboard
          </button>
        </div>
      ) : showOnboarding && stripeInstance ? (
        <ConnectComponentsProvider connectInstance={stripeInstance}>
          <ConnectAccountOnboarding
            onExit={() => {
              setShowOnboarding(false);
              setStripeInstance(null);
              utils.payments.sellerStatus.invalidate();
            }}
          />
        </ConnectComponentsProvider>
      ) : (
        <button
          onClick={handleStartOnboarding}
          disabled={createSession.isPending}
          className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
        >
          {createSession.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {status?.status === "pending" ? "Continue Setup" : "Connect Stripe Account"}
        </button>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

function SettingsPageInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const stripeReturn = searchParams.get("stripe");
  const { data: me } = trpc.users.me.useQuery();
  const utils = trpc.useUtils();
  const [saved, setSaved] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: me
      ? {
          name: me.name ?? "",
          bio: me.bio ?? "",
          locationCity: me.locationCity ?? "",
          locationState: me.locationState ?? "",
        }
      : undefined,
  });

  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      setSaved(true);
      utils.users.me.invalidate();
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    let locationLat: number | undefined;
    let locationLng: number | undefined;

    // Auto-geocode city/state to lat/lng
    if (data.locationCity || data.locationState) {
      try {
        const q = [data.locationCity, data.locationState].filter(Boolean).join(", ");
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=us&limit=1`
        );
        const results = await res.json();
        if (results.length > 0) {
          locationLat = parseFloat(results[0].lat);
          locationLng = parseFloat(results[0].lon);
        }
      } catch {
        // Geocoding failed — save without coordinates
      }
    }

    updateProfile.mutate({ ...data, locationLat, locationLng });
  };

  const hasLocation = me?.locationLat && me?.locationLng;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {stripeReturn === "complete" && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800">
            Stripe setup complete! You can now receive payments from buyers.
          </p>
        </div>
      )}
      {stripeReturn === "refresh" && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm font-medium text-amber-800">
            Your Stripe onboarding session expired. Click &ldquo;Continue Setup&rdquo; below to try again.
          </p>
        </div>
      )}

      {/* Location card — prominent at the top */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-900">Your Location</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Your location is used as the default for all your listings. Buyers
          search by location to find gear nearby.
        </p>

        {hasLocation ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">
                {me?.locationCity}
                {me?.locationState ? `, ${me.locationState}` : ""}
              </span>
            </div>
            <button
              onClick={() => setLocationModalOpen(true)}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Change
            </button>
          </div>
        ) : (
          <button
            onClick={() => setLocationModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Set your location to help buyers find your gear
          </button>
        )}
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              {...register("name")}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              {...register("bio")}
              rows={3}
              placeholder="Tell others about your golf game..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                {...register("locationCity")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                {...register("locationState")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Seller Payments */}
      <SellerPaymentsCard />

      {/* Email info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Account</h2>
        <p className="text-sm text-gray-600">
          Signed in as{" "}
          <span className="font-medium text-gray-900">
            {session?.user?.email}
          </span>
        </p>
      </div>

      {/* Location modal — also updates profile */}
      <LocationSearchModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onApply={async ({ lat, lng, label }) => {
          // Parse city/state from the label
          const parts = label.split(",").map((p) => p.trim());
          const city = parts[0] || undefined;
          const state = parts[1] || undefined;
          updateProfile.mutate({
            locationCity: city,
            locationState: state,
            locationLat: lat,
            locationLng: lng,
          });
        }}
        initialLat={me?.locationLat ?? undefined}
        initialLng={me?.locationLng ?? undefined}
        initialLabel={
          me?.locationCity
            ? `${me.locationCity}${me.locationState ? `, ${me.locationState}` : ""}`
            : undefined
        }
        initialRadius={25}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 sm:px-6 py-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" /></div>}>
      <SettingsPageInner />
    </Suspense>
  );
}
