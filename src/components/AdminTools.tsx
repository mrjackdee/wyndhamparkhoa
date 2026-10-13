"use client";
import { useState } from "react";
async function action(data: Record<string, unknown>) {
  const r = await fetch("/api/admin-tools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const e = await r.json();
    throw new Error(e.error);
  }
  return r;
}
export function ResidentTools() {
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
      if (type === "export") {
        const url = URL.createObjectURL(await r.blob());
        const a = document.createElement("a");
        a.href = url;
        a.download = "wyndham-park-residents.csv";
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
      <h2>Resident administration</h2>
      <p>
        Search the list by name, email, or address. Open a record to change its
        details, notes, or archive status. Preference changes are timestamped
        automatically.
      </p>
      <button onClick={() => run("export")}>Export private CSV</button>
      <button onClick={() => run("retry-notifications")}>
        Retry pending notifications
      </button>
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
          <option value="editor">Editor</option>
          <option value="administrator">Administrator</option>
        </select>
      </label>
      <button onClick={() => run("invite")}>Send secure user invitation</button>
      <h3>Merge reviewed duplicate records</h3>
      <p>
        Open both records and compare their details first. The survivor keeps
        its contact details and preferences. The duplicate is archived and its
        reviewed submissions are reassigned.
      </p>
      <label>
        Duplicate resident ID
        <input
          value={sourceID}
          onChange={(e) => {
            setSourceID(e.target.value);
            setConfirm(false);
          }}
        />
      </label>
      <label>
        Surviving resident ID
        <input
          value={targetID}
          onChange={(e) => {
            setTargetID(e.target.value);
            setConfirm(false);
          }}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={confirm}
          style={{ display: "inline", width: "auto" }}
          onChange={(e) => setConfirm(e.target.checked)}
        />{" "}
        I reviewed both records and selected the survivor.
      </label>
      <button disabled={!confirm} onClick={() => run("merge")}>
        Merge reviewed records
      </button>
      <p role="status">{message}</p>
    </section>
  );
}
export function ReviewTools() {
  const [id, setID] = useState("");
  const [residentID, setResidentID] = useState("");
  const [message, setMessage] = useState("");
  const [checked, setChecked] = useState(false);
  async function run(type: string) {
    try {
      const r = await action({
        action: type,
        id,
        residentID: residentID || undefined,
        confirm: checked,
      });
      const data = await r.json();
      setMessage(data.message ?? JSON.stringify(data.matches, null, 2));
    } catch (e) {
      setMessage(String(e));
    }
  }
  return (
    <section className="hoa-tools">
      <h2>Review a registration or update</h2>
      <p>
        Open the submission to verify its details. Enter its ID below and check
        for existing records. For an update, verify the requester through a
        known contact method before approving. No public submission changes a
        resident record automatically.
      </p>
      <label>
        Submission ID
        <input
          value={id}
          onChange={(e) => {
            setID(e.target.value);
            setChecked(false);
          }}
        />
      </label>
      <button onClick={() => run("duplicates")}>
        Find possible duplicates
      </button>
      <label>
        Existing resident ID, if matched
        <input
          value={residentID}
          onChange={(e) => {
            setResidentID(e.target.value);
            setChecked(false);
          }}
        />
      </label>
      <p>
        Leaving resident ID blank creates a new record for a new registration.
        Selecting an existing resident replaces that record’s contact details
        with this request after your confirmation.
      </p>
      <label>
        <input
          style={{ width: "auto", display: "inline" }}
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />{" "}
        I verified the request and the selected record.
      </label>
      <button disabled={!checked || !id} onClick={() => run("review")}>
        Approve reviewed request
      </button>
      <pre role="status">{message}</pre>
    </section>
  );
}
