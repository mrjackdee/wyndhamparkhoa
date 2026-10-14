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
