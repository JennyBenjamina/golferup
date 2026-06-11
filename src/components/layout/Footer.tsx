import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Marketplace
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link
                  href="/category/drivers"
                  className="hover:text-emerald-600"
                >
                  Drivers
                </Link>
              </li>
              <li>
                <Link href="/category/irons" className="hover:text-emerald-600">
                  Irons
                </Link>
              </li>
              <li>
                <Link
                  href="/category/putters"
                  className="hover:text-emerald-600"
                >
                  Putters
                </Link>
              </li>
              <li>
                <Link href="/category/bags" className="hover:text-emerald-600">
                  Bags
                </Link>
              </li>
              <li>
                <Link
                  href="/category/apparel"
                  className="hover:text-emerald-600"
                >
                  Apparel
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Community
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link
                  href="/community?cat=gear_talk"
                  className="hover:text-emerald-600"
                >
                  Gear Talk
                </Link>
              </li>
              <li>
                <Link
                  href="/community?cat=course_reviews"
                  className="hover:text-emerald-600"
                >
                  Course Reviews
                </Link>
              </li>
              <li>
                <Link
                  href="/community?cat=swing_tips"
                  className="hover:text-emerald-600"
                >
                  Swing Tips
                </Link>
              </li>
              <li>
                <Link
                  href="/community?cat=deals"
                  className="hover:text-emerald-600"
                >
                  Deals
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Support
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/help" className="hover:text-emerald-600">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-emerald-600">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-600">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Company
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-emerald-600">
                  About
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-600">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-emerald-600">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">G</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              Golf<span className="text-emerald-600">Only</span>
            </span>
          </div>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} GolfOnly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
