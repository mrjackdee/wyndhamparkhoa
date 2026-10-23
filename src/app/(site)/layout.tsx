import { ResidentSignupPrompt } from "@/components/ResidentSignupPrompt";
import { SITE_URL } from "@/lib/seo";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Wyndham Park HOA",
    template: "%s | Wyndham Park HOA",
  },
  applicationName: "Wyndham Park HOA",
  appleWebApp: { title: "Wyndham Park HOA" },
  description: "Wyndham Park Homeowners Association news, resident resources, annual dues information, and HOA contacts.",
  openGraph: {
    title: "Wyndham Park HOA",
    description: "Wyndham Park Homeowners Association news, resident resources, annual dues information, and HOA contacts.",
    siteName: "Wyndham Park HOA",
    type: "website",
    images: [{ url: "/wyndham-park-entrance.jpeg", width: 1125, height: 1151, alt: "Wyndham Park neighborhood entrance" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wyndham Park HOA",
    description: "Wyndham Park Homeowners Association news, resident resources, annual dues information, and HOA contacts.",
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
        <ResidentSignupPrompt />
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
              <Link href="/spotlight">Community Spotlight ↗</Link>
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
              <Link href="/website-feedback">Website issues or suggestions? Share your feedback</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
