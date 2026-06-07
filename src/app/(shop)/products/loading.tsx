export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="h-9 bg-slate-200 rounded w-56 mb-2" />
          <div className="h-4 bg-slate-200 rounded w-40" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-1/4 space-y-3">
            <div className="h-5 bg-slate-200 rounded w-24" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-white rounded-xl border border-slate-200" />
            ))}
          </aside>

          {/* Product grid */}
          <main className="w-full lg:w-3/4">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <div className="aspect-video bg-slate-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="h-9 bg-slate-200 rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
