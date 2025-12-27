export default function CheckoutLoadingSkeleton() {
  return (
    <div className="animate-pulse max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Delivery Info Skeleton */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div>
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-slate-200 rounded"></div>
              </div>
              <div>
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-slate-200 rounded"></div>
              </div>
              <div>
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                <div className="h-24 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>

          {/* Payment Method Skeleton */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary Skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-6 bg-slate-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between">
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
          <div className="mt-6 h-12 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  )
}