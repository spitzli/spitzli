"use client";

import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";
import type { ContactErrors } from "@/lib/contact";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const busy = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus("sending");
    setMessage("");
    setErrors({});
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok) {
        setErrors(result.fields || {});
        setMessage(
          result.error ||
            "Die Nachricht konnte nicht versendet werden. Bitte per E-Mail schreiben.",
        );
        setStatus("error");
        const firstField = Object.keys(result.fields || {})[0];
        if (firstField) (form.elements.namedItem(firstField) as HTMLElement | null)?.focus();
      } else {
        form.reset();
        setStatus("success");
        setMessage("Danke. Deine Nachricht wurde versendet. Ich melde mich bei dir.");
      }
    } catch {
      setStatus("error");
      setMessage(
        "Der Versand konnte nicht bestätigt werden. Bitte prüfe deine Verbindung oder schreibe mir direkt per E-Mail.",
      );
    } finally {
      busy.current = false;
    }
  }

  return (
    <form className="contact-form" onSubmit={submit} aria-busy={status === "sending"}>
      <div className="form-row">
        <div className="field">
          <label htmlFor="name">Dein Name</label>
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
          <label htmlFor="email">E-Mail-Adresse</label>
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
        <label htmlFor="message">Was möchtest du entwickeln?</label>
        <textarea
          id="message"
          name="message"
          required
          minLength={20}
          maxLength={5000}
          rows={5}
          aria-invalid={Boolean(errors.message)}
          aria-describedby="message-error"
          placeholder="Worum geht es? Was gibt es schon? Was soll entstehen?"
        />
        <span className="field-error" id="message-error">
          {errors.message}
        </span>
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Dieses Feld bitte leer lassen</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="form-privacy">
        Ich verwende deine Angaben, um deine Anfrage zu beantworten. Keine Speicherung im CMS.
        Details in der <Link href="/datenschutz">Datenschutzerklärung</Link>.
      </p>
      <button className="button" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Wird gesendet …" : "Anfrage senden"}
        <span aria-hidden="true">↗</span>
      </button>
      <p className={`form-feedback ${status}`} role="status" aria-live="polite">
        {message}
      </p>
      <noscript>
        Das Formular benötigt JavaScript. Du erreichst mich auch direkt per E-Mail.
      </noscript>
    </form>
  );
}
