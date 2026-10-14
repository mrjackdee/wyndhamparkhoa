# Wyndham Park Homeowners Association

Next.js website and Payload CMS for Wyndham Park HOA. This repository contains both a deployed **design preview** and an unfinished production application. Do not treat the preview as a resident registration service.

## Delivery status

Updated October 13, 2026 (America/New_York).

| Component | Verified status |
|---|---|
| Design preview | Deployed, public, DRAFT watermark, no resident collection |
| Preview address | https://wyndhamparkhoa-git-layout-preview-mrjackdees-projects.vercel.app |
| Production application | Protected deployment ready; owner sign-in and full release QA pending |
| Neon database | Connected; private `wphoa` schema initialized and verified by Vercel build on October 13 |
| Administrator | Owner account created for `jackdee.sync@gmail.com`; password-setup email accepted by Brevo; owner screenshot confirms CMS access |
| Private uploads | Production private Blob store connected; live write/read, anonymous-access denial and test-file deletion verified |
| Email | Brevo configured; SMTP authentication verified; setup email accepted, owner reached the CMS through the setup flow |
| Visual browser QA | Not executed; a supported browser-testing surface was unavailable |

The working preview remains available while production is completed. It includes an explicitly disabled resident form and an unavailable-admin notice. It has no resident submission or authentication API routes. The privacy page describes intended production handling and must be reconciled with final providers before release.

## Repository and deployment

- Repository: https://github.com/mrjackdee/wyndhamparkhoa
- Vercel project: **wyndhamparkhoa**
- Project ID: `prj_1s8VkxF3mwF5WW6DOOt9Foxeqgjb`
- Team: `mrjackdees-projects`, `team_2XlvENzoV6aQ9TLMHdfK4T40`
- Dashboard: https://vercel.com/mrjackdees-projects/wyndhamparkhoa
- `main`: full-stack application, protected deployment; final browser and end-to-end release checks remain outstanding.
- `layout-preview`: isolated visual review application; automatic Vercel preview deployments.
- `production-setup`: database initialization and ongoing production integration. Merge only after release gates pass.

The public exception to Vercel protection applies only to the layout-preview alias, enabling SMS/social crawlers to read metadata. Full application previews must remain protected. Do not copy this exception to private application previews.

An earlier empty project named `wyndham-park-hoa` is unused. Do not deploy to it.

## Technical stack

| Layer | Implementation |
|---|---|
| Framework | Next.js 16.4.0 App Router, Node.js 24 on Vercel |
| UI | React 19.3.0, TypeScript 6.0.3, authored CSS |
| CMS/authentication | Payload 3.90.2 and matching Next/Postgres packages |
| Production database | Neon PostgreSQL, private `wphoa` schema |
| Local integration database | SQLite; explicitly prohibited on Vercel |
| Proposed private file storage | Vercel Blob 2.8.1 SDK through Payload cloud-storage 3.90.2 access-controlled adapter |
| Alternative private storage | Payload S3 adapter 3.90.2, private S3-compatible bucket |
| Validation | Zod 4.6.7 |
| Image processing | Sharp 0.35.5 and Next.js image optimization |
| Email | Payload Nodemailer adapter; verified SMTP account required |
| Testing | Node test runner, integration script, TypeScript, ESLint; Playwright dependency installed but browser suite not verified |

Versions are pinned in `package.json` and `package-lock.json`. Use `npm ci` for reproducible installations. No analytics, advertising, payment processing, SMS delivery, or resident login service is included.

## Design specification

The actual neighborhood entrance photo informs the palette: brick, mature greenery, warm mortar and ivory lettering. No stock or generated neighborhood image is used.

| Token | Value | Use |
|---|---|---|
| Paper | `#f6f3eb` | Page background |
| Ink | `#24382e` | Main text |
| Green | `#294b39` | Primary buttons |
| Muted | `#566257` | Supporting text |
| Line | `#d8d3c5` | Dividers |
| Brick | `#8b4d35` | Accents and eyebrow labels |
| White | `#fffdf7` | Light surfaces/button text |

