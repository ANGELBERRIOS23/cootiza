import "server-only";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";

export type StageMeta = {
  vxm_stage_code: string;
  display_name: string;
  is_terminal: boolean;
  is_won: boolean;
  display_order: number;
};

/** Carga el mapa de etapas (nombres amigables) desde la BD. */
export async function getStageMap(): Promise<Record<string, StageMeta>> {
  const supabase = await createCooitzaServerClient();
  const { data } = await supabase
    .from("pipeline_stage_map")
    .select("vxm_stage_code, display_name, is_terminal, is_won, display_order")
    .order("display_order");
  const map: Record<string, StageMeta> = {};
  for (const s of data ?? []) map[s.vxm_stage_code] = s as StageMeta;
  return map;
}

/** Tono de color para el badge de etapa según estado. */
export function stageTone(meta: StageMeta | undefined): "green" | "red" | "blue" | "neutral" {
  if (!meta) return "neutral";
  if (meta.is_won && meta.is_terminal) return "green"; // cliente ganado
  if (meta.is_won) return "blue"; // en curso ganador (venta cerrada, viaje)
  if (meta.is_terminal) return "red"; // no concretado
  return "neutral"; // en proceso
}
