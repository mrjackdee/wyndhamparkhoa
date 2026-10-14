"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
export default function Nav({
  extra,
}: {
  extra: { href: string; label: string }[];
}) {
  const toggle = useRef<HTMLButtonElement>(null);
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const items = [
    { href: "/", label: "Home" },
    ...extra,
    { href: "/hoa-dues", label: "HOA Dues" },
    { href: "/contact", label: "Contact" },
  ];
  return (
    <>
      <button
        ref={toggle}
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? "Close menu" : "Menu"}
      </button>
      <nav
        onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } }}
        id="main-nav"
        aria-label="Main navigation"
        className={open ? "is-open" : ""}
      >
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={i.href === "/hoa-dues" ? "nav-dues" : undefined}
            aria-current={path === i.href ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {i.label === "HOA & Leadership" ? "Leadership" : i.label}
          </Link>
        ))}
        <Link
          href="/resident-signup"
          className="nav-join"
          aria-current={path === "/resident-signup" ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          Resident Signup <span aria-hidden="true">↗</span>
        </Link>
      </nav>
    </>
  );
}
