"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Loader2, MapPin, AlertCircle } from "lucide-react";
import { ImageUpload } from "@/components/listings/ImageUpload";
import { LocationSearchModal } from "@/components/listings/LocationSearchModal";
import Link from "next/link";

const listingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price"),
  condition: z.enum(["new", "like_new", "excellent", "good", "fair", "poor"]),
  category: z.enum([
    "drivers", "woods", "hybrids", "irons", "wedges", "putters",
    "complete_sets", "bags", "push_carts", "rangefinders", "gps_devices",
    "apparel", "shoes", "gloves", "balls", "accessories", "training_aids", "miscellaneous", "other",
  ]),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  flex: z.string().max(50).optional(),
  loft: z.string().max(50).optional(),
  hand: z.enum(["right", "left"]).optional(),
  locationCity: z.string().max(255).optional(),
  locationState: z.string().max(100).optional(),
});

type ListingFormData = z.infer<typeof listingSchema>;

const conditions = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const categories = [
  { value: "drivers", label: "Drivers" },
  { value: "woods", label: "Fairway Woods" },
  { value: "hybrids", label: "Hybrids" },
  { value: "irons", label: "Irons" },
  { value: "wedges", label: "Wedges" },
  { value: "putters", label: "Putters" },
  { value: "complete_sets", label: "Complete Sets" },
  { value: "bags", label: "Bags" },
  { value: "push_carts", label: "Push Carts" },
  { value: "rangefinders", label: "Rangefinders" },
  { value: "gps_devices", label: "GPS Devices" },
  { value: "apparel", label: "Apparel" },
  { value: "shoes", label: "Shoes" },
  { value: "gloves", label: "Gloves" },
  { value: "balls", label: "Balls" },
  { value: "accessories", label: "Accessories" },
  { value: "training_aids", label: "Training Aids" },
  { value: "miscellaneous", label: "Miscellaneous" },
  { value: "other", label: "Other" },
];

export default function SellPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [locationOverride, setLocationOverride] = useState<{
    city?: string;
    state?: string;
    lat?: number;
    lng?: number;
  } | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Fetch seller profile for location pre-fill
  const { data: me } = trpc.users.me.useQuery();
  const sellerHasLocation = !!(me?.locationLat && me?.locationLng);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      condition: "good",
      category: "drivers",
      hand: "right",
    },
  });

  const createListing = trpc.listings.create.useMutation({
    onSuccess: (listing) => {
      router.push(`/listing/${listing?.id}`);
    },
  });

  // Determine effective location for this listing
  const effectiveLocation = locationOverride ?? {
    city: me?.locationCity ?? undefined,
    state: me?.locationState ?? undefined,
    lat: me?.locationLat ?? undefined,
    lng: me?.locationLng ?? undefined,
  };
  const hasEffectiveLocation = !!(effectiveLocation.lat && effectiveLocation.lng);

  const onSubmit = async (data: ListingFormData) => {
    let locationLat: number | undefined;
    let locationLng: number | undefined;
    let locationCity = data.locationCity;
    let locationState = data.locationState;

    if (locationOverride) {
      // Use the override location
      locationLat = locationOverride.lat;
      locationLng = locationOverride.lng;
      locationCity = locationOverride.city;
      locationState = locationOverride.state;
    } else if (data.locationCity || data.locationState) {
      // Auto-geocode the manually entered city/state
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
        // Geocoding failed — backend will fall back to seller profile
      }
    }
    // If no location provided at all, the backend will inherit from seller profile

    createListing.mutate({
      ...data,
      images,
      locationCity,
      locationState,
      locationLat,
      locationLng,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        List Your Golf Gear
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Photos */}
        <ImageUpload images={images} onChange={setImages} maxImages={10} />

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Title
          </label>
          <input
            {...register("title")}
            placeholder="e.g., TaylorMade Stealth 2 Driver 10.5°"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {errors.title && (
            <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Price
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              {...register("price")}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          {errors.price && (
            <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
          )}
        </div>

        {/* Category and Condition - side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Category
            </label>
            <select
              {...register("category")}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Condition
            </label>
            <select
              {...register("condition")}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            >
              {conditions.map((cond) => (
                <option key={cond.value} value={cond.value}>
                  {cond.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Brand and Model */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Brand
            </label>
            <input
              {...register("brand")}
              placeholder="e.g., TaylorMade"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Model
            </label>
            <input
              {...register("model")}
              placeholder="e.g., Stealth 2"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Golf-specific fields */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Hand
            </label>
            <select
              {...register("hand")}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            >
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Flex
            </label>
            <input
              {...register("flex")}
              placeholder="e.g., Stiff"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Loft
            </label>
            <input
              {...register("loft")}
              placeholder="e.g., 10.5°"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Description
          </label>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Describe the condition, any defects, what's included..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Location
          </label>

          {!sellerHasLocation && !locationOverride ? (
            /* No location set anywhere — prompt the seller */
            <div className="border-2 border-dashed border-amber-300 bg-amber-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Set your location so buyers can find you
                  </p>
                  <p className="text-sm text-amber-600 mt-1">
                    Listings without a location won&apos;t appear in nearby searches.
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => setLocationModalOpen(true)}
                      className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Set Location
                    </button>
                    <Link
                      href="/settings"
                      className="text-sm text-amber-700 hover:text-amber-800 underline"
                    >
                      Or set it in Settings
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Location is available — show it with override option */
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-gray-700">
                  {effectiveLocation.city}
                  {effectiveLocation.state ? `, ${effectiveLocation.state}` : ""}
                  {!locationOverride && sellerHasLocation && (
                    <span className="text-gray-400 ml-1">(from your profile)</span>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Change
              </button>
            </div>
          )}

          {/* Hidden inputs so form validation still works */}
          <input type="hidden" {...register("locationCity")} value={effectiveLocation.city ?? ""} />
          <input type="hidden" {...register("locationState")} value={effectiveLocation.state ?? ""} />
        </div>

        {/* Location modal for per-listing override */}
        <LocationSearchModal
          open={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          onApply={({ lat, lng, label }) => {
            const parts = label.split(",").map((p) => p.trim());
            setLocationOverride({
              city: parts[0] || undefined,
              state: parts[1] || undefined,
              lat,
              lng,
            });
          }}
          initialLat={effectiveLocation.lat}
          initialLng={effectiveLocation.lng}
          initialLabel={
            effectiveLocation.city
              ? `${effectiveLocation.city}${effectiveLocation.state ? `, ${effectiveLocation.state}` : ""}`
              : undefined
          }
          initialRadius={25}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={createListing.isPending}
          className="w-full py-3 bg-emerald-600 text-white font-medium rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {createListing.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Posting...
            </>
          ) : (
            "Post Listing"
          )}
        </button>
      </form>
    </div>
  );
}
