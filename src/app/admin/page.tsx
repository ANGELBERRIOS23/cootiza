export const metadata = { title: "Panel — Cooitza Admin" };

export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Panel de administración</h1>
      <p className="text-sm text-slate-500">
        Desde acá vas a gestionar promotores, puntos, premios y la configuración del
        portal. Las secciones se construyen en las próximas fases.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {["Promotores", "Puntos y reglas", "Premios", "Canjes", "Configuración", "Auditoría"].map(
          (s) => (
            <div
              key={s}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-center text-sm font-semibold text-slate-500 opacity-70"
            >
              {s}
              <p className="mt-1 text-[10px] font-medium text-slate-400">Próximamente</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