Typography uses Georgia/Times serif headings and Arial/Helvetica sans-serif body text. These are system fonts, avoiding third-party font requests. Headings use restrained fluid sizing and body text uses a 1.7 line height. The WP monogram is typographic artwork, not a claim of an official HOA logo.

The preview CSS refinements are in `src/app/(site)/site.css`. The latest overrides appear after the base rules; this is intentional cascade behavior but should be consolidated during a future maintenance pass.

- Desktop header: sticky, compact wordmark, active-page underline, bordered dues action and green signup action.
- At 1100px and below: collapsible navigation with `aria-expanded`, `aria-controls`, a close state and Escape-to-close/focus-return behavior.
- At 760px and below: stacked hero/interior layouts, reduced spacing and heading sizes, single-column form fields.
- Buttons: 3px radius, 50px minimum primary height, restrained lower shadow, hover/pressed/disabled/focus states.
- Main content: maximum 1280px container; hero maximum 1390px.
- Hero: desktop split composition; photograph retains its native 1125:1151 proportion, preserving the entrance sign. Mobile photo retains that proportion.
- Leadership: distinct board and committee sections, role/name rows, explicit Vacant entries.
- Dues: highlighted annual amount followed by Zelle and cash/check instructions.
- Draft watermark: fixed, repeated diagonal text, pointer-events disabled and hidden from assistive technology. Preview-only.
- Reduced-motion media query disables animations/transitions and smooth scrolling.

Keyboard focus, semantic landmarks, skip link, labeled controls and active-page states are implemented. These measures are not a WCAG certification; browser/assistive-technology verification remains required.

## Assets and metadata

`public/wyndham-park-entrance.jpeg` is the owner-supplied original entrance image, persisted in Git. It is 1125 x 1151 pixels. The homepage uses Next.js responsive image optimization. The preview social metadata references the original public asset with its correct dimensions.

Preview title and social title: **Wyndham Park HOA | Preview**. Open Graph and Twitter large-image metadata use the entrance photograph. `src/app/icon.svg` supplies the favicon. Sharing appearance is ultimately controlled and cached by the receiving app.

Production page titles/descriptions are defined at route level. Sitemap and robots handlers exist. Admin, API and private previews require real authorization regardless of robots settings. Preview indexing is disabled.

## Public routes

| Route | Purpose |
|---|---|
| `/` | Photo hero, annual dues highlight, contact-registration introduction |
| `/hoa-and-leadership` | Board and standing committees |
| `/hoa-dues` | Year-specific notice, exact payment email, copy button, phone links |
| `/resources` | Supported FAQs, useful internal links, published public documents |
| `/resident-signup` | New registration/update-request form; disabled in design preview |
| `/contact` | HOA email, dated flyer contacts, Facebook group link |
| `/privacy` | Resident-information handling notice |
| `/news` and `/news/[slug]` | CMS announcements/events when available; no invented entries |
| `/preview/[collection]/[id]` | Authenticated content preview in full application only |
| `/admin` | Payload CMS in full application; unavailable notice in design preview |

Insufficient verified source material prevented a separate neighborhood-background/amenities page. No empty or fabricated community page is published. Not-found and error views are supplied.

## Verified content and provenance

The supplied 2026 dues flyer states annual dues of **$160** for helping keep the front entrance clean, beautiful, and safe. Email/Zelle destination is **wyndhamparkhoa@yahoo.com**. The flyer lists Edith Lee, Membership Chair, 770-713-1529; Nate Thornton, President, 678-641-7175; and Terry Harrison, Interim Treasurer, 678-463-1872.

The owner supplied an updated leadership roster on October 13, 2026: Mr. Nathaniel Thornton (President), Ms. Annie Duvall (Secretary), Mrs. Terry Harrison (Treasurer), and Ms. Edith Lee (Membership Chairperson), with remaining supplied offices marked Vacant. Preserve the owner's supplied labels, including Assistance Secretary and Sargent-At-Arms. The owner requested removal of the public explanatory note comparing the old and new roster. The historical distinction remains recorded here and in the dated dues notice.

