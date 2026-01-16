import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - TechRaj Digital",
};

export default function PrivacyPage() {
  return (
    <div className="bg-slate-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-900">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose max-w-none prose-slate text-slate-600">
            <h3 className="text-xl font-semibold text-indigo-600 mt-8">
              1. Information We Collect
            </h3>
            <p>
              We collect information you provide directly to us, including your
              name, email address, phone number, and payment verification
              screenshots.
            </p>

            <h3 className="text-xl font-semibold text-indigo-600 mt-8">
              2. How We Use Your Information
            </h3>
            <p>
              Your information is used to process transactions, send order
              updates, provide customer support, and improve our services. We do
              not sell or rent your data to third parties.
            </p>

            <h3 className="text-xl font-semibold text-indigo-600 mt-8">
              3. Security
            </h3>
            <p>
              We apply industry-standard security measures to protect your
              personal information from unauthorized access or disclosure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
