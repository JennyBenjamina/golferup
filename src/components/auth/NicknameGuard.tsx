"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * Checks if a logged-in user has set a nickname.
 * If not, redirects them to /welcome to choose one.
 * Wraps the main layout so every authenticated page is guarded.
 */
export function NicknameGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Only query when authenticated
  const { data: me, isLoading } = trpc.users.me.useQuery(undefined, {
    enabled: status === "authenticated",
    retry: false,
  });

  const needsNickname =
    status === "authenticated" && !isLoading && me && !me.nickname;

  useEffect(() => {
    if (needsNickname) {
      router.replace("/welcome");
    }
  }, [needsNickname, router]);

  // While checking, show a loading spinner for authenticated users
  // so they don't see a flash of the page before redirect
  if (status === "authenticated" && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  // If redirect is about to happen, don't render the page
  if (needsNickname) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return <>{children}</>;
}
