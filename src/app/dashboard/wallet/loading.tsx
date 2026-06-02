export default function WalletLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
      <div className="h-7 bg-slate-200 rounded-lg w-36" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 h-24" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 h-80" />
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 h-40" />
          <div className="bg-indigo-200 rounded-2xl h-48" />
        </div>
      </div>
    </div>
  );
}
