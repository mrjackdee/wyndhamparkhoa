import Link from "next/link";
export default function NotFound() {
  return (
    <div className="wrap section">
      <p className="eyebrow">404 · PAGE NOT FOUND</p>
      <h1>
        A different
        <br />
        <em>way home.</em>
      </h1>
      <p className="lead">
        This page may have moved or is no longer published.
      </p>
      <Link className="button" href="/">
        Return home →
      </Link>
    </div>
  );
}
