export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] animate-pulse">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Breadcrumb */}
        <div className="flex gap-2 mb-8">
          <div className="h-4 bg-slate-200 rounded w-16" />
          <div className="h-4 bg-slate-200 rounded w-4" />
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-4 bg-slate-200 rounded w-4" />
          <div className="h-4 bg-slate-200 rounded w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left — image + description */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
              <div className="aspect-video bg-slate-200" />
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-6 bg-slate-200 rounded w-40" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
              <div className="h-4 bg-slate-200 rounded w-4/6" />
            </div>
          </div>

          {/* Right — purchase section */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="h-7 bg-slate-200 rounded w-3/4" />
              <div className="h-5 bg-slate-200 rounded w-1/3" />
              <div className="h-px bg-slate-200" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-slate-200 rounded-xl" />
                ))}
              </div>
              <div className="h-12 bg-slate-200 rounded-xl" />
              <div className="h-12 bg-indigo-200 rounded-xl" />
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="h-4 bg-slate-200 rounded w-40 mx-auto mb-4" />
              <div className="flex justify-center gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-8 w-20 bg-slate-200 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
