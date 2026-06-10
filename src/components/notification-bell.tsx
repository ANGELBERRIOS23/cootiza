"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { createCooitzaBrowserClient } from "@/lib/db/cooitza-browser";
import { cn } from "@/lib/cn";

type Notif = { id: string; title: string; body: string | null; link: string | null; kind: string; is_read: boolean; created_at: string };

/** Campana de notificaciones: carga las propias, escucha Realtime (INSERT) y permite marcar leídas. */
export function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.is_read).length;

  useEffect(() => {
    const supabase = createCooitzaBrowserClient();
    let active = true;
    (async () => {
      const { data } = await supabase.from("notifications").select("id, title, body, link, kind, is_read, created_at").order("created_at", { ascending: false }).limit(20);
      if (active) setItems((data ?? []) as Notif[]);
    })();
    const channel = supabase
      .channel(`notif:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => setItems((prev) => [payload.new as Notif, ...prev].slice(0, 20)))
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAllRead = async () => {
    const ids = items.filter((n) => !n.is_read).map((n) => n.id);
    if (ids.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const supabase = createCooitzaBrowserClient();
    await supabase.from("notifications").update({ is_read: true }).in("id", ids);
  };

  const openItem = async (n: Notif) => {
    if (!n.is_read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      const supabase = createCooitzaBrowserClient();
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => { setOpen((v) => !v); }} className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100" aria-label="Notificaciones">
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="text-sm font-bold text-slate-700">Notificaciones</span>
            {unread > 0 && <button onClick={markAllRead} className="text-xs font-medium text-brand-600 hover:underline">Marcar leídas</button>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-400">Sin notificaciones</p>
            ) : items.map((n) => (
              <button key={n.id} onClick={() => openItem(n)} className={cn("block w-full border-b border-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-50", !n.is_read && "bg-brand-50/40")}>
                <p className={cn("text-sm", n.is_read ? "text-slate-600" : "font-semibold text-slate-800")}>{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-slate-400">{n.body}</p>}
                <p className="mt-0.5 text-[10px] text-slate-300">{new Date(n.created_at).toLocaleString("es-GT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
