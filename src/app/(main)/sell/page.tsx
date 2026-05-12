"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/listings/ImageUpload";

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

  const onSubmit = (data: ListingFormData) => {
    createListing.mutate({
      ...data,
      images,
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              City
            </label>
            <input
              {...register("locationCity")}
              placeholder="e.g., Scottsdale"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              State
            </label>
            <input
              {...register("locationState")}
              placeholder="e.g., AZ"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

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
