"use client";
import { useEffect, useState } from "react";
import { useDocumentInfo } from "@payloadcms/ui";
export default function FeedbackReview() {
  const { id } = useDocumentInfo();
  const [files, setFiles] = useState<
    { name: string; size: number; index: number }[]
  >([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/feedback/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setFiles(d.attachments))
      .catch(() =>
        setMessage("Attachments could not be loaded. Refresh to try again."),
      );
  }, [id]);
  if (!id) return null;
  return (
    <section className="hoa-welcome">
      <h2>Review website feedback</h2>
      <p>
        Read the message below, choose a review status, add internal notes, and
        save your changes. Feedback and attachments are private.
      </p>
      <h3>Attachments</h3>
      {files.length ? (
        <ul>
          {files.map((f) => (
            <li key={f.index}>
              <a href={`/api/feedback/${id}?attachment=${f.index}`}>
                {f.name} ({Math.ceil(f.size / 1024)} KB)
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>No attachments loaded.</p>
      )}
      <p>
        Attachments are submitted by visitors. Download only files you expect.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await fetch(`/api/feedback/${id}`, { method: "POST" });
            const d = await r.json();
            setMessage(
              r.ok && d.sent
                ? "Support notification sent."
                : "Email delivery failed. Feedback remains saved; you can retry later.",
            );
          } catch {
            setMessage("Unable to retry notification. Feedback remains saved.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Retrying…" : "Retry support notification"}
      </button>
      <p role="status">{message}</p>
    </section>
  );
}
