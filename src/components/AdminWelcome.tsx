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
      <Link href="/" target="_blank">
        View website ↗
      </Link>
      <p>
        New administrators: create a user with their individual email and role,
        then send an invitation from the resident tools page. Email delivery
        must be configured first.
      </p>
    </section>
  );
}
