import { Metadata } from "next";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Terms and Conditions - TechRaj Digital Services",
  description:
    "Terms and Conditions for TechRaj Digital Services Pvt. Ltd. Read our policies before using our services.",
};

export default function TermsPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12">
          <h1 className="text-3xl font-bold mb-2 text-slate-900">
            Terms and Conditions
          </h1>
          <p className="text-sm text-slate-500 mb-8">Last Updated: June 9, 2026</p>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Welcome to TechRaj Digital Services Pvt. Ltd. By accessing and using our website
            (techrajshop.com) and services, you agree to comply with these Terms and Conditions.
          </p>

          {/* Company Info Card */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-indigo-700 mb-4">1. Company Information</h2>
            <ul className="space-y-1.5 text-sm text-slate-700">
              <li><span className="font-semibold">Company Name:</span> TechRaj Digital Services Pvt. Ltd.</li>
              <li><span className="font-semibold">Website:</span> techrajshop.com</li>
              <li><span className="font-semibold">Email:</span> techraj687yt@gmail.com</li>
              <li><span className="font-semibold">Phone / WhatsApp:</span> +977 9846908072</li>
              <li><span className="font-semibold">Address:</span> Bharatpur, Chitwan, Nepal</li>
            </ul>
          </div>

          <div className="space-y-8 text-slate-600">
            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">2. Services Offered</h2>
              <p className="mb-3">TechRaj provides various digital services including but not limited to:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm leading-relaxed">
                <li>TikTok Coin Purchases</li>
                <li>TikTok Withdrawal Services</li>
                <li>PayPal Services</li>
                <li>International Card Services</li>
                <li>In-Game Purchases</li>
                <li>VIP Subscriptions</li>
                <li>Website Development</li>
                <li>Digital Marketing Services</li>
                <li>Social Media Services</li>
                <li>Meta Advertising Services</li>
                <li>Gift Cards</li>
                <li>USD Buy/Sell Services</li>
                <li>Other Digital Solutions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">3. Eligibility</h2>
              <p className="leading-relaxed">
                Customers must be at least 16 years old to use our services. Users under 18 years
                should obtain parental or guardian consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">4. Prohibited Activities</h2>
              <p className="mb-3">Users are strictly prohibited from:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm leading-relaxed">
                <li>Engaging in fraudulent transactions.</li>
                <li>Participating in illegal activities using our services.</li>
                <li>Sending spam or abusing our support channels.</li>
                <li>Attempting unauthorized access to our systems.</li>
                <li>Providing false information during transactions.</li>
              </ul>
              <p className="mt-4 text-sm bg-red-50 border border-red-100 text-red-700 rounded-lg px-4 py-3">
                Violation of these terms may result in immediate suspension or permanent termination
                of services without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">5. Pricing and Payments</h2>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm leading-relaxed">
                <li>Prices are subject to change without prior notice.</li>
                <li>Accepted payment methods include eSewa, Khalti, and Bank Transfer.</li>
                <li>Full payment may be required before service processing begins.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">6. Service Delivery</h2>
              <p className="leading-relaxed">
                Most digital services are delivered within 5 minutes. However, delivery times may vary
                depending on service availability, verification requirements, and third-party processing times.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">7. Customer Responsibility</h2>
              <p className="leading-relaxed">
                Customers are responsible for providing accurate information necessary for service
                fulfillment. TechRaj shall not be liable for losses resulting from incorrect information
                provided by customers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">8. Account Safety Disclaimer</h2>
              <p className="leading-relaxed">
                Once a service has been successfully delivered and confirmed by the customer,
                TechRaj cannot guarantee the future safety, security, or status of third-party accounts,
                subscriptions, or digital products.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">9. Limitation of Liability</h2>
              <p className="leading-relaxed">
                TechRaj Digital Services Pvt. Ltd. shall not be held liable for indirect, incidental, or
                consequential damages arising from the use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">10. Dispute Resolution</h2>
              <p className="leading-relaxed">
                Customers must first contact TechRaj Internal Support to resolve disputes. If disputes
                cannot be resolved internally, legal actions may be pursued through applicable cyber
                laws and legal authorities of Nepal.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-indigo-600 mb-3">11. Modification of Terms</h2>
              <p className="leading-relaxed">
                TechRaj reserves the right to modify these Terms and Conditions at any time.
                Continued use of our services constitutes acceptance of any revised terms.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100 text-sm text-slate-400">
            For questions regarding these terms, contact us at{" "}
            <a href="mailto:techraj687yt@gmail.com" className="text-indigo-500 hover:underline">
              techraj687yt@gmail.com
            </a>{" "}
            or WhatsApp{" "}
            <a href="https://wa.me/9779846908072" className="text-indigo-500 hover:underline">
              +977 9846908072
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
