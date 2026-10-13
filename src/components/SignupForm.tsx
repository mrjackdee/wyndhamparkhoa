"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
export default function SignupForm() {
  const [textGroup, setTextGroup] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const token = useRef("");
  const id = useRef("");
  const status = useRef<HTMLDivElement>(null);
  async function refresh() {
    try {
      const r = await fetch("/api/form-token", { cache: "no-store" });
      if (!r.ok) throw new Error();
      token.current = (await r.json()).token;
    } catch {
      setMessage("The form could not initialize. Please refresh the page.");
    }
  }
  useEffect(() => {
    id.current = crypto.randomUUID();
    fetch("/api/form-token", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        token.current = data.token;
      })
      .catch(() =>
        setMessage("The form could not initialize. Please refresh the page."),
      );
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage("");
    setErrors({});
    const form = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/resident-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(form),
          privacy: form.get("privacy") === "on",
          idempotencyKey: id.current,
          token: token.current,
        }),
      });
      const data = await r.json();
      if (r.ok && data.saved === true) {
        setSaved(true);
      } else {
        setErrors(data.fields ?? {});
        setMessage(
          data.error ?? "We could not save your submission. Please try again.",
        );
        if (data.refreshToken) await refresh();
      }
    } catch {
      setMessage(
        "Connection interrupted. Your entries are still here. Please try again.",
      );
    } finally {
      setPending(false);
      setTimeout(() => status.current?.focus(), 0);
    }
  }
  if (saved)
    return (
      <div className="success" ref={status} tabIndex={-1} role="status">
        <p className="eyebrow">SUBMISSION SAVED</p>
        <h2>Thank you, neighbor.</h2>
        <p>
          Your contact information and preferences have been saved for
          administrator review.
        </p>
        <p>
          This does not confirm dues payment, financial standing, formal HOA
          membership, or admission to a Facebook or text group.
        </p>
        <Link className="button" href="/hoa-dues">
          View HOA dues →
        </Link>
      </div>
    );
  const field = (
    name: string,
    label: string,
    type = "text",
    required = false,
    autocomplete?: string,
  ) => (
    <div className="field" key={name}>
      <label htmlFor={name}>
        {label}
        {required ? <span> *</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autocomplete}
        maxLength={
          name === "address"
            ? 300
            : name === "email"
              ? 254
              : name === "mobile"
                ? 40
                : 120
        }
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? name + "-error" : undefined}
      />
      {errors[name] ? (
        <p className="error-text" id={name + "-error"}>
          {errors[name].join(" ")}
        </p>
      ) : null}
    </div>
  );
  return (
    <form className="signup-form" onSubmit={submit}>
      <div ref={status} tabIndex={-1} role="alert">
        {message ? <p className="notice error">{message}</p> : null}
      </div>
      <p className="fine-print">* Required fields</p>
      <fieldset>
        <legend>What would you like to do? *</legend>
        <label className="choice">
          <input type="radio" name="requestType" value="new" required /> New
          registration
        </label>
        <label className="choice">
          <input type="radio" name="requestType" value="update" required />{" "}
          Update existing information
        </label>
      </fieldset>
      <div className="form-grid">
        {field("name", "Name", "text", true, "name")}
        {field("spouseName", "Spouse Name (if applicable)")}
      </div>
      {field("address", "Address", "text", true, "street-address")}
      <div className="form-grid">
        {field("mobile", "Mobile", "tel", textGroup === "yes", "tel")}
        {field("email", "Email", "email", true, "email")}
      </div>
      <p className="fine-print">
        Mobile is required only when you select Yes for text messages.
      </p>
      <div className="preference-grid">
        {[
          ["textGroup", "WP Text Messages Group"],
          ["facebookGroup", "WP Facebook Group"],
        ].map(([name, label]) => (
          <fieldset key={name}>
            <legend>{label} *</legend>
            {["yes", "no"].map((v) => (
              <label key={v} className="choice">
                <input
                  type="radio"
                  name={name}
                  value={v}
                  required
                  onChange={
                    name === "textGroup" ? () => setTextGroup(v) : undefined
                  }
                />
                {v === "yes" ? "Yes" : "No"}
              </label>
            ))}
            {errors[name] ? (
              <p className="error-text">Choose Yes or No.</p>
            ) : null}
          </fieldset>
        ))}
      </div>
      <p className="fine-print">
        Facebook membership requires a separate request and approval through
        Facebook. Selecting Yes here does not add you to the group.
      </p>
      <div className="honeypot" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="acknowledgment">
        <input type="checkbox" name="privacy" required />
        <span>
          I understand that this information is for HOA administration and
          community communication and will not be displayed publicly.{" "}
          <Link href="/privacy">Read the privacy notice.</Link>
        </span>
      </label>
      <p className="fine-print">
        Submitting records your contact details and preferences. It does not
        confirm payment, establish financial standing, or automatically grant
        formal HOA membership.
      </p>
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Saving your information…" : "Submit for review"}{" "}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
