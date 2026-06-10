/** Skeleton de carga del portal → feedback instantáneo al navegar. */
export default function PortalLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-44 rounded-lg bg-slate-200" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl bg-slate-200" />
        <div className="h-24 rounded-2xl bg-slate-200" />
      </div>
      <div className="h-56 rounded-2xl bg-slate-200" />
    </div>
  );
}
