import { Mail, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
      <p className="text-gray-600 mb-8">
        Have a question, feedback, or need help? We'd love to hear from you.
      </p>

      <div className="space-y-6">
        {/* Email */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Email</h2>
              <p className="text-sm text-gray-500 mt-1">
                For general inquiries, support, or partnership opportunities.
              </p>
              <a
                href="mailto:TODO@golfonly.golf"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 mt-2 inline-block"
              >
                {/* TODO: Replace with your email */}
                TODO@golfonly.golf
              </a>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Location</h2>
              <p className="text-sm text-gray-500 mt-1">
                {/* TODO: Replace with your city/state or full address */}
                California, United States
              </p>
            </div>
          </div>
        </div>

        {/* Response Time */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Response Time</h2>
              <p className="text-sm text-gray-500 mt-1">
                We typically respond within 24–48 business hours.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ hint */}
      <div className="mt-10 p-6 bg-gray-50 rounded-xl text-center">
        <p className="text-sm text-gray-600">
          Before reaching out, check our{" "}
          <a href="/faq" className="text-emerald-600 hover:underline font-medium">
            Frequently Asked Questions
          </a>{" "}
          — your answer might already be there.
        </p>
      </div>
    </div>
  );
}
