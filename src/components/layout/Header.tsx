"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/contexts/LocationContext";
import { LocationSearchModal } from "@/components/listings/LocationSearchModal";

function UnreadBadge() {
  const { data: session } = useSession();
  const { data } = trpc.messages.unreadCount.useQuery(undefined, {
    enabled: !!session,
    refetchInterval: 10000,
  });

  if (!data?.count) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4.5 h-4.5 min-w-[18px] rounded-full flex items-center justify-center text-[10px] font-bold">
      {data.count > 9 ? "9+" : data.count}
    </span>
  );
}

function useSellerSetupNeeded() {
  const { data: session } = useSession();
  const { data: status } = trpc.payments.sellerStatus.useQuery(undefined, {
    enabled: !!session,
    staleTime: 60000,
    retry: false,
  });
  // Only show notification if we got a definitive non-active status
  // If the query hasn't loaded yet or errored, don't nag the user
  if (!status) return false;
  return status.status !== "active";
}

import {
  Search,
  Plus,
  MessageCircle,
  User,
  Menu,
  X,
  LogOut,
  ShoppingBag,
  Users,
  Settings,
  Heart,
  MapPin,
  Tag,
  CreditCard,
} from "lucide-react";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const { location, setLocation } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const sellerSetupNeeded = useSellerSetupNeeded();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Include location params in search if location is set
      const params = new URLSearchParams();
      params.set("q", searchQuery.trim());
      if (location) {
        params.set("lat", String(location.lat));
        params.set("lng", String(location.lng));
        params.set("radius", String(location.radiusMiles));
        params.set("label", location.label);
      }
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="/logo.svg"
              alt="GolfOnly"
              width={40}
              height={40}
              className="rounded-lg"
              priority
            />
          </Link>

          {/* Location + Search bar - desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8 items-center gap-2">
            <button
              onClick={() => setLocationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors shrink-0"
              title={location ? `${location.label} · ${location.radiusMiles} mi` : "Set location"}
            >
              <MapPin className={`w-4 h-4 ${location ? "text-emerald-600" : "text-gray-400"}`} />
              <span className={`max-w-[120px] truncate ${location ? "text-emerald-700 font-medium" : "text-gray-500"}`}>
                {location ? location.label : "Location"}
              </span>
            </button>
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clubs, bags, apparel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/community"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Users className="w-4 h-4" />
              Community
            </Link>
            {session ? (
              <>
                <Link
                  href="/sell"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-full hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Sell
                </Link>
                <Link
                  href="/messages"
                  className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <UnreadBadge />
                </Link>
                <div className="relative ml-1">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="relative flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-emerald-700" />
                      </div>
                    )}
                    {sellerSetupNeeded && (
                      <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
                    )}
                  </button>
                  {mobileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      {sellerSetupNeeded && (
                        <>
                          <Link
                            href="/settings"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <CreditCard className="w-4 h-4" />
                            <div>
                              <span className="font-medium">Connect Stripe</span>
                              <p className="text-xs text-amber-600 mt-0.5">Set up payments to sell</p>
                            </div>
                          </Link>
                          <hr className="my-1" />
                        </>
                      )}
                      <Link
                        href={`/profile/${session.user?.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        My Listings
                      </Link>
                      <Link
                        href="/offers"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Tag className="w-4 h-4" />
                        Offers
                      </Link>
                      <Link
                        href="/saved"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Heart className="w-4 h-4" />
                        Saved
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => signIn()}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-full hover:bg-emerald-700 transition-colors"
              >
                Sign In
              </button>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clubs, bags, apparel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </form>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/community"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Users className="w-4 h-4" />
              Community
            </Link>
            {session ? (
              <>
                {sellerSetupNeeded && (
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-amber-700 bg-amber-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <CreditCard className="w-4 h-4" />
                    <div>
                      <span className="font-medium">Connect Stripe</span>
                      <p className="text-xs text-amber-600 mt-0.5">Set up payments to sell</p>
                    </div>
                  </Link>
                )}
                <Link
                  href="/sell"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Plus className="w-4 h-4" />
                  Sell Something
                </Link>
                <Link
                  href="/messages"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MessageCircle className="w-4 h-4" />
                  Messages
                </Link>
                <Link
                  href={`/profile/${session.user?.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingBag className="w-4 h-4" />
                  My Listings
                </Link>
                <Link
                  href="/offers"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Tag className="w-4 h-4" />
                  Offers
                </Link>
                <Link
                  href="/saved"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Heart className="w-4 h-4" />
                  Saved
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn()}
                className="w-full px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}

      {/* Location modal */}
      <LocationSearchModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onApply={(loc) => {
          setLocation(loc);
        }}
        initialLat={location?.lat}
        initialLng={location?.lng}
        initialLabel={location?.label}
        initialRadius={location?.radiusMiles}
      />
    </header>
  );
}
