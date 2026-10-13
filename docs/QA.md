# Verification record

Date: 13 October 2026. This record is about local source validation, not a verified live deployment.

## Passed

- Production-mode Next.js build completed, using an isolated local test backend. Build emitted a non-specific compilation warning; no build error occurred.
- TypeScript check and ESLint passed again after the final implementation and formatting pass.
- Seven unit checks: independent preferences; conditional mobile; required fields and privacy; spam/invalid input; token tampering/age; origin check; CSV formula escaping.
- Seventeen local integration checks: anonymous/editor restrictions on residents/submissions/audit; account creation and role escalation denial; draft privacy; publishing; archive visibility; private version history; restoration; newer draft not replacing public text; private image publication; forged MIME rejection; preference timestamps; non-overwriting update request; idempotency uniqueness; retained notification failure; durable rate limiting; stale editor revocation; exact flyer facts.
- Synthetic residents, submissions, media uploads and extra editor accounts created by integration tests are removed afterward.
- Original flyer inspected visually. Dues amount, year, email, names, roles and phone numbers match.
- Owner hero image inspected and stored as a persistent source asset. No fabricated replacement image.

## Not verified or incomplete

- Browser-controlled mobile/tablet/desktop visual inspection, WCAG 2.2 AA review, console errors, direct-route refreshes and keyboard workflows. This managed environment has no supported browser-control skill, so no browser QA is claimed.
- Real PostgreSQL migration, Supabase Data API denial, remote private S3 storage and backup restore.
- Full HTTP form success/failure behavior, real storage outage handling, browser error preservation, concurrent administrator review and merge flows.
- SMTP delivery, secure invitations, recovery, browser sign-in/sign-out, CSV browser download, PDF download and live content edits.
- Git-to-Vercel connection is verified for `wyndhamparkhoa`. A working protected preview, production deployment and live URL remain unverified.
- Facebook content access, exact community location/background, governing documents and verified current events. The reference site does not establish Wyndham Park facts.

## Defects corrected during local work

- Next/Payload types and disabled-email adapter shape corrected.
- Signup initialization avoids synchronous effect state updates.
- Content draft/public visibility and restoration checked with real database operations.
- Added unique review claims to prevent two approvals from independently creating resident records in one transaction.
- Local migration drift after schema changes was resolved by rebuilding the synthetic database, without touching production data.
- Upload test requests now use a fresh request context, avoiding a reused synthetic file payload during a separate update operation.

The site is not complete until deployment, storage, owner access and remaining critical workflow checks pass.
