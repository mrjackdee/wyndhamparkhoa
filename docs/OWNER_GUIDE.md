# Owner guide

This guide describes the implemented interface. Live URLs and the first owner account are not yet available. Production access and browser workflows still need verification after provisioning.

## Sign in

Open the eventual site URL followed by `/admin`. Use your individual invited account. There are no shared or default production credentials. Password setup and recovery require a verified email service; do not launch until recovery is tested.

## Edit pages and publish notices

Choose **Pages** to edit the association page or create a verified information page. Enter a short lowercase URL slug, title, summary, body, and source. Content is plain text, so pasted HTML cannot run. **Save draft** keeps changes private. **Preview** opens a sign-in-protected preview. **Publish changes** updates the public site. Use **Versions** to compare and restore previous text. Restoring a published version can affect public content, so review the status before restoring.

Choose **News and events** for an announcement or event. Events need a date, time, location, and timezone. Use a timezone such as `America/New_York`. Mark cancelled events as cancelled, retaining their details. Past events are distinguished from current notices. Archive content to remove it from public listings. The public News navigation appears only when published content exists.

The home, form and payment layouts are intentionally structured. System explanations and validation wording are code-managed to keep privacy, payment and membership statements accurate. Routine page body text, announcements, dues, leadership, the home introduction and hero are CMS-managed.

## Photos and public documents

Choose **Media**. Upload JPEG, PNG, WebP, or PDF files up to 3 MB. Add a title, source, category and descriptive alternative text for photos. Uploads start private. Explicitly mark an approved asset public before using it on a public page.

To replace the hero, upload a public photo, then open **Site settings** and select it in **Hero**. Choose center, top or bottom positioning. Until replaced, the supplied entrance photo is the default. Preview on mobile before publication. Keep the entrance lettering visible.

Public PDF documents appear under Resident Resources. Do not upload resident lists, private correspondence or unapproved documents. The initial site includes no invented public documents.

## Dues and leadership

Open **Dues**, select the year, and edit the amount, purpose, payment email, instructions and representatives. Save a draft, review, then publish. Create a separate record for a new year. Do not relabel an old record as a new year: prior-year notices remain available as archives. No old amount automatically becomes the new year's dues.

Update general leadership contacts in **Site settings** and retain the source year. Dues notices have their own year-specific representatives. Confirm roles before representing someone as a current officer.

## Review registrations

Open **Submissions** and inspect a pending record. Its original public submission fields are retained. Record internal review notes as needed. Use the review tools above the list to enter the submission ID and **Find possible duplicates** by matching name, email, or address.

For an update, verify the requester through a known contact method. Enter the existing resident ID. For a genuinely new registration, leave resident ID blank. Confirm that you reviewed the request and selected record, then approve. Approval creates or updates the private resident record and links the reviewed submission. The public form itself never overwrites resident records.

Open **Residents** to search, correct details, change communication preferences, add notes, or archive/delete records. Preference changes have timestamps. Archive keeps information private; delete removes the active record. Consider the approved retention policy and backups before deletion.

## Merge duplicates

Review both resident records. In resident administration, enter the duplicate and surviving record IDs and confirm. The survivor retains its contact details and preferences. The duplicate is archived, both records receive a merge note, and reviewed submissions are reassigned. Correct the survivor's contact fields first if you need to combine information. This avoids silently replacing communication consent.

## CSV export and notifications

Administrators can use **Export private CSV** above the resident list. Exports contain private information. Store them in an access-controlled location, share only when necessary, and delete obsolete copies. Spreadsheet formula-leading values are escaped.

Submissions retain notification status, attempt count and last attempt time. **Retry pending notifications** retries up to 20 pending or failed messages. A failed notification does not erase a submission or create a duplicate resident. Notifications contain only a sign-in link and never the complete resident record. No automated SMS or Facebook enrollment occurs.

## Invite, revoke and transfer access

In Residents, enter a user email, choose Administrator or Editor, and send a secure invitation. A verified email service is required. Editors can manage public content but cannot view residents or exports. Administrators can manage content, dues, residents, users and site settings.

To revoke access, open **Users** and turn off **Active**. Authorization checks read current account status on every protected operation. Delete the account when appropriate. Transfer control by inviting and testing a new administrator first, then demote or deactivate the departing administrator. The last active administrator cannot be removed or demoted.

## Backup and recovery

Content versions support rollback of individual pages and notices; they are not a database backup. Before launch, arrange encrypted database exports and a separate private media backup. Restrict access, document retention, and test restoration into an isolated project. Do not store personal-data backups in GitHub. Exported CSV files do not contain all settings, access records, content history or media.

Recommended owner practice: database and media backup at least weekly and before major changes; keep four weekly copies in private encrypted storage; restore-test quarterly. This is a proposed operating practice, not an enabled automated backup service. No recurring task has been created.