Facebook group: https://www.facebook.com/share/g/1C35MjxBRo/?mibextid=wwXIfr . Its contents were inaccessible; no private discussions, resident lists, amenities, location details or historical claims were imported. Hidden Hills was a content-reference example only, not a source of Wyndham Park facts or visual branding.

Do not infer mandatory/voluntary membership, deadlines, late fees, mailing addresses, legal requirements or future-year dues from the flyer.

## CMS and authorization

Payload collections: `users`, `pages`, `news`, `dues`, `media`, `residents`, `submissions`, `rate-limits`, `audit`, `review-claims`. Global: `site-settings`. Payload also creates version, relationship, preference, session/lock and migration tables.

| Capability | Administrator | Editor | Anonymous |
|---|---|---|---|
| Public content drafts/publishing | Yes | Yes | Published content only |
| Resident records/submissions/CSV | Yes | No | No |
| Dues administration | Yes | No | Published notices only |
| Users/security/site settings | Yes | No | No |
| Private media | Yes | Yes | No |

Server access functions re-read the user's active status and role from the database to enforce revocation. Public initial-admin registration is blocked. Never distribute shared/default credentials. The first owner account must be bootstrapped through secure configuration and recovery/invitation delivery.

CMS supports versions and restoration, draft/published states, archive flags, event dates/location/cancellation, media categories and structured content. Public copy is rendered as text rather than arbitrary HTML. Some system text/layout and the preview roster are code-managed. The full production roster is now stored in Site settings with editable groups, names, roles, optional phones, and source years. System copy and legal text remain code-managed.

## Resident data flow

1. Client obtains signed, time-limited form token.
2. User chooses new registration or update request and independently chooses text/Facebook preferences. Yes is not preselected.
3. Server checks origin, honeypot, token, field schema and durable rate limits.
4. Required fields: name, address, email. Mobile required for text-group Yes; otherwise optional. Spouse remains optional.
5. Store submission durably using unique idempotency key before returning success.
6. Record notification status on the saved submission. Delivery failure does not discard or duplicate it.
7. Administrator reviews requests and possible duplicates. Public updates never overwrite resident records.
8. Approval/merge actions record changes; preference changes include timestamps. Exports require administrator access and escape spreadsheet-formula prefixes.

Form token age: at least 1.5 seconds and less than 2 hours. Rate limiting: five submissions per hour using keyed IP-derived hashes rather than storing raw IP in resident records. Test cases must use synthetic information and disable real notifications.

Signup is separate from payment, financial standing and formal membership. Facebook selection does not grant group membership. The website does not send texts, process payments or verify Zelle receipts.

## Database initialization

`src/migrations/20261013_232308.ts` contains the initial schema. `scripts/migrate-database.mjs` runs its upward SQL inside a PostgreSQL transaction with an advisory lock, records the Payload migration and verifies the schema. It does not run the destructive downward migration. If a migration table already exists, it skips initial creation; future schema changes require additional explicit migrations.

Vercel successfully logged `Private HOA database schema initialized and verified.` for production setup on October 13, 2026. This verifies schema creation, not the full application or resident workflows.

The schema revokes public schema access and enables row-level security. Payload's server database role owns the schema and performs application-authorized operations; RLS is not a substitute for Payload authorization. Never expose the server connection string to browsers.

## Private storage

`src/lib/private-blob.ts` implements a Payload cloud-storage adapter. Uploads use `access: private`; file reads resolve an authorized document path through Payload, then stream it with private/no-store caching and nosniff headers. It never returns an anonymous Blob URL. Local file persistence is disabled for that adapter.

The stock Payload Vercel Blob adapter was inspected and supports only public storage in the installed version, so it was not retained. S3 remains an alternative. Do not enable `disablePayloadAccessControl` or change the bucket/store to public.

