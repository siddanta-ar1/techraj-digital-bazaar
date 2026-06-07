export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 animate-pulse">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
        <div className="space-y-2 text-center">
          <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-12 bg-slate-200 rounded-xl" />
          <div className="h-12 bg-slate-200 rounded-xl" />
          <div className="h-12 bg-indigo-200 rounded-xl" />
        </div>
        <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
      </div>
    </div>
  );
}
