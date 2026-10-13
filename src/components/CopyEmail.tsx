"use client";
import { useState } from "react";
export default function CopyEmail({ email }: { email: string }) {
  const [status, setStatus] = useState("");
  return (
    <>
      <button
        className="button secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(email);
            setStatus("Email copied.");
          } catch {
            setStatus(
              "Copy unavailable. Select the email address above to copy it.",
            );
          }
        }}
      >
        Copy Zelle email <span aria-hidden="true">↗</span>
      </button>
      <span className="copy-status" role="status">
        {status}
      </span>
    </>
  );
}
