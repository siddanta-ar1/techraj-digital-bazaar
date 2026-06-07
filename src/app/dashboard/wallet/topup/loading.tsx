export default function TopupLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-8 bg-slate-200 rounded w-40 mb-2" />
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="h-5 bg-slate-200 rounded w-56" />
        <div className="h-12 bg-slate-200 rounded-xl" />
        <div className="h-12 bg-slate-200 rounded-xl" />
        <div className="h-12 bg-slate-200 rounded-xl" />
        <div className="h-12 bg-indigo-200 rounded-xl" />
      </div>
    </div>
  );
}
