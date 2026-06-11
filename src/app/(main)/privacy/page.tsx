export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: June 11, 2026</p>

      <div className="prose prose-gray prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. Introduction</h2>
          <p className="text-gray-700 leading-relaxed">
            GolfOnly ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains
            how we collect, use, disclose, and safeguard your information when you use our platform at golfonly.golf
            ("Service"). Please read this policy carefully.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. Information We Collect</h2>

          <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">Information You Provide</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Account information (name, email address, profile photo) provided through Google sign-in</li>
            <li>Profile details you choose to add (bio, location)</li>
            <li>Listing information (titles, descriptions, photos, pricing)</li>
            <li>Messages sent through the platform</li>
            <li>Community posts and comments</li>
          </ul>

          <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">Information Collected Automatically</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Device and browser information</li>
            <li>IP address and approximate location</li>
            <li>Pages viewed and actions taken on the Service</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">Payment Information</h3>
          <p className="text-gray-700 leading-relaxed">
            Payment processing is handled entirely by Stripe. We do not store your credit card numbers, bank account
            details, or other financial information on our servers. Please refer to{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              Stripe's Privacy Policy
            </a>{" "}
            for information on how they handle your data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. How We Use Your Information</h2>
          <p className="text-gray-700 leading-relaxed">We use the information we collect to:</p>
          <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
            <li>Provide, operate, and maintain the Service</li>
            <li>Process transactions and send related notifications</li>
            <li>Enable communication between buyers and sellers</li>
            <li>Display listings in search results and location-based searches</li>
            <li>Send administrative messages, updates, and security alerts</li>
            <li>Detect and prevent fraud, abuse, and security issues</li>
            <li>Improve and personalize the Service</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. How We Share Your Information</h2>
          <p className="text-gray-700 leading-relaxed">We may share your information in the following circumstances:</p>
          <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
            <li>
              <strong>With other users:</strong> Your profile name, location (city/state), listings, reviews, and
              community posts are visible to other users of the Service.
            </li>
            <li>
              <strong>With service providers:</strong> We share information with third-party providers that help us
              operate the Service, including Stripe (payments), Cloudinary (image hosting), and Neon (database hosting).
            </li>
            <li>
              <strong>For legal reasons:</strong> We may disclose information if required by law, regulation, or legal
              process, or if we believe disclosure is necessary to protect rights, safety, or property.
            </li>
            <li>
              <strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets, your
              information may be transferred as part of that transaction.
            </li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-3">
            We do not sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. Cookies and Tracking</h2>
          <p className="text-gray-700 leading-relaxed">
            We use cookies and similar technologies to maintain your session, remember your preferences, and understand
            how you use the Service. You can control cookies through your browser settings, but disabling them may
            affect functionality.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">6. Data Retention</h2>
          <p className="text-gray-700 leading-relaxed">
            We retain your information for as long as your account is active or as needed to provide the Service. If you
            request account deletion, we will remove your personal information within a reasonable timeframe, except where
            we are required to retain it for legal or legitimate business purposes (such as transaction records).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">7. Data Security</h2>
          <p className="text-gray-700 leading-relaxed">
            We implement reasonable technical and organizational measures to protect your information against unauthorized
            access, alteration, disclosure, or destruction. However, no method of transmission over the internet or
            electronic storage is completely secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">8. Your Rights</h2>
          <p className="text-gray-700 leading-relaxed">Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to or restrict certain processing of your data</li>
            <li>Request a copy of your data in a portable format</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-3">
            To exercise any of these rights, please contact us at the email address below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">9. California Privacy Rights</h2>
          <p className="text-gray-700 leading-relaxed">
            If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA),
            including the right to know what personal information we collect, the right to request deletion, and the right
            to opt out of the sale of personal information. As noted above, we do not sell personal information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">10. Children's Privacy</h2>
          <p className="text-gray-700 leading-relaxed">
            The Service is not intended for users under the age of 18. We do not knowingly collect personal information
            from children. If we become aware that we have collected information from a child under 18, we will take steps
            to delete that information promptly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">11. Third-Party Links</h2>
          <p className="text-gray-700 leading-relaxed">
            The Service may contain links to third-party websites or services. We are not responsible for the privacy
            practices of those third parties. We encourage you to review their privacy policies before providing any
            personal information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">12. Changes to This Policy</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update this Privacy Policy from time to time. If we make material changes, we will notify you through
            the Service or by other means. Your continued use of the Service after changes become effective constitutes
            your acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">13. Contact Us</h2>
          <p className="text-gray-700 leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:support@golfonly.golf" className="text-emerald-600 hover:underline">
              support@golfonly.golf
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
