"use server";

import { revalidatePath } from "next/cache";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { createVxmAdminClient } from "@/lib/db/vxm";
import { isVxmAdminConfigured } from "@/lib/leads/sync";

export type RedeemResult = { ok: true } | { ok: false; error: string };

/**
 * Solicita el canje de un premio vía el RPC transaccional request_redemption
 * (valida teléfono + balance + stock server-side). Corre con la sesión del
 * promotor (RLS / auth.uid()), así nadie puede canjear a nombre de otro.
 *
 * Tras un canje exitoso avisa a los admins de la plataforma central (VXM) para
 * que contacten al promotor de inmediato. Ese aviso es best-effort: el canje ya
 * quedó registrado aunque la notificación falle.
 */
export async function requestRedemption(rewardId: string): Promise<RedeemResult> {
  const supabase = await createCooitzaServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { error } = await supabase.rpc("request_redemption", { p_reward_id: rewardId });
  if (error) {
    const m = error.message;
    // Mensajes del RPC ya son claros (sin teléfono, puntos insuficientes, sin stock, etc.).
    const msg =
      m.includes("telefono") || m.includes("teléfono") || m.includes("perfil")
        ? "Agregá tu teléfono en tu perfil antes de canjear — es donde la agencia te contactará."
        : m.includes("Puntos insuficientes")
          ? "No te alcanzan los puntos para este premio."
          : m.includes("stock")
            ? "Este premio ya no tiene stock."
            : m.includes("no disponible")
              ? "Este premio ya no está disponible."
              : "No se pudo solicitar el canje. Intentá de nuevo.";
    return { ok: false, error: msg };
  }

  // Alerta en la plataforma central (best-effort, no bloquea el canje).
  notifyVxmAdminsOfRedemption(supabase, user.id, rewardId).catch((e) =>
    console.warn("[rewards] alerta de canje a VXM falló:", (e as Error).message),
  );

  revalidatePath("/portal/premios");
  return { ok: true };
}

/** Avisa a admin/superadmin de VXM que un promotor canjeó (con su teléfono para contactarlo). */
async function notifyVxmAdminsOfRedemption(
  supabase: Awaited<ReturnType<typeof createCooitzaServerClient>>,
  userId: string,
  rewardId: string,
) {
  if (!isVxmAdminConfigured()) return;

  const [{ data: prof }, { data: reward }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", userId).maybeSingle(),
    supabase.from("rewards").select("title").eq("id", rewardId).maybeSingle(),
  ]);

  const promoterName = prof?.full_name ?? "Un promotor";
  const promoterPhone = (prof?.phone ?? "").trim();
  const rewardTitle = reward?.title ?? "un premio";

  const vxm = createVxmAdminClient();
  const { data: admins } = await vxm.from("profiles").select("id").in("role", ["admin", "superadmin"]);
  const recipients = (admins ?? []).map((a) => a.id as string).filter(Boolean);
  if (recipients.length === 0) return;

  const message =
    `${promoterName} canjeó "${rewardTitle}" en Cooitza.` +
    (promoterPhone ? ` Tel: ${promoterPhone}.` : "") +
    " Contactalo para coordinar la entrega.";

  await vxm.from("notifications").insert(
    recipients.map((uid) => ({
      user_id: uid,
      title: "🎁 Canje en Cooitza",
      message,
      notification_type: "cooitza_redemption",
    })),
  );
}
