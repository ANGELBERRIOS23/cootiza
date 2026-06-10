import "server-only";

/**
 * Capa de email sobre Resend con DEGRADACIÓN total.
 *
 * Si RESEND_API_KEY / RESEND_FROM no están configuradas, sendEmail() no hace
 * nada (devuelve { sent:false, skipped:'email_not_configured' }) y NUNCA lanza.
 * Así el portal funciona igual sin email; cuando se conecte Resend, empieza a
 * enviar sin tocar el resto del código.
 *
 * Usa fetch directo a la API de Resend — sin SDK, sin dependencias extra.
 */

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export type SendResult = { sent: boolean; skipped?: string; error?: string };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  if (!isEmailConfigured()) return { sent: false, skipped: "email_not_configured" };
  if (!opts.to || !opts.to.includes("@")) return { sent: false, skipped: "no_recipient" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[email] Resend devolvió error:", res.status, text.slice(0, 300));
      return { sent: false, error: `resend_${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.warn("[email] fallo de red enviando email:", (e as Error).message);
    return { sent: false, error: "network" };
  }
}

/** Envuelve contenido en un layout HTML simple y branded. */
export function emailLayout(opts: { heading: string; body: string; ctaText?: string; ctaHref?: string }): string {
  const agency = process.env.NEXT_PUBLIC_AGENCY_NAME ?? "Viajexmundo";
  const cta =
    opts.ctaText && opts.ctaHref
      ? `<a href="${opts.ctaHref}" style="display:inline-block;margin-top:20px;background:#0B4EA2;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">${opts.ctaText}</a>`
      : "";
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="background:#fff;border-radius:18px;padding:32px;box-shadow:0 12px 32px -16px rgba(15,23,42,.25)">
      <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a">${opts.heading}</h1>
      <div style="font-size:15px;line-height:1.6;color:#334155">${opts.body}</div>
      ${cta}
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:18px">Portal de Promotores · ${agency}</p>
  </div></body></html>`;
}
