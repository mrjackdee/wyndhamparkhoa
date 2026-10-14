# Wyndham Park Homeowners Association

Custom multipage HOA website built with Next.js, TypeScript, and Payload CMS. Source belongs to `mrjackdee/wyndhamparkhoa`.

## Delivery status

**Implementation and local validation are in progress. This is not a live or fully verified production release.**

Vercel project created: `wyndhamparkhoa` (`prj_1s8VkxF3mwF5WW6DOOt9Foxeqgjb`), team `mrjackdees-projects`. Database, private object storage, email recovery, first owner administrator, deployed browser QA, and production publication are pending. Do not publish with local test storage.

See [owner guide](docs/OWNER_GUIDE.md), [verification record](docs/QA.md), and [deployment checklist](docs/DEPLOYMENT.md).

## Implemented

- Home with owner-supplied entrance photograph, responsive navigation and purpose-built page layouts.
- HOA and Leadership, Resident Resources, Resident Signup, HOA Dues, Contact, Privacy, conditional News and Events, content detail routes and private previews.
- A true Payload CMS administration area at `/admin`, including content versions, drafts, publication, archives and uploads.
- Administrator and editor roles enforced at the API layer. Resident records, submission review, CSV exports and access administration are administrator-only.
- Private signup review queue with separate text and Facebook preferences, conditional mobile validation, signed form tokens, honeypot, durable rate limiting, unique submission keys, and retained notification status.
- New contact registration never establishes membership, financial standing, payment confirmation or admission to external groups.
- Server-only PostgreSQL schema `wphoa`, private S3-compatible media storage, minimal optional SMTP notifications.

## Content provenance

The owner-supplied 2026 flyer verifies $160 annual dues, the entrance-maintenance purpose, `wyndhamparkhoa@yahoo.com`, and the three representatives recorded in `src/lib/facts.ts`. The uploaded `IMG_3096.jpeg` is preserved as `public/wyndham-park-entrance.jpeg`. It is the only hero photograph, and no stock or generated image is used.

Facebook retrieval failed. No private posts, location claims, amenities, legal dues obligations, deadlines, governing documents, or invented events have been added. Community background is consolidated into the association page until verifiable material is available.

Hidden Hills (`https://www.wearehiddenhills.com/`) is an information-category reference only. Its facts, design, fonts and colors were not copied. Future verified material may support meeting agendas, bylaws, neighborhood maps and dues-at-work updates.

## Development

Node 24. Dependencies are pinned in `package-lock.json`.

```sh
npm ci
node scripts/local-run.mjs seed
npm run dev
```

The local setup script creates a private ignored `.env.local` with a random synthetic administrator password. This mode uses an isolated SQLite database only for development checks. Never publish it or its credentials. Production configuration refuses SQLite on Vercel.

```sh
npm run typecheck
npm run lint
npm test
node scripts/local-run.mjs integration
node scripts/local-run.mjs build
```

Tests use only synthetic data. The disabled email adapter throws rather than pretending to send a message. Integration checks remove the resident, submission, media and editor fixtures they create.

## Production

Use an approved PostgreSQL service and private S3-compatible bucket. Configure secrets in Vercel, never in chat or source control. Apply the generated PostgreSQL migration, seed verified content, securely create the first owner administrator, then verify a protected preview. Keep production and preview resident data separate.

Do not expose the `wphoa` schema through Supabase's public Data API. The migration revokes public access and enables RLS. Payload uses a server-only database connection, with its own authorization rules. No public Supabase keys are required.


### Website legal pages and footer (October 13, 2026)

The footer renders the current server year with `new Date().getFullYear()` on each dynamic request, includes the DonOra Global developer credit linking to https://www.DonOraGlobal.com, and links to `/privacy` and `/terms`. These dedicated routes take precedence over the catch-all route. Preview metadata and DRAFT markings remain in place. Privacy text distinguishes disabled preview functionality from planned connected services. Terms address website use, dated dues, external payments, developer responsibilities, content ownership, and legally limited warranty/liability provisions. They do not amend HOA governing documents or impose arbitration. Text is an owner-requested draft, not an attorney opinion or assurance of enforceability; Georgia counsel should review before final launch. Revise the policy date when practices change, not automatically with the copyright year.
