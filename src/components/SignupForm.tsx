"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
export default function SignupForm() {
  const [textGroup, setTextGroup] = useState("");
  const [pending, setPending] = useState(false);
  const [review, setReview] = useState<Record<string, FormDataEntryValue> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const busy = useRef(false);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
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
    try { id.current = sessionStorage.getItem("hoa-signup-request") || id.current; sessionStorage.setItem("hoa-signup-request", id.current); } catch { /* The in-memory key still protects retries when storage is unavailable. */ }
    fetch("/api/form-token", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        token.current = data.token;
      })
      .catch(() =>
        setMessage("The form could not initialize. Please refresh the page."),
      );
  }, []);
  async function submit() {
    if (busy.current || !review) return;
    busy.current = true;
    setPending(true);
    setMessage("");
    setErrors({});
    const form = new FormData(formRef.current!);
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
        try { sessionStorage.removeItem("hoa-signup-request"); } catch {}
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
      busy.current = false;
      setPending(false);
      setTimeout(() => status.current?.focus(), 0);
    }
  }
  if (saved)
    return (
      <div className="success" ref={status} tabIndex={-1} role="status">
        <p className="eyebrow">STEP 3 OF 3 · CONFIRMATION</p>
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
    <div>
    <ol className="signup-steps" aria-label="Registration steps"><li aria-current={!review ? "step" : undefined}>1. Enter Information</li><li aria-current={review ? "step" : undefined}>2. Review Information</li><li>3. Confirmation</li></ol>
    <form ref={formRef} className="signup-form" hidden={Boolean(review)} onSubmit={(e) => {
      e.preventDefault(); setMessage("");
      setReview(Object.fromEntries(new FormData(e.currentTarget)));
      setTimeout(() => reviewHeading.current?.focus(), 0);
    }}>
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
        Review Information{" "}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
    {review && <section className="signup-review" aria-labelledby="review-heading">
      <h2 id="review-heading" ref={reviewHeading} tabIndex={-1}>Review Information</h2>
      <p>Check your details before submitting. Nothing has been submitted yet.</p>
      <dl>{[["requestType", "Request"], ["name", "Name"], ["spouseName", "Spouse Name (if applicable)"], ["address", "Address"], ["mobile", "Mobile"], ["email", "Email"], ["textGroup", "WP Text Messages Group"], ["facebookGroup", "WP Facebook Group"]].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{key === "requestType" ? (review[key] === "new" ? "New registration" : "Contact update request") : (String(review[key] || "Not provided"))}</dd></div>)}</dl>
      <p>You acknowledged that your information is for HOA administration and community communication and will not be displayed publicly.</p>
      <p>Submission records contact information and preferences. It does not confirm dues payment or automatically establish HOA membership. Facebook membership requires a separate request and approval through Facebook.</p>
      <div ref={status} role="alert" tabIndex={-1}>{message && <p className="notice error">{message}</p>}{Object.keys(errors).length > 0 && <p>Choose Edit Information to correct the highlighted fields.</p>}</div>
      <div className="review-actions"><button className="button secondary" type="button" disabled={pending} onClick={() => {setReview(null); setTimeout(() => formRef.current?.querySelector<HTMLInputElement>("input")?.focus(), 0);}}>Edit Information</button>
      <button className="button" type="button" disabled={pending} onClick={submit}>{pending ? "Saving your information…" : review.requestType === "update" ? "Submit Update Request" : "Submit Registration"}</button></div>
    </section>}
    </div>
  );
}
