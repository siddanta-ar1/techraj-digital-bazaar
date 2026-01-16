import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - TechRaj Digital",
};

export default function TermsPage() {
  return (
    <div className="bg-slate-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-900">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose max-w-none prose-slate text-slate-600">
            <h3 className="text-xl font-semibold text-indigo-600 mt-8">
              1. Acceptance of Terms
            </h3>
            <p>
              By accessing TechRaj Digital Bazaar, you agree to be bound by
              these terms and all applicable laws and regulations.
            </p>

            <h3 className="text-xl font-semibold text-indigo-600 mt-8">
              2. Digital Products
            </h3>
            <p>
              All sales of digital codes (Game Top-ups, Gift Cards) are final.
              Once a code is delivered or viewed, it cannot be returned or
              refunded.
            </p>

            <h3 className="text-xl font-semibold text-indigo-600 mt-8">
              3. Wallet System
            </h3>
            <p>
              Funds added to your wallet are non-transferable and may only be
              used for purchasing products on this platform.
            </p>

            <h3 className="text-xl font-semibold text-indigo-600 mt-8">
              4. User Responsibilities
            </h3>
            <p>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities under your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
