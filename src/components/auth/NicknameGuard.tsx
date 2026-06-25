"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

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

  useEffect(() => {
    // Don't redirect if still loading or not authenticated
    if (status !== "authenticated" || isLoading) return;
    // Don't redirect if already on welcome or login
    if (pathname === "/welcome" || pathname === "/login") return;
    // Redirect if user has no nickname set
    if (me && !me.nickname) {
      router.push("/welcome");
    }
  }, [status, isLoading, me, pathname, router]);

  return <>{children}</>;
}
