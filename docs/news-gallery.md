# News and event photos

In Website → News and events, add the title, summary and story text.
Record the source in plain language. The page address is created automatically
for new stories; existing addresses are retained.

1. Under Photos and captions, choose Add Photo and upload or select a photo.
   New media has a default name and photo category. Add an accessibility description and source; keep it private.
2. Enter the caption beneath each photo. Drag rows to reorder; the first is the cover.
3. Save Draft, then open Preview. The preview requires a signed-in staff account.
4. Confirm that the selected photos are approved for the public website and choose
   Publish changes. Publication also marks the selected images public.

Use Feature on homepage to place a story above the regular news/event rows.
If several stories are featured, the newest created featured story is shown.
The button label is editable. Creation timestamps are never changed to feature a story.
Photos are displayed without cropping: one large photo, then two columns on desktop;
one column on mobile. Removing a previously published photo from a story does not
make its Media record private; review its visibility separately.

Existing administrator, board and editor permissions are preserved. Public reads
exclude drafts and archived stories. Public gallery rendering rejects private,
missing, non-image or undescribed media. Failed publication is transactional with
the selected media updates.

## Verification

- Existing 11 unit/workbook tests pass.
- TypeScript and ESLint pass.
- Local SQLite integration: both administrator and board can upload private
  images, save and preview drafts, publish after approval, and reorder the cover.
  Missing approval and anonymous writes are denied; creation time is preserved.
- Local HTTP test: board draft/save/publish, anonymous preview denial,
  authenticated preview, feature rendering and all three original image responses pass.
- Chrome on the owner's laptop: desktop and 390px mobile homepage/recap reviewed.
  All three original photos loaded without cropping or horizontal overflow;
  desktop lead spans both columns and mobile stacks naturally.
- Board editor UI: caption edit, Save Draft, authenticated Preview and Publish
  changes succeeded locally. Upload behavior was verified by integration tests;
  the native file-picker upload was not completed.
- Production content upload/publication needs an existing authenticated account.
  Owner will perform production admin acceptance after code deployment.

Local checks use disposable SQLite databases and permitted local fixtures.
Nothing in those test scripts connects to the production database.
## Initial October 17 recap

The production build runs a one-time owner-approved content import after a successful
build. It updates the existing meeting record, preserves its URL, creation timestamp
and event details, and uploads the three original photographs through the existing
private Blob adapter. The owner explicitly approved retaining the source photographs
in this public repository. No credentials or public write endpoints are added.

A database migration marker prevents subsequent deployments from changing admin edits.
The import refuses to overwrite a meeting changed since the reviewed invitation and
reuses any already imported media when recovering from an interrupted attempt.
All future stories and changes use the normal admin draft/preview/publish workflow.
