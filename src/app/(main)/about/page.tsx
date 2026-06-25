import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">About GolfOnly</h1>
      <p className="text-gray-600 mb-10 leading-relaxed">
        GolfOnly is a marketplace built by golfers, for golfers. We created this platform because
        we believe buying and selling used golf equipment should be simple, trustworthy, and tailored
        to the golf community — not buried in a general marketplace alongside everything else.
        Whether you're upgrading your bag or passing along clubs you've outgrown, GolfOnly is your
        dedicated space to connect with fellow golfers.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mb-6">Meet the Founders</h2>

      <div className="space-y-8">
        {/* Jamie Puterbaugh */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-32 h-32 rounded-xl overflow-hidden shrink-0 mx-auto sm:mx-0 relative">
              <Image
                src="/JP.png"
                alt="Jamie Puterbaugh"
                fill
                className="object-cover object-top"
                sizes="128px"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Jamie Puterbaugh</h3>
              <p className="text-sm text-emerald-600 font-medium mb-3">Co-Founder &middot; PGA Member</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Born and raised in Southern California, Jamie has spent his life immersed in the game
                of golf. As a PGA member, he brings years of experience in the golf industry — from
                teaching and club fitting to understanding what players at every level truly need in
                their bag. His firsthand knowledge of equipment and the golf community is at the heart
                of what makes GolfOnly a platform built with real golfers in mind.
              </p>
            </div>
          </div>
        </div>

        {/* Jenny Lee */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-32 h-32 rounded-xl overflow-hidden shrink-0 mx-auto sm:mx-0 relative">
              <Image
                src="/JL.jpg"
                alt="Jenny Lee"
                fill
                className="object-cover object-top"
                sizes="128px"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Jenny Lee</h3>
              <p className="text-sm text-emerald-600 font-medium mb-3">Co-Founder &middot; PGA Member</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Also a Southern California native, Jenny combines her passion for golf with a sharp
                eye for building products people love. A PGA member herself, she understands the
                frustrations golfers face when trying to buy or sell equipment online. Jenny drives
                the vision and technology behind GolfOnly, ensuring the platform is intuitive,
                trustworthy, and genuinely useful for the golf community.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="mt-10 p-6 bg-emerald-50 rounded-xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Our Mission</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          We started GolfOnly to give the golf community a dedicated, trusted place to buy and sell
          equipment. No clutter, no guesswork — just golfers helping golfers find the right gear at
          the right price. Every feature we build is guided by our experience on the course and
          behind the counter.
        </p>
      </div>
    </div>
  );
}
