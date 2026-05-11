export { auth as middleware } from "@/server/auth";

export const config = {
  matcher: [
    "/sell/:path*",
    "/messages/:path*",
    "/settings/:path*",
    "/api/trpc/:path*",
  ],
};
