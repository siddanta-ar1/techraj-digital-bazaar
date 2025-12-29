export default function CheckoutLoadingSkeleton() {
  return (
    <div className="animate-pulse max-w-6xl mx-auto pb-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Contact Info Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-slate-200"></div>
              <div className="h-6 bg-slate-200 rounded w-48"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="h-12 bg-slate-200 rounded-xl w-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="h-12 bg-slate-200 rounded-xl w-full"></div>
              </div>
            </div>
          </div>

          {/* Payment Method Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-slate-200"></div>
              <div className="h-6 bg-slate-200 rounded w-48"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-slate-200 rounded-xl w-full"
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary Skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="h-6 bg-slate-200 rounded w-32"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
            <div className="h-px bg-slate-200 w-full"></div>
            <div className="flex justify-between">
              <div className="h-6 bg-slate-200 rounded w-20"></div>
              <div className="h-6 bg-slate-200 rounded w-24"></div>
            </div>
          </div>
          <div className="mt-6 h-14 bg-slate-200 rounded-xl w-full"></div>
        </div>
      </div>
    </div>
  );
}
