// biome-ignore-all lint/suspicious/noControlCharactersInRegex: reject control/header injection at the trust boundary
import { createHmac } from "node:crypto";

export type ContactInput = { name: string; email: string; message: string; website: string };
export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

export function validateContact(value: unknown): { data?: ContactInput; errors: ContactErrors } {
  const errors: ContactErrors = {};
  if (!value || typeof value !== "object" || Array.isArray(value))
    return { errors: { message: "Ungültige Anfrage." } };
  const input = value as Record<string, unknown>;
  const text = (key: string) => (typeof input[key] === "string" ? input[key].trim() : "");
  const data = {
    name: text("name"),
    email: text("email"),
    message: text("message"),
    website: text("website"),
  };
  if (data.name.length < 2 || data.name.length > 100 || /[\r\n\x00-\x1f\x7f]/.test(data.name))
    errors.name = "Bitte einen Namen mit 2–100 Zeichen angeben.";
  if (
    data.email.length > 254 ||
    !/^[^\s<>@,;\x00-\x1f\x7f]+@[^\s<>@,;\x00-\x1f\x7f]+\.[^\s<>@,;\x00-\x1f\x7f]+$/.test(
      data.email,
    )
  )
    errors.email = "Bitte eine gültige E-Mail-Adresse angeben.";
  if (
    data.message.length < 20 ||
    data.message.length > 5000 ||
    /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(data.message)
  )
    errors.message = "Bitte eine Nachricht mit 20–5.000 Zeichen schreiben.";
  if (input.website !== undefined && typeof input.website !== "string")
    errors.website = "Ungültige Anfrage.";
  return Object.keys(errors).length ? { errors } : { data, errors };
}

export function rateLimitKey(ip: string, secret: string) {
  return createHmac("sha256", secret).update(`contact:${ip}`).digest("hex");
}

export async function readLimitedJSON(request: Request, limit = 16384): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > limit)
    throw new RangeError("Anfrage zu groß.");
  if (!request.body) throw new SyntaxError("Leere Anfrage.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new RangeError("Anfrage zu groß.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
