"use client";

import { useState } from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchFilterValues {
  category?: string;
  condition?: string;
  brand?: string;
  hand?: "right" | "left";
  priceMin?: number;
  priceMax?: number;
  locationState?: string;
  radiusMiles?: number;
  sortBy: "relevance" | "price_asc" | "price_desc" | "newest" | "nearest";
}

interface SearchFiltersProps {
  values: SearchFilterValues;
  onChange: (values: SearchFilterValues) => void;
  totalResults: number;
}

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
];

const conditions = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const popularBrands = [
  "TaylorMade",
  "Callaway",
  "Titleist",
  "Ping",
  "Cobra",
  "Mizuno",
  "Cleveland",
  "Scotty Cameron",
  "Odyssey",
  "Vokey",
  "Bridgestone",
  "Srixon",
];

const sortOptions = [
  { value: "relevance", label: "Best Match" },
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "nearest", label: "Nearest First" },
];

export function SearchFilters({
  values,
  onChange,
  totalResults,
}: SearchFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const update = (partial: Partial<SearchFilterValues>) => {
    onChange({ ...values, ...partial });
  };

  const activeFilterCount = [
    values.category,
    values.condition,
    values.brand,
    values.hand,
    values.priceMin,
    values.priceMax,
    values.locationState,
  ].filter(Boolean).length;

  const clearAll = () => {
    onChange({
      sortBy: values.sortBy,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      {/* Top bar: sort + filter toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm rounded-full border transition-colors",
              expanded || activeFilterCount > 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-emerald-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {totalResults.toLocaleString()} result
            {totalResults !== 1 ? "s" : ""}
          </span>
          <select
            value={values.sortBy}
            onChange={(e) => update({ sortBy: e.target.value as SearchFilterValues["sortBy"] })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filter pills */}
      {activeFilterCount > 0 && !expanded && (
        <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-gray-100">
          {values.category && (
            <FilterPill
              label={categories.find((c) => c.value === values.category)?.label ?? values.category}
              onRemove={() => update({ category: undefined })}
            />
          )}
          {values.condition && (
            <FilterPill
              label={conditions.find((c) => c.value === values.condition)?.label ?? values.condition}
              onRemove={() => update({ condition: undefined })}
            />
          )}
          {values.brand && (
            <FilterPill
              label={values.brand}
              onRemove={() => update({ brand: undefined })}
            />
          )}
          {values.hand && (
            <FilterPill
              label={values.hand === "right" ? "Right-Handed" : "Left-Handed"}
              onRemove={() => update({ hand: undefined })}
            />
          )}
          {(values.priceMin || values.priceMax) && (
            <FilterPill
              label={`$${values.priceMin ?? 0} – $${values.priceMax ?? "∞"}`}
              onRemove={() => update({ priceMin: undefined, priceMax: undefined })}
            />
          )}
          {values.locationState && (
            <FilterPill
              label={values.locationState}
              onRemove={() => update({ locationState: undefined })}
            />
          )}
        </div>
      )}

      {/* Expanded filter panel */}
      {expanded && (
        <div className="px-4 py-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Category
            </label>
            <select
              value={values.category ?? ""}
              onChange={(e) =>
                update({ category: e.target.value || undefined })
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Condition
            </label>
            <select
              value={values.condition ?? ""}
              onChange={(e) =>
                update({ condition: e.target.value || undefined })
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Any Condition</option>
              {conditions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Brand
            </label>
            <select
              value={values.brand ?? ""}
              onChange={(e) => update({ brand: e.target.value || undefined })}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Any Brand</option>
              {popularBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Hand */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Hand
            </label>
            <select
              value={values.hand ?? ""}
              onChange={(e) =>
                update({
                  hand: (e.target.value || undefined) as
                    | "right"
                    | "left"
                    | undefined,
                })
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Either Hand</option>
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </div>

          {/* Price range */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Price Range
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Min"
                value={values.priceMin ?? ""}
                onChange={(e) =>
                  update({
                    priceMin: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-gray-400 text-xs">–</span>
              <input
                type="number"
                placeholder="Max"
                value={values.priceMax ?? ""}
                onChange={(e) =>
                  update({
                    priceMax: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Location / state */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              State
            </label>
            <input
              type="text"
              placeholder="e.g., CA"
              value={values.locationState ?? ""}
              onChange={(e) =>
                update({ locationState: e.target.value || undefined })
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-emerald-100 rounded-full p-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
