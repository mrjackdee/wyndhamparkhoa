"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@payloadcms/ui";
async function action(data: Record<string, unknown>) {
  const r = await fetch("/api/admin-tools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error || "The request could not be completed. Please try again.");
  }
  return r;
}
export function ResidentTools() {
  const { user } = useAuth();
  const isAdministrator = user?.role === "administrator";
  const [message, setMessage] = useState("");
  async function run(type: string) {
    try {
      const r = await action({
        action: type,
      });
      if (type === "export" || type === "export-xlsx") {
        const url = URL.createObjectURL(await r.blob());
        const a = document.createElement("a");
        a.href = url;
        a.download =
          type === "export-xlsx"
            ? "wyndham-park-residents.xlsx"
            : "wyndham-park-residents.csv";
        a.click();
        URL.revokeObjectURL(url);
        setMessage("Export downloaded. Keep this file private.");
      } else setMessage((await r.json()).message);
    } catch (e) {
      setMessage(String(e));
    }
  }
  return (
    <section className="hoa-tools">
      <h2>Resident records</h2>
      <p>
        <Link href="/admin/collections/submissions">
          Review new signups and update requests
        </Link>
      </p>
      <p>
        Search the list by name, email, or address. Open a record to change its
        details, notes, or archive status. Preference changes are timestamped
        automatically.
      </p>
      <button type="button" onClick={() => run("export-xlsx")}>
        Download formatted Excel list
      </button>
      {isAdministrator && <details style={{ marginTop: 24 }}>
        <summary>Notification delivery</summary>
        <p>
          Retry HOA notifications that could not be delivered. Resident
          information is already saved.
        </p>
        <button onClick={() => run("retry-notifications")}>
          Retry pending notifications
        </button>
      </details>}
      <p><Link href="/admin/collections/reconciliations">Review Possible Duplicates</Link></p>
      <p role="status">{message}</p>
    </section>
  );
}
export function SubmissionReview() {
  return <section className="hoa-tools"><h2>Review resident submission</h2><Link className="hoa-site-button" href="/admin/collections/submissions">Open Resident Submissions</Link></section>;
}
