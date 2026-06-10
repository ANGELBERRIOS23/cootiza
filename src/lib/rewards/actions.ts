"use server";

import { revalidatePath } from "next/cache";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";

export type RedeemResult = { ok: true } | { ok: false; error: string };

/**
 * Solicita el canje de un premio vía el RPC transaccional request_redemption
 * (valida balance + stock server-side). Corre con la sesión del promotor
 * (RLS / auth.uid()), así nadie puede canjear a nombre de otro.
 */
export async function requestRedemption(rewardId: string): Promise<RedeemResult> {
  const supabase = await createCooitzaServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { error } = await supabase.rpc("request_redemption", { p_reward_id: rewardId });
  if (error) {
    // Mensajes del RPC ya son claros (puntos insuficientes, sin stock, etc.).
    const msg = error.message.includes("Puntos insuficientes")
      ? "No te alcanzan los puntos para este premio."
      : error.message.includes("stock")
        ? "Este premio ya no tiene stock."
        : error.message.includes("no disponible")
          ? "Este premio ya no está disponible."
          : "No se pudo solicitar el canje. Intentá de nuevo.";
    return { ok: false, error: msg };
  }

  revalidatePath("/portal/premios");
  return { ok: true };
}
