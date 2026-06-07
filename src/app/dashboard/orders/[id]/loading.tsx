export default function OrderDetailLoading() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-48 mb-6" />
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 mb-4">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-slate-200 rounded w-36" />
          <div className="h-6 bg-slate-200 rounded w-20" />
        </div>
        <div className="h-px bg-slate-100" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="w-16 h-16 bg-slate-200 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-200 rounded w-1/3" />
            </div>
            <div className="h-5 bg-slate-200 rounded w-16 shrink-0" />
          </div>
        ))}
        <div className="h-px bg-slate-100" />
        <div className="flex justify-end gap-4">
          <div className="h-5 bg-slate-200 rounded w-20" />
          <div className="h-5 bg-slate-200 rounded w-24" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <div className="h-5 bg-slate-200 rounded w-32" />
        <div className="h-4 bg-slate-200 rounded w-48" />
        <div className="h-4 bg-slate-200 rounded w-40" />
      </div>
    </div>
  );
}
