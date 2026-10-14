import Link from "next/link";
import Image from "next/image";
import { settings, dues, news } from "@/lib/content";
export default async function Home() {
  const [site, records, updates] = await Promise.all([
    settings(),
    dues(),
    news(),
  ]);
  const year = new Date().getFullYear();
  const current = records.find((d) => d.year === year);
  const hero =
    site.hero &&
    typeof site.hero === "object" &&
    site.hero.visibility === "public"
      ? site.hero
      : {
          url: "/wyndham-park-entrance.jpeg",
          alt: "Wyndham Park entrance sign with brick wall, clipped shrubs, and mature trees",
        };
  return (
    <>
      <section className={"hero " + (hero ? "has-photo" : "text-hero")}>
        <div className="hero-copy">
          <p className="eyebrow">WYNDHAM PARK HOMEOWNERS ASSOCIATION</p>
          <h1>
            Welcome to
            <br />
            <em>Wyndham Park.</em>
          </h1>
          <p>{site.intro}</p>
          <div className="actions">
            <Link className="button" href="/resident-signup">
              Resident signup <span aria-hidden="true">↗</span>
            </Link>
            <Link className="button secondary" href="/hoa-dues">
              View HOA dues <span>→</span>
            </Link>
          </div>
        </div>
        {hero?.url ? (
          <div className="hero-photo">
            <Image
              src={hero.url}
              alt={hero.alt ?? "Wyndham Park"}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 56vw"
              style={{
                objectFit: "cover",
                objectPosition: site.heroPosition ?? "center",
              }}
            />
          </div>
        ) : null}
        <div className="hero-caption">
          <span>FOR OUR NEIGHBORS</span>
          <span>Information. Connection. Community.</span>
        </div>
      </section>
      <section aria-labelledby="facebook-heading" style={{ background: "#e6eadf", borderTop: "1px solid #d4daca", borderBottom: "1px solid #d4daca" }}>
        <div className="wrap" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "24px 40px", paddingTop: 32, paddingBottom: 32 }}>
          <div style={{ flex: "1 1 260px" }}>
            <p className="eyebrow" style={{ marginBottom: 8 }}>OUR COMMUNITY ON FACEBOOK</p>
            <h2 id="facebook-heading" style={{ fontSize: "clamp(26px, 3vw, 34px)", margin: "0 0 10px" }}>Stay connected with Wyndham Park.</h2>
            <p style={{ margin: 0, maxWidth: "52ch", color: "var(--muted)" }}>Visit our Facebook group to connect with neighbors and follow the community conversation.</p>
          </div>
          <div style={{ flex: "0 1 280px" }}>
            <a className="button" href="https://www.facebook.com/groups/3915883711993683" target="_blank" rel="noopener noreferrer" aria-label="Join us on Facebook (opens in a new tab)">
              <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.62.77-1.62 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" /></svg>
              Join us on Facebook <span aria-hidden="true">↗</span>
            </a>
            <p style={{ fontSize: 12, lineHeight: 1.5, margin: "12px 0 0", color: "var(--muted)" }}>Opens Facebook in a new tab. Group membership requires a separate request and approval.</p>
          </div>
        </div>
      </section>
      <section className="dues-feature wrap">
        <div>
          <p className="eyebrow">CARING FOR OUR ENTRANCE</p>
          <h2>
            Care for the entrance.
            <br />Support your community.
          </h2>
        </div>
        <div>
          <p>
            {current
              ? current.purpose
              : "Find the published annual dues notice and payment instructions."}
          </p>
          <Link className="text-link" href="/hoa-dues">
            Explore dues information →
          </Link>
        </div>
        <Link href="/hoa-dues" className="dues-stamp">
          {current ? (
            <>
              <span>{current.year} ANNUAL DUES</span>
              <strong>${current.amount}</strong>
              <span>VIEW PAYMENT DETAILS ↗</span>
            </>
          ) : (
            <>
              <span>ANNUAL HOA DUES</span>
              <strong>
                Read
                <br />
                the notice.
              </strong>
              <span>VIEW DETAILS ↗</span>
            </>
          )}
        </Link>
      </section>
      <section className="connection">
        <div className="wrap two-col">
          <div>
            <p className="eyebrow">KEEP IN TOUCH</p>
            <h2>
              Your details.
              <br />
              Your preferences.
            </h2>
          </div>
          <div>
            <p>
              New to the contact list or need to make a change? Share your
              current information and tell the HOA how you would like to stay
              connected.
            </p>
            <p className="muted">
              Contact registration is separate from dues payment and formal HOA
              membership.
            </p>
            <Link className="button" href="/resident-signup">
              Resident signup <span>↗</span>
            </Link>
          </div>
        </div>
      </section>
      {updates.length ? (
        <section className="wrap section">
          <p className="eyebrow">FROM THE ASSOCIATION</p>
          <h2>Community notes.</h2>
          <div className="news-list">
            {updates.slice(0, 3).map((n) => (
              <Link key={n.id} href={"/news/" + n.slug}>
                <span>{n.kind === "event" ? "EVENT" : "ANNOUNCEMENT"}</span>
                <h3>{n.title}</h3>
                <p>{n.summary}</p>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
