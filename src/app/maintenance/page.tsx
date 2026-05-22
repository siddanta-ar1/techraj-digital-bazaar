import { Wrench, Clock, Mail, Phone } from "lucide-react";

export const metadata = {
  title: "Under Maintenance — Techraj Digital Shop",
  robots: { index: false },
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-indigo-100 rounded-3xl flex items-center justify-center shadow-lg">
              <Wrench className="w-12 h-12 text-indigo-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-md animate-bounce">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-black text-slate-900 mb-3">
          We&apos;re Under Maintenance
        </h1>
        <p className="text-lg text-slate-500 mb-8 leading-relaxed">
          Techraj Digital Shop is temporarily unavailable while we perform
          scheduled maintenance. We&apos;ll be back shortly!
        </p>

        {/* Status card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
            <span className="font-semibold text-slate-700">Maintenance in progress</span>
          </div>
          <p className="text-sm text-slate-500 text-left">
            Our team is working hard to improve your experience. Thank you for
            your patience.
          </p>
        </div>

        {/* Contact */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:support@techrajshop.com"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md"
          >
            <Mail className="w-4 h-4" />
            Email Support
          </a>
          <a
            href="https://wa.me/9779846908072"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-md"
          >
            <Phone className="w-4 h-4" />
            WhatsApp Us
          </a>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Techraj Digital Shop &mdash; techrajshop.com
        </p>
      </div>
    </div>
  );
}
