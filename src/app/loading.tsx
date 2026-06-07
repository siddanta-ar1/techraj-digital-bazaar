export default function HomeLoading() {
  return (
    <div className="flex flex-col min-h-screen animate-pulse">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 py-12 md:py-16">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="h-10 bg-white/10 rounded-lg w-72 mx-auto" />
          <div className="h-5 bg-white/10 rounded w-96 mx-auto" />
          <div className="flex justify-center gap-3 pt-2">
            <div className="h-10 w-28 bg-white/10 rounded-lg" />
            <div className="h-10 w-36 bg-white/10 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Featured products */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="h-8 bg-slate-200 rounded w-48 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-slate-100 rounded-2xl overflow-hidden">
                <div className="aspect-video bg-slate-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="h-8 bg-slate-200 rounded w-40 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100">
                <div className="aspect-video bg-slate-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
