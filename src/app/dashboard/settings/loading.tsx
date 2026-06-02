export default function SettingsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
      <div className="h-7 bg-slate-200 rounded-lg w-28" />
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-xl" />
        ))}
        <div className="h-10 bg-indigo-200 rounded-xl w-32 mt-2" />
      </div>
    </div>
  );
}
