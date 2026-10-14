import { getPayload } from "payload";
import config from "../src/payload.config";
import { CONTACTS, PURPOSE } from "../src/lib/facts";
const p = await getPayload({ config });
if (!(await p.count({ collection: "dues" })).totalDocs)
  await p.create({
    collection: "dues",
    data: {
      year: 2026,
      amount: 160,
      purpose: PURPOSE,
      paymentEmail: "wyndhamparkhoa@yahoo.com",
      instructions:
        "Use your bank’s Zelle interface and verify the recipient before sending payment. For questions about the listed payment destination, contact the HOA.",
      contacts: CONTACTS,
      source:
        "WPHOA 2026 annual dues notice and membership drive flyer supplied by the site owner",
      _status: "published",
    },
  });
if (!(await p.count({ collection: "pages" })).totalDocs)
  await p.create({
    collection: "pages",
    data: {
      title: "HOA & Leadership",
      slug: "hoa-and-leadership",
      summary:
        "Your point of contact for association information and community communication.",
      body: "Wyndham Park Homeowners Association (WPHOA) shares annual dues information and maintains resident contact details and communication preferences.\n\nThe supplied 2026 notice states that annual dues help keep the front entrance clean, beautiful, and safe. Contact the association for governing documents, membership requirements, and questions about dues.\n\nThe representatives below are listed in the 2026 notice. Their roles are recorded with that source year and should be confirmed with the association when current information is needed.",
      source: "WPHOA 2026 annual dues notice and membership drive flyer",
      _status: "published",
    },
  });
const existingSettings = await p.findGlobal({ slug: "site-settings" });
if (!existingSettings.leadership?.length)
  await p.updateGlobal({
    slug: "site-settings",
    data: { leadership: CONTACTS },
  });
if (
  process.env.BOOTSTRAP_ADMIN_EMAIL &&
  process.env.BOOTSTRAP_ADMIN_PASSWORD &&
  !(await p.count({ collection: "users" })).totalDocs
)
  await p.create({
    collection: "users",
    data: {
      email: process.env.BOOTSTRAP_ADMIN_EMAIL,
      password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
      role: "administrator",
      active: true,
      name: "Site administrator",
    },
  });
console.log("Verified content seeded. No resident records created.");
await p.destroy();

process.exit(0);
