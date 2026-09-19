import { isIP } from "node:net";
import config from "@payload-config";
import { getPayload } from "payload";
import { translator } from "@/i18n";
import { browserLocale } from "@/i18n/locale";
import { rateLimitKey, readLimitedJSON, validateContact } from "@/lib/contact";
import { claimContactSlot } from "@/lib/rate-limit";
import { contactEnabled, site } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 30;
const reply = (body: object, status = 200, extra: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...extra } });

export async function POST(request: Request) {
  const { t } = translator(browserLocale(request.headers.get("accept-language")));
  if (request.headers.get("origin") !== new URL(site.url).origin)
    return reply({ error: t("Requests from this origin are not allowed.") }, 403);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json")
    return reply({ error: t("JSON is required.") }, 415);
  if (!contactEnabled())
    return reply(
      {
        error: t("The form is currently unavailable. Please email {email} directly.", {
          email: site.email,
        }),
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
            ? t("The request is too large.")
            : t("The request could not be read."),
      },
      error instanceof RangeError ? 413 : 400,
    );
  }
  const { data, errors } = validateContact(value);
  if (!data)
    return reply(
      {
        error: t("Please check the highlighted fields."),
        fields: Object.fromEntries(Object.entries(errors).map(([key, value]) => [key, t(value)])),
      },
      400,
    );
  if (data.website) return reply({ ok: true });

  // Vercel overwrites this header at its edge. Never trust the generic X-Forwarded-For.
  const ip =
    process.env.VERCEL === "1"
      ? request.headers.get("x-vercel-forwarded-for")?.trim()
      : "127.0.0.1";
  if (!ip || !isIP(ip))
    return reply(
      { error: t("The request could not be verified. Please contact me by email.") },
      503,
    );
  try {
    const payload = await getPayload({ config });
    if (!(await claimContactSlot(payload, rateLimitKey(ip, process.env.PAYLOAD_SECRET || "")))) {
      return reply({ error: t("Too many requests. Please try again in 15 minutes.") }, 429, {
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
        error: t("The message could not be sent. Please email {email} directly.", {
          email: site.email,
        }),
      },
      503,
    );
  }
}
