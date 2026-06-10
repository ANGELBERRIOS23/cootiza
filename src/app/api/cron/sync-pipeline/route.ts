import { NextRequest, NextResponse } from "next/server";
import { syncPipeline } from "@/lib/leads/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron de sincronización del pipeline (Vercel Cron → GET).
 *
 * Seguridad: Vercel Cron envía `Authorization: Bearer ${CRON_SECRET}` si la env
 * CRON_SECRET está definida. La exigimos en producción; sin ella el endpoint no
 * se expone. En dev (sin secret) se permite para poder probarlo a mano.
 *
 * Degradación: si VXM no está configurado, syncPipeline devuelve
 * { skipped: 'vxm_not_configured' } con 200 — no es un error.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");

  if (secret) {
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "cron_secret_not_configured" }, { status: 503 });
  }

  try {
    const report = await syncPipeline();
    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
