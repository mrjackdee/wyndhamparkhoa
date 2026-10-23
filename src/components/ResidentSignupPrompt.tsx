"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const storageKey = "wphoa-resident-invitation-seen";
let shownThisSession = false;

export function ResidentSignupPrompt() {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // Never interrupt a form, confirmation, or policy review.
    if (["/resident-signup", "/website-feedback", "/privacy", "/terms"].some(path => pathname.startsWith(path))) return;
    if (shownThisSession) return;
    try { if (localStorage.getItem(storageKey)) return; } catch { /* Storage is optional. */ }
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const restore = () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
    dialog?.addEventListener("close", restore);
    const timer = window.setTimeout(() => {
      if (!dialog || shownThisSession) return;
      dialog.showModal();
      document.body.style.overflow = "hidden";
      shownThisSession = true;
      try { localStorage.setItem(storageKey, "1"); } catch { /* In-memory fallback avoids repeat prompts. */ }
    }, 1200);
    return () => {
      window.clearTimeout(timer);
      dialog?.removeEventListener("close", restore);
      if (dialog?.open) { dialog.close(); restore(); }
    };
  }, [pathname]);

  const close = () => dialogRef.current?.close();
  return <dialog ref={dialogRef} className="resident-invitation" aria-labelledby="resident-invitation-title" aria-describedby="resident-invitation-description">
    <button type="button" className="invitation-close" aria-label="Close resident signup invitation" onClick={close}>×</button>
    <p className="eyebrow">FOR WYNDHAM PARK RESIDENTS</p>
    <h2 id="resident-invitation-title">Stay connected with your neighborhood.</h2>
    <p id="resident-invitation-description">Add your household to the HOA contact records or update your details. Choose how you would like to hear from the community.</p>
    <div className="actions">
      <Link href="/resident-signup" className="button" onClick={close}>Resident Signup <span aria-hidden="true">→</span></Link>
      <button type="button" className="button secondary" onClick={close}>Not now</button>
    </div>
    <p className="invitation-note">Your contact information stays private. Signup is separate from dues payment and formal HOA membership.</p>
  </dialog>;
}
