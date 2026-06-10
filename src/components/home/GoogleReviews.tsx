import { Star } from "lucide-react";

const GOOGLE_PROFILE_URL =
  "https://www.google.com/search?q=Techraj+Digital+Service+Pvt.+Ltd.&kgmid=/g/11mzn990kp";

const OVERALL_RATING = 4.8;
const TOTAL_REVIEWS = 47;

const reviews = [
  {
    name: "Sanjay Thapa",
    initials: "ST",
    rating: 5,
    date: "2 weeks ago",
    text: "Ordered PUBG UC and received the code within minutes. Super fast delivery and great customer support. Highly recommend TechRaj for all digital purchases!",
    color: "bg-indigo-500",
  },
  {
    name: "Priya Shrestha",
    initials: "PS",
    rating: 5,
    date: "1 month ago",
    text: "Best platform for digital products in Nepal. Got my Netflix subscription activated instantly. The wallet system makes repeat purchases very convenient.",
    color: "bg-emerald-500",
  },
  {
    name: "Bikash Karki",
    initials: "BK",
    rating: 5,
    date: "1 month ago",
    text: "Very trustworthy service. Bought Freefire diamonds multiple times. Always delivered fast and the prices are competitive. WhatsApp support is very responsive too!",
    color: "bg-amber-500",
  },
  {
    name: "Manisha Gurung",
    initials: "MG",
    rating: 4,
    date: "2 months ago",
    text: "Good service overall. Got my Steam gift card without any issues. Would definitely buy again. Just wish they had more payment options.",
    color: "bg-rose-500",
  },
];

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-7 h-7" };
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sizes[size]} ${
            i <= rating ? "text-amber-400 fill-amber-400" : "text-slate-300 fill-slate-300"
          }`}
        />
      ))}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleReviews() {
  return (
    <section className="py-14 bg-slate-50 border-t border-slate-100">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GoogleLogo />
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Google Reviews
              </span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 animate-fade-up">
              What Our Customers Say
            </h2>
            <div className="flex items-center gap-3 mt-3 animate-fade-up stagger-2">
              <span className="text-4xl font-black text-slate-900">{OVERALL_RATING}</span>
              <div>
                <StarRating rating={5} size="md" />
                <p className="text-xs text-slate-500 mt-0.5">
                  Based on {TOTAL_REVIEWS} Google reviews
                </p>
              </div>
            </div>
          </div>
          <a
            href={GOOGLE_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg transition-colors shadow-sm"
          >
            <GoogleLogo />
            See all reviews
          </a>
        </div>

        {/* Review Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviews.map((review, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow animate-fade-up`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Reviewer */}
              <div className="flex items-center gap-3">
                <div
                  className={`${review.color} w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}
                >
                  {review.initials}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{review.name}</p>
                  <p className="text-xs text-slate-400">{review.date}</p>
                </div>
                {/* Google icon small */}
                <div className="ml-auto shrink-0">
                  <GoogleLogo />
                </div>
              </div>

              <StarRating rating={review.rating} size="sm" />

              <p className="text-sm text-slate-600 leading-relaxed flex-1">{review.text}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 text-center">
          <a
            href={GOOGLE_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <GoogleLogo />
            View TechRaj on Google Maps &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}
