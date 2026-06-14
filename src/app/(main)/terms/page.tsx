export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: June 11, 2026</p>

      <div className="prose prose-gray prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-700 leading-relaxed">
            By accessing or using the GolfOnly platform ("Service"), operated by GolfOnly ("we," "us," or "our"),
            you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. Description of Service</h2>
          <p className="text-gray-700 leading-relaxed">
            GolfOnly is an online marketplace that allows users to buy, sell, and trade golf equipment and related products.
            We provide the platform that connects buyers and sellers but are not a party to any transaction between users.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. User Accounts</h2>
          <p className="text-gray-700 leading-relaxed">
            You must create an account to use certain features of the Service. You are responsible for maintaining the
            confidentiality of your account credentials and for all activities that occur under your account. You agree to
            provide accurate and complete information when creating your account and to update your information as needed.
            You must be at least 18 years of age to create an account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. Listings and Transactions</h2>
          <p className="text-gray-700 leading-relaxed">
            Sellers are solely responsible for the accuracy of their listings, including descriptions, condition, pricing,
            and images. Buyers are responsible for reviewing listings carefully before making a purchase or offer. GolfOnly
            does not guarantee the quality, safety, or legality of items listed. All transactions are between the buyer
            and seller; GolfOnly acts only as a facilitator.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. Fees and Payments</h2>
          <p className="text-gray-700 leading-relaxed">
            GolfOnly charges a platform fee of 3% on each completed sale, which is deducted from the seller's proceeds.
            Payments are processed through our third-party payment provider, Stripe. By using the Service as a seller,
            you agree to Stripe's terms of service. Buyers pay the listed or agreed-upon price; there are no additional
            buyer fees at this time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">6. Prohibited Conduct</h2>
          <p className="text-gray-700 leading-relaxed">You agree not to:</p>
          <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
            <li>List counterfeit, stolen, or prohibited items</li>
            <li>Misrepresent the condition or authenticity of items</li>
            <li>Harass, threaten, or abuse other users</li>
            <li>Manipulate prices, feedback, or search results</li>
            <li>Use the Service for any unlawful purpose</li>
            <li>Circumvent the platform's payment system to avoid fees</li>
            <li>Create multiple accounts for deceptive purposes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">7. Content and Intellectual Property</h2>
          <p className="text-gray-700 leading-relaxed">
            You retain ownership of content you post on the Service (such as listing photos and descriptions). By posting
            content, you grant GolfOnly a non-exclusive, worldwide, royalty-free license to use, display, and distribute
            that content in connection with operating the Service. You represent that you have the right to post any content
            you submit.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">8. Disclaimers</h2>
          <p className="text-gray-700 leading-relaxed">
            The Service is provided "as is" and "as available" without warranties of any kind, either express or implied.
            We do not warrant that the Service will be uninterrupted, secure, or error-free. We are not responsible for
            the conduct of any user, the quality of items sold, or the outcome of any transaction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">9. Limitation of Liability</h2>
          <p className="text-gray-700 leading-relaxed">
            To the fullest extent permitted by law, GolfOnly shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly,
            or any loss of data, use, or goodwill arising out of your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">10. Termination</h2>
          <p className="text-gray-700 leading-relaxed">
            We reserve the right to suspend or terminate your account at our discretion, with or without notice, for conduct
            that we determine violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
            You may also delete your account at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">11. Changes to Terms</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update these Terms from time to time. If we make material changes, we will notify you through the Service
            or by other means. Your continued use of the Service after changes become effective constitutes your acceptance
            of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">12. Governing Law</h2>
          <p className="text-gray-700 leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the State of California,
            without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved
            in the courts located in Riverside County, California.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">13. Contact Us</h2>
          <p className="text-gray-700 leading-relaxed">
            If you have any questions about these Terms, please contact us at{" "}
            <a href="mailto:support@golfonly.golf" className="text-emerald-600 hover:underline">
              support@golfonly.golf
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
