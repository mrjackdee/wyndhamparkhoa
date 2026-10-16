"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
export default function FeedbackForm() {
  const [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false),
    [message, setMessage] = useState("");
  const token = useRef(""),
    id = useRef("");
  const notice = useRef<HTMLDivElement>(null);
  async function refresh() {
    const r = await fetch("/api/form-token", { cache: "no-store" });
    if (!r.ok) throw new Error();
    token.current = (await r.json()).token;
  }
  useEffect(() => {
    id.current = crypto.randomUUID();
    refresh().catch(() =>
      setMessage(
        "The form could not initialize. Refresh this page to try again.",
      ),
    );
  }, []);
  if (saved)
    return (
      <div className="note" role="status">
        <h2>Thank you for your feedback.</h2>
        <p>Your feedback has been saved for the HOA board to review.</p>
        <Link className="button" href="/">
          Return to homepage
        </Link>
      </div>
    );
  return (
    <form
      className="signup-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setMessage("");
        const data = new FormData(e.currentTarget);
        data.set("token", token.current);
        data.set("idempotencyKey", id.current);
        try {
          const r = await fetch("/api/feedback", {
            method: "POST",
            body: data,
          });
          const result = await r.json();
          if (r.ok && result.saved) setSaved(true);
          else {
            setMessage(
              result.error ??
                "Your feedback could not be saved. Please try again.",
            );
            if (result.refreshToken) await refresh();
          }
        } catch {
          setMessage(
            "Connection interrupted. Your entries are still here. Please try again.",
          );
        } finally {
          setBusy(false);
          requestAnimationFrame(() => notice.current?.focus());
        }
      }}
    >
      <div className="field">
        <label htmlFor="feedback-name">Name *</label>
        <input
          id="feedback-name"
          name="name"
          autoComplete="name"
          maxLength={120}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="feedback-email">Email *</label>
        <input
          id="feedback-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="feedback-category">Feedback type *</label>
        <select id="feedback-category" name="category" defaultValue="" required>
          <option value="" disabled>
            Select a type
          </option>
          <option value="issue">Website issue</option>
          <option value="suggestion">Suggested change</option>
          <option value="other">Other feedback</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="feedback-subject">Subject *</label>
        <input id="feedback-subject" name="subject" maxLength={160} required />
      </div>
      <div className="field">
        <label htmlFor="feedback-url">Related page address (optional)</label>
        <input
          id="feedback-url"
          name="pageUrl"
          type="url"
          maxLength={500}
          placeholder="https://www.wyndhamparkhoa.org/"
        />
      </div>
      <div className="field">
        <label htmlFor="feedback-message">Your feedback *</label>
        <textarea
          id="feedback-message"
          name="message"
          rows={7}
          minLength={10}
          maxLength={5000}
          required
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <label htmlFor="feedback-files">Attachments (optional)</label>
        <input
          id="feedback-files"
          name="attachments"
          type="file"
          multiple
          accept="image/jpeg,image/png,application/pdf"
          aria-describedby="attachment-help"
        />
        <p id="attachment-help">
          Up to 3 JPG, PNG, or PDF files, totaling 3 MB. Please avoid sensitive
          personal or financial information.
        </p>
      </div>
      <div hidden aria-hidden="true">
        <label>
          Leave blank
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" name="privacy" required /> I understand my
        feedback, contact details, and attachments are stored privately for
        authorized HOA board members and administrators to review.{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </label>
      <div ref={notice} tabIndex={-1} role="alert">
        {message}
      </div>
      <button className="button" type="submit" disabled={busy}>
        {busy ? "Saving feedback…" : "Submit feedback"}
      </button>
    </form>
  );
}
