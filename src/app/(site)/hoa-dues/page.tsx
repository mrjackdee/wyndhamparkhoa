import { dues } from "@/lib/content";
import { Contacts, Prose } from "@/components/Content";
import CopyEmail from "@/components/CopyEmail";
export const metadata = {
  title: "HOA Dues",
  description:
    "Published annual dues information and existing payment methods for Wyndham Park Homeowners Association.",
};
export default async function Dues() {
  const records = await dues();
  const year = new Date().getFullYear();
  return (
    <div className="wrap section">
      <p className="eyebrow">SUPPORTING OUR COMMUNITY</p>
      <h1>HOA dues.</h1>
      <p className="lead narrow">
        Annual dues information, with a clear way to get in touch.
      </p>
      {!records.some((r) => r.year === year) ? (
        <p className="notice">
          No {year} dues notice is published here. Contact the HOA to confirm
          the applicable amount. Prior-year notices below are for reference.
        </p>
      ) : null}
      {records.map((d, i) => (
        <section
          className={"dues-detail " + (d.year !== year ? "archived" : "")}
          key={d.id}
        >
          {d.year !== year ? (
            <p className="eyebrow">ARCHIVED NOTICE · {d.year}</p>
          ) : null}
          <div className="dues-heading">
            <h2>{d.year} Annual HOA Dues</h2>
            <span>${d.amount}</span>
          </div>
          <p className="lead">{d.purpose}</p>
          <div className="payment-grid">
            <div>
              <span className="step-number">01</span>
              <h3>Pay through your bank’s Zelle.</h3>
              <p>Listed payment destination</p>
              <a className="payment-email" href={"mailto:" + d.paymentEmail}>
                {d.paymentEmail}
              </a>
              <CopyEmail email={d.paymentEmail} />
              <Prose text={d.instructions} />
            </div>
            <div>
              <span className="step-number">02</span>
              <h3>Prefer cash or check?</h3>
              <p>
                Contact a representative listed in the {d.year} notice to make
                arrangements.
              </p>
              <Contacts people={d.contacts ?? []} />
            </div>
          </div>
          <p className="fine-print">
            Source: {d.source}. This website does not process payments or verify
            Zelle transactions. Resident signup does not confirm dues payment or
            financial standing.
          </p>
          {i === 0 ? (
            <p className="fine-print">
              The supplied notice does not establish whether dues are mandatory
              or voluntary. Ask the HOA for the applicable governing documents.
            </p>
          ) : null}
        </section>
      ))}
    </div>
  );
}
