export default function TransactionsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
      <div className="h-4 bg-slate-200 rounded w-64 mb-6" />
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between">
          <div className="h-5 bg-slate-200 rounded w-32" />
          <div className="h-5 bg-slate-200 rounded w-20" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <div className="h-4 bg-slate-200 rounded w-36" />
                <div className="h-3 bg-slate-200 rounded w-24" />
              </div>
            </div>
            <div className="h-5 bg-slate-200 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
