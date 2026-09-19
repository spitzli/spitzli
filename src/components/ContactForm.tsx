"use client";
import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { localizePath } from "@/i18n/locale";
import type { ContactErrors } from "@/lib/contact";

export function ContactForm({ enabled, email }: { enabled: boolean; email: string }) {
  const { locale, t } = useI18n();
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const busy = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || busy.current) return;
    busy.current = true;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus("sending");
    setMessage("");
    setErrors({});
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept-Language": locale },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok) {
        setErrors(result.fields || {});
        setMessage(result.error || t("The message could not be sent. Please email me directly."));
        setStatus("error");
        const field = Object.keys(result.fields || {})[0];
        if (field) (form.elements.namedItem(field) as HTMLElement | null)?.focus();
      } else {
        form.reset();
        setStatus("success");
        setMessage(t("Thank you. Your message has been sent. I’ll get back to you."));
      }
    } catch {
      setStatus("error");
      setMessage(
        t("Delivery could not be confirmed. Please check your connection or email me directly."),
      );
    } finally {
      busy.current = false;
    }
  }
  return (
    <form
      className="contact-form"
      onSubmit={submit}
      aria-busy={status === "sending"}
      aria-label={t("Contact form")}
    >
      {!enabled && (
        <p className="form-unavailable" id="contact-unavailable">
          {t("Email delivery is still being configured. For now, please contact me directly:")}{" "}
          <a href={`mailto:${email}`}>{email}</a>
        </p>
      )}
      <fieldset disabled={!enabled} aria-describedby={!enabled ? "contact-unavailable" : undefined}>
        <legend className="visually-hidden">{t("Your project enquiry")}</legend>
        <div className="form-row">
          <div className="field">
            <label htmlFor="name">{t("Your name")}</label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              aria-invalid={Boolean(errors.name)}
              aria-describedby="name-error"
            />
            <span className="field-error" id="name-error">
              {errors.name}
            </span>
          </div>
          <div className="field">
            <label htmlFor="email">{t("Email address")}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              aria-invalid={Boolean(errors.email)}
              aria-describedby="email-error"
            />
            <span className="field-error" id="email-error">
              {errors.email}
            </span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="message">{t("What would you like to build?")}</label>
          <textarea
            id="message"
            name="message"
            required
            minLength={20}
            maxLength={5000}
            rows={5}
            aria-invalid={Boolean(errors.message)}
            aria-describedby="message-error"
            placeholder={t(
              "What is the project about? What exists already? What should happen next?",
            )}
          />
          <span className="field-error" id="message-error">
            {errors.message}
          </span>
        </div>
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="website">{t("Please leave this field empty")}</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <p className="form-privacy">
          {t("I use your details to respond to your enquiry. Messages are not stored in the CMS.")}{" "}
          <Link href={localizePath("/datenschutz", locale)}>{t("Privacy policy")}</Link>.
        </p>
        <button className="button" type="submit" disabled={!enabled || status === "sending"}>
          {status === "sending" ? t("Sending …") : t("Send enquiry")}
          <span aria-hidden="true">↗</span>
        </button>
      </fieldset>
      <p className={`form-feedback ${status}`} role="status" aria-live="polite">
        {message}
      </p>
      <noscript>
        {t("This form requires JavaScript. You can also contact me directly by email.")}
      </noscript>
    </form>
  );
}
