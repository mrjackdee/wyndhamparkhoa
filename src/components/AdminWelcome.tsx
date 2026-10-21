import Link from "next/link";
export default function AdminWelcome() {
  return (
    <section className="hoa-welcome">
      <span>WYNDHAM PARK HOMEOWNERS ASSOCIATION</span>
      <h1>Your community desk.</h1>
      <p>
        Keep neighbors informed. Use the Website collections for public content
        and Private records for resident administration.
      </p>
      <p>
        <strong>Save draft</strong> keeps an edit private.{" "}
        <strong>Publish changes</strong> makes it public. Use Versions to review
        and restore earlier content. Mark uploads public only when approved for
        everyone to see.
      </p>
      <p><strong>Community Spotlight:</strong> Board Members and Administrators can open Website → Community Spotlight, add recognition entries, drag to reorder, and Save Draft. Use Preview to check the layout, then Publish changes. Select Feature on homepage before publishing to replace the current feature. Archive keeps published recognition in the archive; Unpublish removes it from public view. Use Versions to restore an earlier edition.</p>
      <Link href="/" target="_blank">
        View website ↗
      </Link>
      <p>
        Administrators: open Access → Users → Create New. Enter the member’s assigned HOA email, an individual password, and the Board Member role. Keep Active checked and save. Share credentials privately. Board members can open Private records → Submissions to review and approve requests, then download the Excel roster from Residents. Only administrators manage user access.
      </p>
    </section>
  );
}
