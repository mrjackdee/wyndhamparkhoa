# Deployment and remaining setup

## Existing targets

- GitHub: https://github.com/mrjackdee/wyndhamparkhoa
- Vercel team: `mrjackdees-projects`, `team_2XlvENzoV6aQ9TLMHdfK4T40`
- Created Vercel project: `wyndham-park-hoa`, `prj_pqZ8sdzSh2kGSOHA5Hr4tL8hvgSj`
- No deployment or live domain has been verified. The project is not yet Git-connected.

## Required owner decisions

1. Confirm the Supabase organization. The connected account showed one organization, **DonOra**, and no existing projects. Its provisioning tool explicitly requires organization selection before obtaining the account-specific cost quote. No project or paid subscription was created.
2. Review the resulting cost quote before any billed provisioning.
3. Provide the first administrator's individual email through the invitation setup flow and connect an approved verified outbound email service. Do not paste credentials into chat.

## Service architecture and costs

Next.js and Payload run on Vercel. Payload provides authentication and content management. PostgreSQL stores content, residents, access records, rate limits, review claims and notification state. Private S3-compatible storage holds CMS uploads. SMTP is optional for resident alerts but required for secure invitations and normal account recovery.

As checked on 13 October 2026, Supabase's published Free plan lists 500 MB database storage, 1 GB file storage, 5 GB egress, a two-active-project limit, and pausing after a week of inactivity. Automatic database backups are not included. Pro starts at $25/month, with additional project and usage charges possible. These public figures are not the account-specific quote and do not authorize a purchase.

Sources: https://supabase.com/pricing and https://supabase.com/docs/guides/storage/s3/compatibility

Vercel plan eligibility, included usage, and overages must be confirmed for this HOA use and the existing account before launch. Do not assume that a production HOA site belongs on a personal-use free plan. Email service pricing and sender-domain verification depend on the chosen provider. Nothing here promises permanent free hosting. No domains, DNS changes, optional analytics, paid plans, SMS services or advertising trackers have been requested or enabled.

Source: https://vercel.com/docs/plans/hobby

## Provision and migrate

- Create a dedicated approved database project. Never reuse another application's resident storage.
- Use `DATABASE_URL` with the provider's supported pooled PostgreSQL connection. Use a server-only owner role appropriate for Payload's private schema; never expose credentials to the browser.
- Keep schema `wphoa` out of Supabase's exposed Data API schemas. Apply `src/migrations/20261013_232308.ts` with Payload's migration command after reviewing the generated SQL.
- The migration creates the schema, revokes PUBLIC/anon/authenticated access where roles exist, and enables RLS. Repeat private-schema protections for future tables. Run Supabase advisors after migration.
- Create a **private** S3-compatible bucket. Configure `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`. Do not use public bucket URLs or disable Payload media access control.
- Set a randomly generated `PAYLOAD_SECRET`, the actual `NEXT_PUBLIC_SITE_URL`, and approved SMTP values in Vercel using secure environment setup. Never commit `.env.local`.
- Seed verified content with `npm run seed`. Bootstrap the first administrator only through an owner-approved secure setup. Remove one-time bootstrap values after success.
- Set separate preview data and storage. Synthetic tests must not touch real resident records or send real notifications.

## Release gates

- Connect the intended GitHub repository to the existing Vercel project. Do not create a duplicate or overwrite another project.
- Deploy protected preview from the intended commit and environment.
- Verify all public routes at 375, 768 and 1440 pixel widths, keyboard and focus behavior, image crop, navigation, downloads, 404, and error states.
- Verify real sign-in, sign-out, recovery, editor restrictions, revocation, drafts, private preview, publication, restoration, private uploads and authorized exports.
- Verify successful resident storage, validation, retries after lost responses, update review, duplicate checks, merge, storage failure and notification failure. Remove synthetic records afterward.
- Verify privacy text identifies the actual services and retention practice.
- Test a database and media restore before relying on backups.
- Run build, lint, type checks and relevant tests; fix defects.
- Deploy a production build, verify that build, then publish to the default Vercel domain. Current deployment protection also covers default domains; adjust only this project's public production audience at publication, keeping previews protected.
- Return the verified production URL, `/admin` URL, commit and outstanding limitations.
