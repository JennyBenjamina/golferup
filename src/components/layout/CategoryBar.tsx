"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const categories = [
  { label: "All", value: "" },
  { label: "Drivers", value: "drivers" },
  { label: "Woods", value: "woods" },
  { label: "Irons", value: "irons" },
  { label: "Wedges", value: "wedges" },
  { label: "Putters", value: "putters" },
  { label: "Complete Sets", value: "complete_sets" },
  { label: "Bags", value: "bags" },
  { label: "Push Carts", value: "push_carts" },
  { label: "Rangefinders", value: "rangefinders" },
  { label: "Apparel", value: "apparel" },
  { label: "Shoes", value: "shoes" },
  { label: "Balls", value: "balls" },
  { label: "Accessories", value: "accessories" },
  { label: "Training Aids", value: "training_aids" },
  { label: "Miscellaneous", value: "miscellaneous" },
];

export function CategoryBar() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
          {categories.map((cat) => (
            <Link
              key={cat.value}
              href={cat.value ? `/?category=${cat.value}` : "/"}
              className={cn(
                "px-4 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors",
                activeCategory === cat.value
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
