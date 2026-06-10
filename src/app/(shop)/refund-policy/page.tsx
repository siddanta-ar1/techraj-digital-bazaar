import { Metadata } from "next";
import Link from "next/link";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy - TechRaj Digital Services",
  description:
    "Refund and Cancellation Policy for TechRaj Digital Services Pvt. Ltd.",
};

export default function RefundPolicyPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12">
          <h1 className="text-3xl font-bold mb-2 text-slate-900">
            Refund and Cancellation Policy
          </h1>
          <p className="text-sm text-slate-500 mb-8">Last Updated: June 9, 2026</p>
          <p className="text-slate-600 mb-8 leading-relaxed">
            TechRaj Digital Services Pvt. Ltd. follows a Moderate Refund Policy to ensure fairness
            for both customers and the company.
          </p>

          <div className="space-y-8 text-slate-600">
            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">1. Refund Eligibility</h2>
              <p className="mb-3">Customers may request refunds under the following circumstances:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm leading-relaxed">
                <li>The service has not yet been initiated.</li>
                <li>TechRaj is unable to complete the requested service.</li>
                <li>Technical issues on our side prevent successful service delivery.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">2. Partial Refunds</h2>
              <p className="leading-relaxed">
                Partial refunds may be issued if a service has been partially completed before cancellation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">3. Non-Refundable Situations</h2>
              <p className="mb-3">Refunds will <strong>NOT</strong> be provided if:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm leading-relaxed">
                <li>The service has been successfully completed and delivered.</li>
                <li>Customers change their minds after service completion.</li>
                <li>Incorrect information was provided by the customer.</li>
                <li>
                  Third-party platform actions (such as account suspensions or bans) occur after
                  successful service delivery.
                </li>
                <li>Digital goods, subscriptions, or top-ups have already been redeemed or activated.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">4. Refund Request Procedure</h2>
              <p className="mb-3">Refund requests must be submitted through:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm leading-relaxed">
                <li>
                  <a
                    href="https://wa.me/9779846908072"
                    className="text-indigo-500 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp Support (+977 9846908072)
                  </a>
                </li>
                <li>
                  <a href="mailto:techraj687yt@gmail.com" className="text-indigo-500 hover:underline">
                    Official Email Support (techraj687yt@gmail.com)
                  </a>
                </li>
                <li>Official Social Media Channels</li>
              </ul>
              <p className="mt-3 text-sm text-slate-500">
                Customers may be required to provide transaction details and supporting evidence.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">5. Refund Processing Time</h2>
              <p className="leading-relaxed">
                Approved refunds are processed within <strong>1–3 business days</strong> through the
                original payment method whenever possible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">6. Chargebacks</h2>
              <p className="leading-relaxed">
                Customers are encouraged to contact TechRaj Support before initiating chargebacks.
                Fraudulent chargebacks may result in account restrictions and legal action where applicable.
              </p>
            </section>
          </div>

          {/* CTA to request a refund */}
          <div className="mt-10 p-5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-800 text-sm">Need to request a refund?</p>
              <p className="text-xs text-slate-500 mt-0.5">
                You can submit a refund request from your dashboard.
              </p>
            </div>
            <Link
              href="/refund"
              className="shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              Request a Refund
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-sm text-slate-400">
            For questions regarding our refund policy, contact us at{" "}
            <a href="mailto:techraj687yt@gmail.com" className="text-indigo-500 hover:underline">
              techraj687yt@gmail.com
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
