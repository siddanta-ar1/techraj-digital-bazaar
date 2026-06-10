import { Metadata } from "next";

export const revalidate = false;

export const metadata: Metadata = {
  title: "FAQ - TechRaj Digital Services",
  description:
    "Frequently asked questions about TechRaj Digital Services — payments, delivery, refunds, and support.",
};

const faqs = [
  {
    q: "How can I contact TechRaj?",
    a: "You can contact us through WhatsApp, email, or our official social media platforms. For the fastest response, we highly recommend contacting us via WhatsApp at +977 9846908072 or email at techraj687yt@gmail.com.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We currently accept eSewa, Khalti, and Bank Transfer. Additional payment methods may be introduced in the future.",
  },
  {
    q: "How long does service delivery take?",
    a: "Most services are delivered within 5 minutes. However, delivery times may vary depending on service availability and verification requirements.",
  },
  {
    q: "Do you provide invoices?",
    a: "Yes. We provide digital invoices via email upon request or after successful transactions.",
  },
  {
    q: "What happens if my order cannot be completed?",
    a: "If we cannot complete your order, you will receive a refund according to our Refund Policy. Please see our Refund and Cancellation Policy page for full details.",
  },
  {
    q: "How can I request a refund?",
    a: "Refund requests can be submitted through our customer support channels — WhatsApp (+977 9846908072) or email (techraj687yt@gmail.com). You can also submit a request directly from your dashboard.",
  },
  {
    q: "Do you guarantee account safety?",
    a: "Once a service has been delivered and confirmed by the customer, TechRaj cannot guarantee the future safety or status of third-party accounts or services.",
  },
  {
    q: "Are prices subject to change?",
    a: "Yes. Prices may change without prior notice due to market conditions, supplier pricing, or service availability.",
  },
  {
    q: "What are your customer support hours?",
    a: "Our support team is available daily from 6:00 AM to 11:00 PM (Nepal Time).",
  },
  {
    q: "What activities are prohibited?",
    a: "Fraudulent transactions, illegal activities, and spam or abusive behavior toward our support channels are strictly prohibited. Violation may result in immediate suspension or permanent termination of services.",
  },
  {
    q: "What should I do if I have a dispute?",
    a: "Please contact TechRaj Internal Support first via WhatsApp or email. If the issue cannot be resolved internally, further action may be pursued through appropriate cyber legal channels in Nepal.",
  },
];

export default function FAQPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-500">
            Can&apos;t find an answer?{" "}
            <a
              href="https://wa.me/9779846908072"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline font-medium"
            >
              Chat with us on WhatsApp
            </a>
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {faqs.map((item, i) => (
            <details
              key={i}
              className="group bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none font-semibold text-slate-800 hover:bg-slate-50 transition-colors select-none">
                <span>{item.q}</span>
                {/* Chevron rotates on open */}
                <span className="shrink-0 text-indigo-500 transition-transform duration-200 group-open:rotate-180">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                {item.a}
              </div>
            </details>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 bg-indigo-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-indigo-200 text-sm mb-5">
            Our support team is available daily from 6 AM to 11 PM (Nepal Time).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/9779846908072"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-indigo-700 font-bold px-6 py-2.5 rounded-lg hover:bg-indigo-50 transition-colors text-sm"
            >
              WhatsApp Us
            </a>
            <a
              href="mailto:techraj687yt@gmail.com"
              className="bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-indigo-400 transition-colors text-sm border border-indigo-400"
            >
              Send an Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
