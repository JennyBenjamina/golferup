"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const categories = [
  { label: "General", value: "general" },
  { label: "Gear Talk", value: "gear_talk" },
  { label: "Course Reviews", value: "course_reviews" },
  { label: "Swing Tips", value: "swing_tips" },
  { label: "Deals", value: "deals" },
] as const;

type PostCategory = (typeof categories)[number]["value"];

export default function NewPostPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<PostCategory>("general");

  const createPost = trpc.posts.create.useMutation({
    onSuccess: (post) => {
      router.push(`/community/${post.id}`);
    },
  });

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Sign in to post
        </h1>
        <p className="text-sm text-gray-600">
          You need to be signed in to create a post.
        </p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    createPost.mutate({
      title: title.trim(),
      body: body.trim(),
      category,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Community
      </Link>

      <h1 className="text-xl font-bold text-gray-900 mb-6">Create a Post</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "px-4 py-1.5 text-sm rounded-full transition-colors",
                  category === cat.value
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            maxLength={255}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/255</p>
        </div>

        {/* Body */}
        <div>
          <label
            htmlFor="body"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Body
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts, tips, or experiences..."
            rows={8}
            maxLength={10000}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            required
          />
          <p className="text-xs text-gray-400 mt-1">{body.length}/10,000</p>
        </div>

        {/* Error */}
        {createPost.error && (
          <p className="text-sm text-red-600">{createPost.error.message}</p>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/community"
            className="px-6 py-2.5 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={
              !title.trim() || !body.trim() || createPost.isPending
            }
            className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {createPost.isPending ? "Publishing..." : "Publish Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
