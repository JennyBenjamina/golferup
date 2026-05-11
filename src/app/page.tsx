// This file exists because of a route conflict: both app/page.tsx and
// app/(main)/page.tsx map to "/". Next.js gives app/page.tsx priority,
// which bypasses the (main) layout (Header + Footer). The fix is to
// wrap the home page content with the same layout here.

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import HomePage from "./(main)/page";

export default function RootPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HomePage />
      </main>
      <Footer />
    </>
  );
}
