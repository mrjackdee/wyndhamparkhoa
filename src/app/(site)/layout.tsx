import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import { pages, news } from "@/lib/content";
import { HOA_EMAIL, FACEBOOK } from "@/lib/facts";
import "./site.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Wyndham Park Homeowners Association",
    template: "%s | Wyndham Park HOA",
  },
  description:
    "Resident contact updates, annual HOA dues information, and association contacts for Wyndham Park.",
  openGraph: {
    siteName: "Wyndham Park Homeowners Association",
    type: "website",
  },
  robots: {
    index: process.env.VERCEL_ENV === "production",
    follow: process.env.VERCEL_ENV === "production",
  },
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [content, items] = await Promise.all([pages(), news()]);
  const extras = [
    ...content
      .filter((p) => !["contact", "resources"].includes(p.slug))
      .map((p) => ({ href: "/" + p.slug, label: p.title })),
    ...(items.length ? [{ href: "/news", label: "News & Events" }] : []),
    { href: "/resources", label: "Resources" },
  ];
  return (
    <html lang="en">
      <body><div className="draft-watermark" aria-hidden="true">{Array.from({length: 24}, (_, i) => <span key={i}>DRAFT</span>)}</div><div style={{background: "#263c30", color: "white", padding: "12px 20px", textAlign: "center", fontSize: "14px"}}>Design preview · Resident signup and administration are not available yet.</div>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <Link
            href="/"
            className="wordmark"
            aria-label="Wyndham Park HOA home"
          >
            <span className="monogram" aria-hidden="true">
              W<span>P</span>
            </span>
            <span>
              WYNDHAM PARK<small>HOMEOWNERS ASSOCIATION</small>
            </span>
          </Link>
          <Nav extra={extras} />
        </header>
        <main id="main">{children}</main>
        <footer>
          <div className="footer-main">
            <div>
              <p className="eyebrow">WYNDHAM PARK</p>
              <h2>Let’s stay connected.</h2>
              <a href={"mailto:" + HOA_EMAIL}>{HOA_EMAIL}</a>
            </div>
            <div className="footer-links">
              <Link href="/resident-signup">Update your contact details ↗</Link>
              <Link href="/hoa-dues">Annual dues information ↗</Link>
              <a href={FACEBOOK} target="_blank" rel="noopener noreferrer">
                Facebook group ↗
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>Wyndham Park Homeowners Association</span>
            <div>
              <Link href="/privacy">Privacy</Link>
              <Link href="/admin">HOA administration</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
