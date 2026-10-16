"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth, useDocumentInfo } from "@payloadcms/ui";
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
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [sourceID, setSourceID] = useState("");
  const [targetID, setTargetID] = useState("");
  const [confirm, setConfirm] = useState(false);
  async function run(type: string) {
    try {
      const r = await action({
        action: type,
        email,
        role: inviteRole,
        sourceID,
        targetID,
        confirm,
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
      {isAdministrator && <details style={{ marginTop: 24 }}>
        <summary>Invite a board member or content editor</summary>
        <p>
          Administrators can manage private resident records and user access.
          Editors can update public content only.
        </p>
        <label>
          User email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          New user role
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          >
            <option value="board">Board Member</option>
          <option value="editor">Editor</option>
            <option value="administrator">Administrator</option>
          </select>
        </label>
        <button onClick={() => run("invite")}>
          Send secure user invitation
        </button>
      </details>}
      {isAdministrator && <details style={{ marginTop: 24 }}>
        <summary>Combine duplicate resident records</summary>
        <p>
          Open both records and compare their details first. The record to keep
          retains its contact details and preferences. The duplicate is archived
          and its reviewed submissions are reassigned.
        </p>
        <ResidentPicker
          label="Duplicate record to archive"
          value={sourceID}
          onChange={(value) => {
            setSourceID(value);
            setConfirm(false);
          }}
        />
        <ResidentPicker
          label="Resident record to keep"
          value={targetID}
          onChange={(value) => {
            setTargetID(value);
            setConfirm(false);
          }}
        />
        <label>
          <input
            type="checkbox"
            checked={confirm}
            style={{ display: "inline", width: "auto" }}
            onChange={(e) => setConfirm(e.target.checked)}
          />{" "}
          I compared both records and selected the one to keep.
        </label>
        <button
          type="button"
          disabled={!confirm || !sourceID || !targetID || sourceID === targetID}
          onClick={() => run("merge")}
        >
          Merge reviewed records
        </button>
      </details>}
      <p role="status">{message}</p>
    </section>
  );
}
type ResidentMatch = {
  id: string | number;
  name: string;
  address: string;
  email: string;
};
export function SubmissionReview() {
  const { id, data } = useDocumentInfo();
  if (!id) return null;
  if (data?.status !== "pending")
    return (
      <p role="status">
        This request is {String(data?.status ?? "saved")}.{" "}
        <Link href="/admin/collections/residents">View resident records</Link>
      </p>
    );
  return (
    <ReviewPanel
      key={String(id)}
      id={String(id)}
      isUpdate={data?.requestType === "update"}
    />
  );
}
export function ReviewTools() {
  return (
    <section className="hoa-tools">
      <h2>Review resident signups</h2>
      <p>
        Choose a person from the list below. Their request opens with a review
        panel where you can check for an existing resident and approve the
        information.
      </p>
      <p>
        Pending requests need review. Reviewed requests have been added to
        resident records. Saving internal notes does not approve a request.
      </p>
    </section>
  );
}
function ReviewPanel({ id, isUpdate }: { id: string; isUpdate: boolean }) {
  const [matches, setMatches] = useState<ResidentMatch[]>([]);
  const [residentID, setResidentID] = useState("");
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [approved, setApproved] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    action({ action: "duplicates", id })
      .then((r) => r.json())
      .then((d) => {
        if (active) {
          setMatches(d.matches);
          setLoaded(true);
        }
      })
      .catch((error: unknown) => {
        if (active) setLookupError(error instanceof Error ? error.message : "Unable to check existing residents.");
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);
  async function search() {
    setBusy(true);
    setChecked(false);
    setResidentID("");
    setMessage("");
    try {
      const params = new URLSearchParams({ depth: "0", limit: "50" });
      ["name", "address", "email"].forEach((field, i) =>
        params.set(`where[or][${i}][${field}][contains]`, query.trim()),
      );
      const response = await fetch(`/api/residents?${params}`);
      if (!response.ok) throw new Error("Search failed. Please try again.");
      const result = await response.json();
      setMatches(result.docs);
      if (!result.docs.length) setMessage("No matching residents found.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setBusy(false);
    }
  }
  async function approve() {
    if (busy || approved || !checked || !loaded) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await action({
        action: "review",
        id,
        residentID: residentID || undefined,
        confirm: true,
      });
      const result = await response.json();
      setApproved(true);
      setMessage(result.message);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not approve. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (approved)
    return (
      <section className="hoa-tools">
        <h2>Request approved</h2>
        <p role="status">{message}</p>
        <Link href="/admin/collections/residents">View resident records</Link>
        <p>
          <Link href="/admin/collections/submissions">
            Return to signup requests
          </Link>
        </p>
      </section>
    );
  return (
    <section className="hoa-tools" aria-busy={busy}>
      <h2>{isUpdate ? "Review contact update" : "Review new signup"}</h2>
      <p>
        Check the submitted details below, then choose where to save them. For
        updates, verify the requester using a contact method already on file.
      </p>
      {!loaded && !lookupError && <p role="status">Checking for existing residents…</p>}
      {lookupError && <div role="alert">
        <p>Could not check existing residents: {lookupError} Your submission has not been changed.</p>
        <button type="button" onClick={() => { setLookupError(""); setAttempt((value) => value + 1); }}>Try again</button>
        <p>If access is denied, sign out and sign back in with your administrator account.</p>
      </div>}
      <label>
        Find an existing resident by name, address, or email
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <button
        type="button"
        disabled={busy || !loaded || !query.trim()}
        onClick={search}
      >
        Search residents
      </button>
      <fieldset disabled={busy || !loaded}>
        <legend>Save this information to</legend>
        {!isUpdate && (
          <label>
            <input
              type="radio"
              name="review-resident"
              checked={!residentID}
              onChange={() => {
                setResidentID("");
                setChecked(false);
              }}
              style={{ width: "auto", display: "inline" }}
            />{" "}
            A new resident record
          </label>
        )}
        {matches.map((person) => (
          <label key={person.id} style={{ display: "block", margin: "12px 0" }}>
            <input
              type="radio"
              name="review-resident"
              checked={residentID === String(person.id)}
              onChange={() => {
                setResidentID(String(person.id));
                setChecked(false);
              }}
              style={{ width: "auto", display: "inline" }}
            />{" "}
            <strong>{person.name}</strong>
            <br />
            {person.address}
            <br />
            {person.email}
          </label>
        ))}
        {loaded && !matches.length && (
          <p>
            No matching residents are shown.{" "}
            {isUpdate
              ? "Search for the resident before approving this update."
              : "If this person is already registered, search above before creating another record."}
          </p>
        )}
      </fieldset>
      {residentID && (
        <p>
          <strong>
            This replaces the selected resident’s contact details and
            communication preferences with this submission.
          </strong>
        </p>
      )}
      <label>
        <input
          type="checkbox"
          checked={checked}
          disabled={busy || !loaded}
          onChange={(e) => setChecked(e.target.checked)}
          style={{ width: "auto", display: "inline" }}
        />{" "}
        I checked the submitted details and confirmed the correct resident.
      </label>
      <button
        type="button"
        disabled={busy || !loaded || !checked || (isUpdate && !residentID)}
        onClick={approve}
      >
        {busy
          ? "Working…"
          : residentID
            ? "Approve and update resident"
            : "Approve and add resident"}
      </button>
      <p role="status">{message}</p>
    </section>
  );
}

function ResidentPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResidentMatch[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function search() {
    setBusy(true);
    onChange("");
    setResults([]);
    setMessage("");
    try {
      const params = new URLSearchParams({ depth: "0", limit: "50" });
      ["name", "address", "email"].forEach((field, i) =>
        params.set(`where[or][${i}][${field}][contains]`, query.trim()),
      );
      const response = await fetch(`/api/residents?${params}`);
      if (!response.ok) throw new Error("Search failed. Please try again.");
      const data = await response.json();
      setResults(data.docs);
      if (!data.docs.length) setMessage("No matching residents found.");
    } catch {
      setMessage("Search failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <fieldset>
      <legend>{label}</legend>
      <label>
        Search by name, address, or email
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <button type="button" disabled={busy || !query.trim()} onClick={search}>
        {busy ? "Searching…" : "Search"}
      </button>
      <label>
        Choose resident
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select a resident</option>
          {results.map((r) => (
            <option key={r.id} value={String(r.id)}>
              {r.name} · {r.address} · {r.email}
            </option>
          ))}
        </select>
      </label>
      {value && (
        <Link href={`/admin/collections/residents/${value}`} target="_blank">
          Open selected record to compare (new tab)
        </Link>
      )}
      <p role="status">{message}</p>
    </fieldset>
  );
}
