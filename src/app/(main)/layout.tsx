import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NicknameGuard } from "@/components/auth/NicknameGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NicknameGuard>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </NicknameGuard>
  );
}
