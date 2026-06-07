export default function OrderSuccessLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 animate-pulse">
      <div className="text-center space-y-4 max-w-md w-full px-4">
        <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto" />
        <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
        <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto" />
        <div className="h-12 bg-indigo-200 rounded-xl mt-6" />
      </div>
    </div>
  );
}
