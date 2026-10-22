import Link from "next/link";

export default function AdminWelcome() {
  return <section className="hoa-welcome" aria-labelledby="community-desk-heading">
    <span>WYNDHAM PARK HOMEOWNERS ASSOCIATION</span>
    <h1 id="community-desk-heading">Your community desk.</h1>
    <p className="hoa-welcome-intro">Keep neighbors informed and community records up to date. Use <strong>Website</strong> for public content and <strong>Private records</strong> for resident administration.</p>
    <Link className="hoa-site-button" href="/" target="_blank" rel="noopener noreferrer">View website <span aria-hidden="true">↗</span></Link>
    <div className="hoa-admin-guide">
      <section>
        <h2>Edit and publish content</h2>
        <p><strong>Save draft</strong> keeps your changes private. <strong>Publish changes</strong> makes them visible on the website.</p>
        <p>Use <strong>Versions</strong> to review and restore earlier content. Make an upload public only when it is approved for everyone to see.</p>
      </section>
      <section>
        <h2>Manage Community Spotlight</h2>
        <p>Board Members and Administrators can open <strong>Website → Community Spotlight</strong> to add recognition entries and drag them into the preferred order.</p>
        <p>Select <strong>Save draft</strong>, use <strong>Preview</strong> to check the layout, then select <strong>Publish changes</strong>. To replace the homepage spotlight, select <strong>Feature on homepage</strong> before publishing.</p>
        <p><strong>Archive</strong> keeps published recognition in the archive. <strong>Unpublish</strong> removes it from public view. Use <strong>Versions</strong> to restore an earlier edition.</p>
      </section>
      <section>
        <h2>Review resident submissions</h2>
        <p>Board Members and Administrators can open <strong>Private records → Submissions</strong> to review and approve requests. Open <strong>Residents</strong> to view the roster and download the formatted Excel list.</p>
      </section>
      <section>
        <h2>Give a board member access</h2>
        <p><strong>Administrators only:</strong> open <strong>Access → Users → Create New</strong>. Enter the member’s assigned HOA email and an individual password, then choose the <strong>Board Member</strong> role.</p>
        <p>Keep <strong>Active</strong> checked and save. Share credentials privately. Only Administrators can manage user access.</p>
      </section>
    </div>
  </section>;
}
