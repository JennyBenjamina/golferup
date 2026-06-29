"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Heart,
  Share2,
  Flag,
  MessageCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  Tag,
  Check,
  X as XIcon,
  DollarSign,
} from "lucide-react";
import { formatPrice, formatCondition, formatCategory, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { OfferModal } from "@/components/listings/OfferModal";
import { PaymentCountdown } from "@/components/listings/PaymentCountdown";

function OwnerOffers({ listingId, askingPrice }: { listingId: string; askingPrice: string }) {
  const { data: offersList, isLoading } = trpc.offers.byListing.useQuery({ listingId });
  const utils = trpc.useUtils();
  const [acceptTarget, setAcceptTarget] = useState<string | null>(null);
  const [deadlineHours, setDeadlineHours] = useState(24);

  const accept = trpc.offers.accept.useMutation({
    onSuccess: () => {
      utils.offers.byListing.invalidate({ listingId });
      setAcceptTarget(null);
    },
  });
  const decline = trpc.offers.decline.useMutation({
    onSuccess: () => utils.offers.byListing.invalidate({ listingId }),
  });

  if (isLoading) return null;
  if (!offersList?.length) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-emerald-600" />
        <h2 className="text-sm font-semibold text-gray-900">
          Offers ({offersList.length})
        </h2>
        <Link href="/offers" className="ml-auto text-xs text-emerald-600 hover:text-emerald-700">
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {offersList.map((item) => (
          <div key={item.offer.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              {item.buyer.image ? (
                <img src={item.buyer.image} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {item.buyer.nickname ?? item.buyer.name ?? "Anonymous"}{" "}
                  <span className="font-normal text-gray-500">offered</span>{" "}
                  {formatPrice(item.offer.amount)}
                </p>
                {item.offer.message && (
                  <p className="text-xs text-gray-500 truncate">{item.offer.message}</p>
                )}
              </div>
              {item.offer.status === "pending" && acceptTarget !== item.offer.id ? (
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setAcceptTarget(item.offer.id);
                      setDeadlineHours(24);
                    }}
                    className="p-1.5 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200"
                    title="Accept"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => decline.mutate({ offerId: item.offer.id })}
                    disabled={decline.isPending}
                    className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 disabled:opacity-50"
                    title="Decline"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : item.offer.status === "accepted" ? (
                <div className="flex items-center gap-2 shrink-0">
                  {item.offer.paymentDeadline && (
                    <PaymentCountdown
                      deadline={item.offer.paymentDeadline}
                      compact
                      onExpired={() => utils.offers.byListing.invalidate({ listingId })}
                    />
                  )}
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    accepted
                  </span>
                </div>
              ) : item.offer.status !== "pending" ? (
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0",
                  item.offer.status === "declined" ? "bg-red-100 text-red-600" :
                  item.offer.status === "countered" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-500"
                )}>
                  {item.offer.status}
                </span>
              ) : null}
            </div>
            {/* Inline deadline picker when accepting */}
            {acceptTarget === item.offer.id && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Payment deadline for buyer:
                </p>
                <div className="flex items-center gap-2 mb-2">
                  {[12, 24, 48, 72].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDeadlineHours(h)}
                      className={cn(
                        "px-2 py-1 text-xs rounded-full border transition-colors",
                        deadlineHours === h
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "border-gray-300 text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      accept.mutate({ offerId: item.offer.id, deadlineHours })
                    }
                    disabled={accept.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-full hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept
                  </button>
                  <button
                    onClick={() => setAcceptTarget(null)}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const { data, isLoading } = trpc.listings.getById.useQuery({ id });
  const [currentImage, setCurrentImage] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Check if buyer has an accepted offer on this listing
  const { data: myOfferData } = trpc.offers.byListing.useQuery(
    { listingId: id },
    { enabled: !!session }
  );
  const acceptedOffer = myOfferData?.find(
    (o) => o.offer.status === "accepted" && o.offer.buyerId === session?.user?.id
  );

  const createCheckout = trpc.payments.createCheckout.useMutation({
    onSuccess: (result) => {
      if (result.transactionId) {
        router.push(`/checkout/${result.transactionId}`);
      }
    },
  });

  const startConversation = trpc.messages.startConversation.useMutation({
    onSuccess: () => {
      router.push("/messages");
    },
  });

  const utils = trpc.useUtils();
  const { data: savedData } = trpc.savedListings.checkSaved.useQuery(
    { listingIds: [id] },
    { enabled: !!session }
  );
  const isSaved = savedData?.savedIds?.includes(id) ?? false;

  const toggleSave = trpc.savedListings.toggle.useMutation({
    onSuccess: () => {
      utils.savedListings.checkSaved.invalidate();
      utils.savedListings.list.invalidate();
    },
  });

  const [shareCopied, setShareCopied] = useState(false);
  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = data?.listing?.title ?? "Check out this listing on GolfOnly";

    // Use native share sheet on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [data?.listing?.title]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-32" />
            <div className="h-6 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Listing not found
        </h1>
        <p className="text-gray-600 mb-6">
          This listing may have been removed or sold.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700"
        >
          Browse Listings
        </Link>
      </div>
    );
  }

  const { listing, seller } = data;
  const images = listing.images ?? [];
  const isOwner = session?.user?.id === listing.sellerId;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
            {images.length > 0 ? (
              <>
                <img
                  src={images[currentImage]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImage(
                          (prev) => (prev - 1 + images.length) % images.length
                        )
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentImage((prev) => (prev + 1) % images.length)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImage(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === currentImage ? "bg-white" : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No images
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${
                    i === currentImage
                      ? "border-emerald-600"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(listing.price)}
              </p>
              <h1 className="text-xl text-gray-800 mt-1">{listing.title}</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => session && toggleSave.mutate({ listingId: id })}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  isSaved
                    ? "bg-red-50 hover:bg-red-100"
                    : "bg-gray-100 hover:bg-gray-200"
                )}
              >
                <Heart
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isSaved ? "fill-red-500 text-red-500" : "text-gray-600"
                  )}
                />
              </button>
              <button
                onClick={handleShare}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 relative"
                title="Share listing"
              >
                {shareCopied ? (
                  <Check className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Share2 className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
              {formatCondition(listing.condition)}
            </span>
            <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
              {formatCategory(listing.category)}
            </span>
            {listing.brand && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                {listing.brand}
              </span>
            )}
            {listing.hand && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                {listing.hand === "right" ? "Right-Handed" : "Left-Handed"}
              </span>
            )}
            {listing.flex && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                {listing.flex} Flex
              </span>
            )}
            {listing.loft && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                {listing.loft}
              </span>
            )}
            {listing.shaft && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                {listing.shaft}
              </span>
            )}
            {listing.serialNumber && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                S/N: {listing.serialNumber}
              </span>
            )}
            {listing.size && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                Size {listing.size}
              </span>
            )}
            {listing.gender && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                {listing.gender === "mens" ? "Men's" : listing.gender === "womens" ? "Women's" : "Unisex"}
              </span>
            )}
            {listing.wheelCount && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                {listing.wheelCount}-Wheel
              </span>
            )}
            {listing.color && (
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                {listing.color}
              </span>
            )}
          </div>

          {listing.locationCity && (
            <p className="flex items-center gap-1 text-sm text-gray-500 mb-4">
              <MapPin className="w-4 h-4" />
              {listing.locationCity}
              {listing.locationState ? `, ${listing.locationState}` : ""}
            </p>
          )}

          <p className="text-sm text-gray-500 mb-6">
            Listed {timeAgo(listing.createdAt)}
          </p>

          {/* Description */}
          {listing.description && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">
                Description
              </h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>
          )}

          {/* Owner: show offers on this listing */}
          {isOwner && <OwnerOffers listingId={listing.id} askingPrice={listing.price} />}

          {/* Action buttons */}
          {!isOwner && (
            <div className="space-y-3 mb-8">
              {acceptedOffer?.offer.paymentDeadline ? (
                <>
                  {/* Buyer has an accepted offer — show countdown + pay */}
                  <PaymentCountdown
                    deadline={acceptedOffer.offer.paymentDeadline}
                    onExpired={() => utils.offers.byListing.invalidate({ listingId: id })}
                  />
                  <button
                    onClick={() =>
                      createCheckout.mutate({
                        listingId: listing.id,
                        offerId: acceptedOffer.offer.id,
                      })
                    }
                    disabled={createCheckout.isPending}
                    className="w-full py-3 bg-emerald-600 text-white font-medium rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {createCheckout.isPending
                      ? "Processing..."
                      : `Pay Now — ${formatPrice(acceptedOffer.offer.amount)}`}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() =>
                      createCheckout.mutate({ listingId: listing.id })
                    }
                    disabled={
                      createCheckout.isPending || listing.status === "reserved"
                    }
                    className="w-full py-3 bg-emerald-600 text-white font-medium rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {listing.status === "reserved"
                      ? "Reserved"
                      : createCheckout.isPending
                      ? "Processing..."
                      : `Buy Now — ${formatPrice(listing.price)}`}
                  </button>
                  {listing.status !== "reserved" && (
                    <button
                      onClick={() => setShowOfferModal(true)}
                      className="w-full py-3 border border-emerald-600 text-emerald-600 font-medium rounded-full hover:bg-emerald-50 transition-colors"
                    >
                      Make an Offer
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => {
                  startConversation.mutate({
                    recipientId: listing.sellerId,
                    listingId: listing.id,
                  });
                }}
                disabled={startConversation.isPending}
                className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4" />
                {startConversation.isPending ? "Opening..." : "Message Seller"}
              </button>
              {createCheckout.error && (
                <p className="text-sm text-red-600 text-center">
                  {createCheckout.error.message}
                </p>
              )}
            </div>
          )}

          {showOfferModal && (
            <OfferModal
              listingId={listing.id}
              listingTitle={listing.title}
              askingPrice={listing.price}
              onClose={() => setShowOfferModal(false)}
              onSuccess={() => {}}
            />
          )}

          {/* Seller info */}
          <div className="border-t border-gray-200 pt-6">
            <Link
              href={`/profile/${seller.id}`}
              className="flex items-center gap-3 group"
            >
              {seller.image ? (
                <img
                  src={seller.image}
                  alt=""
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 font-semibold">
                    {(seller.nickname ?? seller.name)?.charAt(0) ?? "?"}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900 group-hover:text-emerald-600">
                  {seller.nickname ?? seller.name ?? "Anonymous"}
                </p>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span>
                    {seller.ratingAvg ?? "0"} ({seller.ratingCount ?? 0}{" "}
                    reviews)
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Report */}
          <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-4">
            <Flag className="w-3 h-3" />
            Report this listing
          </button>
        </div>
      </div>
    </div>
  );
}