The Vercel connector returned HTTP 403 for Blob creation, so the owner created `wyndhamparkhoa-private` and connected Production only. OIDC via `BLOB_STORE_ID` is used without a long-lived read/write token. A live synthetic object passed write/read and anonymous-access denial checks and was deleted. Full CMS upload UI tests remain pending.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Server-only pooled PostgreSQL connection, injected by Neon |
| `DATABASE_URL_UNPOOLED` | Preferred migration connection |
| `PAYLOAD_SECRET` | Random auth/signing secret; separate production and preview values configured |
| `NEXT_PUBLIC_SITE_URL` | Actual public application origin, also used for CSRF/server URLs |
| `BLOB_STORE_ID` or `BLOB_READ_WRITE_TOKEN` | Private Blob connection; server-only |
| `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Alternative private S3 configuration |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | Verified outbound SMTP and authorized sender |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` | One-time secure seeding only; remove after use |
| `LOCAL_TEST_MODE`, `TEST_DATABASE_URL` | Local QA only; Vercel cannot activate SQLite fallback |

Keep all credentials out of Git, chat, browser bundles and logs. Production/preview sensitive variables are intentionally not readable through ordinary environment pulls. Do not weaken their visibility to extract credentials. SMTP sender must be authorized, not an impersonation of the HOA Yahoo address.

## Development and validation

```sh
npm ci
npm run typecheck
npm run lint
npm test
node scripts/local-run.mjs integration
node scripts/local-run.mjs build
```

Local runner uses ignored `.env.local` QA configuration. Never point synthetic integration tests at production. Start development only with complete local configuration. Production build intentionally rejects missing durable upload storage or signing secret.

Earlier baseline validation: 7 unit tests and 17 SQLite-backed integration checks passed, including role boundaries, drafts, restore, media access, update isolation, preference history, idempotency, notification failure and revocation. The redesigned preview passed build/TypeScript and eight deployed-route HTTP checks. Lint had zero errors and two preview warnings. No browser-based mobile/tablet/desktop inspection, keyboard interaction, screen-reader audit or full production authentication test is claimed.

Re-run relevant tests after production integration. A passing local build does not establish durable storage, mail delivery or browser usability.

## Operations and recovery

- CMS volunteers use `/admin`, not Git or the Vercel dashboard, for supported structured content.
- Create drafts, preview them, then publish. Archive outdated announcements; mark event cancellations explicitly.
- Create a separate annual dues record. Never automatically copy the old amount into a later year.
- Keep uploads private until approved for publication.
- Review pending resident requests before applying changes; inspect possible duplicates before merging.
- Export only through authorized admin tools and handle CSV files as private resident data.
- Restore public content through Payload versions. This is not a database backup.
- Proposed backup practice: encrypted database and private-media backups weekly and before migrations, access restricted to administrators, with a documented retention schedule and a tested restoration process. This is not yet configured or restore-tested.
- Transfer ownership by inviting a new individual administrator, verifying their access, and then deactivating the former account. Never share passwords.

## Costs and remaining release gates

Neon Free was selected by the owner. Vercel Blob has included allowances but storage, requests and transfer can incur charges depending on plan and usage. Do not promise permanent free service or approve upgrades without the owner. Email provider, sender verification and pricing are not yet selected. No domain purchase, DNS change, analytics or SMS integration is authorized by this implementation.

Before production release:

1. Complete CMS-level upload/access checks; underlying private storage verification has passed.
2. Configure verified email and bootstrap the owner via a secure invitation/recovery flow.
3. Seed verified public content and finish editable roster integration.
4. Bring the approved preview design into the full application without copying disabled APIs or static preview data.
5. Confirm preview database isolation, synthetic tests and notification suppression.
6. Test the complete resident/admin workflows against deployed services, including failures, role revocation and persistence.
7. Perform desktop/tablet/mobile and keyboard visual QA, repair defects, test backup restoration.
8. Update the privacy notice, remove test data, verify production URL, and remove DRAFT only with owner direction.

