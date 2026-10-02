"use client";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { localizePath } from "@/i18n/locale";
import type { ContactErrors } from "@/lib/contact";

export function ContactForm({
  enabled,
  email,
  siteKey,
}: {
  enabled: boolean;
  email: string;
  siteKey: string;
}) {
  const { locale, t } = useI18n();
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const busy = useRef(false);
  const captchaRef = useRef<HCaptcha>(null);
  const captchaField = useRef<HTMLFieldSetElement>(null);
  const [captchaActive, setCaptchaActive] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [captchaAttempt, setCaptchaAttempt] = useState(0);

  function expireCaptcha() {
    setCaptchaToken("");
    setCaptchaError(t("The security check expired. Please complete it again."));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || busy.current) return;
    if (!captchaToken) {
      setCaptchaError(t("Please complete the security check."));
      captchaField.current?.focus();
      return;
    }
    busy.current = true;
    const form = event.currentTarget;
    const fields = new FormData(form);
    // Do not duplicate the widget's hidden h-captcha-response field in the bounded JSON body.
    const data = {
      name: fields.get("name"),
      email: fields.get("email"),
      message: fields.get("message"),
      website: fields.get("website"),
      captcha: captchaToken,
    };
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
        if (field === "captcha") captchaField.current?.focus();
        else if (field) (form.elements.namedItem(field) as HTMLElement | null)?.focus();
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
      setCaptchaToken("");
      // A submitted token may already have been consumed even when the request failed.
      captchaRef.current?.resetCaptcha();
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
          {t("The contact form is still being configured. For now, please contact me directly:")}{" "}
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
        <fieldset
          className="captcha-fieldset"
          aria-invalid={Boolean(errors.captcha || captchaError)}
          ref={captchaField}
          tabIndex={-1}
          aria-describedby="captcha-status"
        >
          <legend>{t("Security check")}</legend>
          {!captchaActive ? (
            <>
              <p className="small-copy">
                {t(
                  "hCaptcha checks for bots. Loading it shares your IP address and browser data with its provider in the USA. You can email me instead.",
                )}
              </p>
              <button
                className="button secondary"
                type="button"
                disabled={!enabled || !siteKey}
                onClick={() => setCaptchaActive(true)}
              >
                {t("Load hCaptcha")}
              </button>
            </>
          ) : (
            <>
              <HCaptcha
                key={`${locale}-${captchaAttempt}`}
                ref={captchaRef}
                sitekey={siteKey}
                theme="dark"
                size="compact"
                languageOverride={locale}
                reCaptchaCompat={false}
                sentry={false}
                userJourneys={false}
                onReady={() => setCaptchaReady(true)}
                onVerify={(token) => {
                  setCaptchaToken(token);
                  setCaptchaError("");
                  setErrors((previous) => ({ ...previous, captcha: undefined }));
                }}
                onExpire={expireCaptcha}
                onChalExpired={expireCaptcha}
                onError={() => {
                  setCaptchaToken("");
                  setCaptchaError(
                    t("hCaptcha could not be loaded. Please retry or email me directly."),
                  );
                }}
              />
              {captchaError && (
                <button
                  className="text-link captcha-retry"
                  type="button"
                  disabled={status === "sending"}
                  onClick={() => {
                    setCaptchaToken("");
                    setCaptchaError("");
                    setCaptchaReady(false);
                    setCaptchaAttempt((value) => value + 1);
                  }}
                >
                  {t("Retry security check")}
                </button>
              )}
              <button
                className="text-link captcha-retry"
                type="button"
                disabled={status === "sending"}
                onClick={() => window.location.reload()}
              >
                {t("Disable hCaptcha and reload")}
              </button>
            </>
          )}
          <p id="captcha-status" role="status" className="captcha-status">
            {errors.captcha ||
              captchaError ||
              (captchaToken
                ? t("Security check completed.")
                : captchaActive && !captchaReady
                  ? t("Loading security check …")
                  : "")}
          </p>
        </fieldset>
        <p className="form-privacy">
          <Link href={localizePath("/datenschutz", locale)}>{t("Privacy policy")}</Link>.
        </p>
        <button
          className="button"
          type="submit"
          disabled={!enabled || !captchaToken || status === "sending"}
        >
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
