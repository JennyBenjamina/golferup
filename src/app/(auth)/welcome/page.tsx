"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function WelcomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      router.push("/");
    },
    onError: (err) => {
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  // Redirect unauthenticated users to login
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError("Please enter a nickname.");
      return;
    }
    if (trimmed.length > 50) {
      setError("Nickname must be 50 characters or less.");
      return;
    }
    setError("");
    updateProfile.mutate({ nickname: trimmed });
  };

  const handleSkip = () => {
    // If they skip, we still mark them as having seen the welcome screen
    // by setting nickname to their Google name
    updateProfile.mutate({ nickname: session?.user?.name ?? "Golfer" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo.svg"
            alt="GolfOnly"
            width={80}
            height={80}
            className="rounded-xl mx-auto"
            priority
          />
        </div>

        {/* Welcome card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 text-center mb-1">
            Welcome to GolfOnly!
          </h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            What would you like to be called on this site?
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={session?.user?.name ?? "Your nickname"}
                maxLength={50}
                autoFocus
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                This is how other users will see you on listings, messages, and the community.
              </p>
              {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="w-full py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Get Started"
              )}
            </button>
          </form>

          <button
            onClick={handleSkip}
            disabled={updateProfile.isPending}
            className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
