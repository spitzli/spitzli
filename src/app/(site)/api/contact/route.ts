import { isIP } from "node:net";
import config from "@payload-config";
import { getPayload } from "payload";
import { rateLimitKey, readLimitedJSON, validateContact } from "@/lib/contact";
import { claimContactSlot } from "@/lib/rate-limit";
import { contactEnabled, site } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 30;
const reply = (body: object, status = 200, extra: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...extra } });

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(site.url).origin)
    return reply({ error: "Anfrage von dieser Herkunft nicht erlaubt." }, 403);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json")
    return reply({ error: "JSON erwartet." }, 415);
  if (!contactEnabled())
    return reply(
      {
        error: `Das Formular ist derzeit nicht verfügbar. Bitte direkt an ${site.email} schreiben.`,
      },
      503,
    );
  let value: unknown;
  try {
    value = await readLimitedJSON(request);
  } catch (error) {
    return reply(
      {
        error:
          error instanceof RangeError
            ? "Die Anfrage ist zu groß."
            : "Die Anfrage konnte nicht gelesen werden.",
      },
      error instanceof RangeError ? 413 : 400,
    );
  }
  const { data, errors } = validateContact(value);
  if (!data) return reply({ error: "Bitte die markierten Felder prüfen.", fields: errors }, 400);
  if (data.website) return reply({ ok: true });

  // Vercel overwrites this header at its edge. Never trust the generic X-Forwarded-For.
  const ip =
    process.env.VERCEL === "1"
      ? request.headers.get("x-vercel-forwarded-for")?.trim()
      : "127.0.0.1";
  if (!ip || !isIP(ip))
    return reply(
      { error: "Anfrage konnte nicht sicher zugeordnet werden. Bitte per E-Mail schreiben." },
      503,
    );
  try {
    const payload = await getPayload({ config });
    if (!(await claimContactSlot(payload, rateLimitKey(ip, process.env.PAYLOAD_SECRET || "")))) {
      return reply({ error: "Zu viele Anfragen. Bitte in 15 Minuten erneut versuchen." }, 429, {
        "Retry-After": "900",
      });
    }
    await payload.sendEmail({
      to: site.email,
      from: { name: site.name, address: process.env.SMTP_FROM || site.email },
      replyTo: data.email,
      subject: "Projektanfrage über spitzli.dev",
      text: `Name: ${data.name}\nE-Mail: ${data.email}\n\n${data.message}`,
    });
    return reply({ ok: true });
  } catch {
    // No message bodies, addresses, SMTP credentials or transport errors in application logs.
    console.error("contact_delivery_failed");
    return reply(
      {
        error: `Die Nachricht konnte nicht versendet werden. Bitte direkt an ${site.email} schreiben.`,
      },
      503,
    );
  }
}
