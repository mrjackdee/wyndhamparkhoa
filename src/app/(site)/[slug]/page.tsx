import { notFound } from "next/navigation";
import Link from "next/link";
import { pages, settings, cms, news } from "@/lib/content";
import { HOA_EMAIL, FACEBOOK, CONTACTS } from "@/lib/facts";
import { Contacts, Prose } from "@/components/Content";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = (await pages()).find((p) => p.slug === slug);
  const names: Record<string, string> = {
    contact: "Contact",
    resources: "Resident Resources",
    privacy: "Privacy Notice",
    news: "News and Events",
  };
  return {
    title: page?.title ?? names[slug] ?? "Page not found",
    description:
      page?.summary ??
      "Wyndham Park Homeowners Association resident information.",
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "contact") {
    return (
      <div className="wrap section">
        <p className="eyebrow">YOUR ASSOCIATION</p>
        <h1>Let’s talk.</h1>
        <div className="two-col contact-intro">
          <div>
            <p className="lead">
              Questions about dues, contact information, or the association?
              Reach out to the HOA.
            </p>
            <a className="large-link" href={"mailto:" + HOA_EMAIL}>
              {HOA_EMAIL} ↗
            </a>
            <a
              className="text-link"
              href={FACEBOOK}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit the Facebook group ↗
            </a>
          </div>
          <aside className="note">
            <p className="eyebrow">A NOTE ABOUT FACEBOOK</p>
            <p>
              Group membership requires a separate request and approval through
              Facebook. Selecting Facebook on the signup form does not
              automatically add you.
            </p>
          </aside>
        </div>
        <h2>HOA representatives.</h2>
        <p>
          Names and roles from the supplied 2026 notice. Contact the association
          to confirm current responsibilities.
        </p>
        <Contacts
          people={CONTACTS}
        />
      </div>
    );
  }
  if (slug === "resources") {
    const p = await cms();
    const documents = await p.find({
      collection: "media",
      overrideAccess: false,
      where: { category: { equals: "document" } },
      limit: 100,
    });
    return (
      <div className="wrap section">
        <p className="eyebrow">FOR RESIDENTS</p>
        <h1>A useful place to start.</h1>
        <p className="lead narrow">
          Answers about the contact form, annual dues, and staying connected.
        </p>
        <div className="resource-links">
          <Link href="/hoa-dues">
            <span>01</span>
            <h2>Annual dues</h2>
            <p>Read the published notice and payment instructions.</p>
            <b>↗</b>
          </Link>
          <Link href="/resident-signup">
            <span>02</span>
            <h2>Contact updates</h2>
            <p>Register your contact details or request a correction.</p>
            <b>↗</b>
          </Link>
          <Link href="/contact">
            <span>03</span>
            <h2>Association contacts</h2>
            <p>Reach the representatives listed in the 2026 notice.</p>
            <b>↗</b>
          </Link>
        </div>
        <section className="faq">
          <h2>A few common questions.</h2>
          {[
            [
              "Does signup confirm HOA membership?",
              "No. This form records contact details and communication preferences. It does not automatically grant formal HOA membership, confirm dues payment, or establish financial standing.",
            ],
            [
              "Will my contact details be public?",
              "No. Resident submissions and records are restricted to authorized HOA administrators. There is no public resident directory.",
            ],
            [
              "Does choosing Facebook add me to the group?",
              "No. Request access separately through Facebook. Group administrators manage approvals.",
            ],
            [
              "Where can I find governing documents or payment deadlines?",
              "Contact the HOA for verified governing documents or additional payment information. The supplied 2026 flyer does not state a deadline.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
        {documents.docs.length ? (
          <section>
            <h2>Public documents.</h2>
            {documents.docs.map((d) => (
              <p key={d.id}>
                <a href={d.url ?? "#"} download>
                  {d.title} (PDF) ↗
                </a>
              </p>
            ))}
          </section>
        ) : null}
      </div>
    );
  }
  if (slug === "privacy")
    return (
      <div className="wrap section narrow">
        <p className="eyebrow">RESIDENT INFORMATION</p>
        <h1>Privacy notice.</h1>
        <Prose
          text={
            "The resident form collects your name, optional spouse name, address, email, mobile number where supplied, and separate text-message and Facebook-group preferences. It also records your request type, submission time, privacy acknowledgment, and review status.\n\nThe HOA uses this information for administration and community communication. Resident records are not displayed publicly. Authorized administrators can review, correct, export, archive, or delete records. Public-content editors cannot access resident information or exports.\n\nSubmitting a form does not authorize automatic enrollment in external groups, marketing services, or text messaging. Facebook membership requires a separate request and approval. Contact registration does not establish HOA membership or financial standing.\n\nThe site uses Vercel for hosting. Its configured database and private file-storage provider process information on behalf of the site. Hosting and security services may process IP addresses and technical request data. To limit spam, the application stores short-lived keyed hashes used for rate limiting, rather than raw IP addresses in resident records.\n\nAdministrator sign-in uses necessary authentication cookies. There are no advertising trackers or optional analytics. Minimal administrative notification emails contain a secure admin link, not the complete resident record.\n\nInformation is retained while needed for HOA administration. Authorized administrators review retention and respond to requests for access, corrections, or deletion. Archived records remain private until deleted. Backups may retain deleted data until their normal rotation completes.\n\nTo ask about your information or change your communication preferences, contact the HOA at the email below. Avoid including bank account details or other sensitive information in messages."
          }
        />
        <a href={"mailto:" + HOA_EMAIL}>{HOA_EMAIL}</a>
      </div>
    );
  if (slug === "news") {
    const items = await news();
    if (!items.length) notFound();
    const now = new Date().getTime();
    return (
      <div className="wrap section">
        <p className="eyebrow">FROM THE ASSOCIATION</p>
        <h1>News & events.</h1>
        {["Current notices", "Past events"].map((heading, i) => {
          const group = items.filter((n) =>
            i === 1
              ? n.kind === "event" &&
                new Date(n.endDate ?? n.eventDate ?? 0).getTime() < now
              : n.kind !== "event" ||
                new Date(n.endDate ?? n.eventDate ?? 0).getTime() >= now,
          );
          return group.length ? (
            <section key={heading}>
              <h2>{heading}</h2>
              <div className="news-list">
                {group.map((n) => (
                  <Link href={"/news/" + n.slug} key={n.id}>
                    <span>
                      {n.cancelled ? "CANCELLED" : n.kind.toUpperCase()}
                    </span>
                    <h3>{n.title}</h3>
                    <p>{n.summary}</p>
                    <span>↗</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null;
        })}
      </div>
    );
  }
  const page = (await pages()).find((p) => p.slug === slug);
  if (!page) notFound();
  return (
    <div className="wrap section">
      <p className="eyebrow">WYNDHAM PARK</p>
      <h1>{page.title}</h1>
      <p className="lead narrow">{page.summary}</p>
      <Prose text={page.body} />
      {slug === "hoa-and-leadership" ? (
        <Contacts people={(await settings()).leadership ?? CONTACTS} />
      ) : null}
    </div>
  );
}