See `docs/OWNER_GUIDE.md`, `docs/QA.md` and `docs/DEPLOYMENT.md` for supporting material. Older Supabase provisioning notes in those documents are historical; Neon is the selected database and the status above supersedes them until those documents are reconciled.


### Website legal pages and footer (October 13, 2026)

The footer renders the current server year with `new Date().getFullYear()` on each dynamic request, includes the DonOra Global developer credit linking to https://www.DonOraGlobal.com, and links to `/privacy` and `/terms`. These dedicated routes take precedence over the catch-all route. Preview metadata and DRAFT markings remain in place. Privacy text distinguishes disabled preview functionality from planned connected services. Terms address website use, dated dues, external payments, developer responsibilities, content ownership, and legally limited warranty/liability provisions. They do not amend HOA governing documents or impose arbitration. Text is an owner-requested draft, not an attorney opinion or assurance of enforceability; Georgia counsel should review before final launch. Revise the policy date when practices change, not automatically with the copyright year.

### Administrator and email setup status

The owner account for jackdee.sync@gmail.com was created through `scripts/setup-owner.ts`, with a cryptographically random unshared password. Payload's password-reset flow issued the private setup email, and the Brevo SMTP transport accepted it. Inbox delivery and owner sign-in still require verification. The script refuses preview execution, does not reset an existing owner, and never logs tokens or credentials. Do not use the script as a normal build command after initial setup.

Production SMTP variables are configured. SMTP authentication passed from Vercel with TLS. Brevo SMTP IP blocking was disabled by the owner because Vercel uses dynamic outbound addresses. API blocking was not changed. Keep the SMTP key secret, monitor sending activity, and rotate it if exposed. Gmail sender verification is complete, but Brevo can rewrite the outgoing sender because Gmail cannot be domain-authenticated by this account. An authenticated organization-controlled domain remains the preferred long-term setup. Brevo's free plan currently allows 300 sends per day and keys may deactivate after 90 days without successful use. No paid service was purchased.

### Editable leadership roster

Production Site settings now groups leadership rows into `Board Members` and `Standing Committees`; each row contains role, name (including Vacant), optional phone, and source year. The leadership page reads these fields. The dated 2026 payment-contact representatives remain separately recorded on the dues and contact pages. The idempotent database setup adds the grouping field to current and versioned settings tables and makes telephone numbers optional. `scripts/seed-roster.ts` loads the owner-supplied roster once and preserves an already updated roster.


### Cloud verification checkpoint

Seven unit tests and all 17 integration checks passed after the roster change. The same 17 integration checks then passed using a disposable Neon schema and private Vercel Blob uploads in a protected Vercel build. `scripts/verify-isolated.mjs` generates a strictly validated `wphoa_qa_` schema, disables SMTP in child test processes, uses an isolated Blob prefix, and removes both the schema and test uploads afterward. It never runs integration cleanup against `wphoa`. This caught and corrected the adapter database column `_objectkey`. TypeScript, ESLint, and the protected production build passed. These are application/database integration checks, not browser end-to-end certification.

Owner screenshot confirms access to the announcement editor. Still unverified: browser responsiveness and keyboard operation, complete HTTP signup and administrative workflows (including export and sign-out), real notification delivery to the HOA, and backup restoration. Do not describe the site as complete or remove release protection until these checks are resolved. The owner-created sample announcement is not an automated fixture; do not delete it without reviewing its status with the owner.


### Homepage and typography refinement

The public site uses variable Inter through `next/font/google`, self-hosted in the deployed build with a Latin subset, swap loading, and an Arial fallback. Headings use weight 600 and balanced wrapping; body text remains 16px. The homepage Facebook section sits immediately below the entrance hero, wraps on smaller screens, and links to https://www.facebook.com/groups/3915883711993683 in a clearly announced new tab. It uses existing button focus/hover states and explains separate group approval. DRAFT markings remain. Local production build and changed TSX lint passed; visual browser verification remains outstanding.
