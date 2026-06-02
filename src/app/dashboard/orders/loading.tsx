export default function OrdersLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
      <div className="h-7 bg-slate-200 rounded-lg w-32" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 h-20" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 h-16 mb-4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 h-36" />
        ))}
      </div>
    </div>
  );
}
