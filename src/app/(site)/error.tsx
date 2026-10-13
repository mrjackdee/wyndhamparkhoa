"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="wrap section">
      <h1>We couldn’t load this page.</h1>
      <p>
        Please try again in a moment. If the issue continues, email
        wyndhamparkhoa@yahoo.com.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
