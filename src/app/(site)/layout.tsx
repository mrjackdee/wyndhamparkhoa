import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
import Nav from "@/components/Nav";
import { pages, news } from "@/lib/content";
import { FACEBOOK } from "@/lib/facts";
import "./site.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: new URL("https://wyndhamparkhoa-git-layout-preview-mrjackdees-projects.vercel.app"),
  title: {
    default: "Wyndham Park HOA | Preview",
    template: "Wyndham Park HOA | Preview",
  },
  description: "Preview the Wyndham Park Homeowners Association website, including resident resources, 2026 dues information, and HOA contacts.",
  openGraph: {
    title: "Wyndham Park HOA | Preview",
    description: "A draft preview of the Wyndham Park Homeowners Association website.",
    siteName: "Wyndham Park HOA | Preview",
    type: "website",
    images: [{ url: "/wyndham-park-entrance.jpeg", width: 1125, height: 1151, alt: "Wyndham Park neighborhood entrance" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wyndham Park HOA | Preview",
    description: "A draft preview of the Wyndham Park Homeowners Association website.",
    images: ["/wyndham-park-entrance.jpeg"],
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
    <html lang="en" className={inter.variable}>
      <body>
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
              <a href="mailto:contact@wyndhamparkhoa.org">contact@wyndhamparkhoa.org</a>
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
            <span>© {new Date().getFullYear()} Wyndham Park Homeowners Association. All rights reserved.</span>
            <div>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <a href="https://www.DonOraGlobal.com">Site Developed by DonOra Global</a>
              <Link href="/admin">HOA administration</Link>
              <a href="mailto:support@wyndhamparkhoa.org">Website issues or needs? support@wyndhamparkhoa.org</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
