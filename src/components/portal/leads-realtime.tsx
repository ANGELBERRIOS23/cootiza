"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createCooitzaBrowserClient } from "@/lib/db/cooitza-browser";

/** Refresca "Mis Leads" en vivo cuando cambia un lead del promotor (Realtime). */
export function LeadsRealtime({ promoterId }: { promoterId: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createCooitzaBrowserClient();
    const ch = supabase
      .channel(`leads:${promoterId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lead_mirror", filter: `promoter_id=eq.${promoterId}` },
        () => router.refresh(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [promoterId, router]);
  return null;
}
