import FeedbackForm from "@/components/FeedbackForm";
export const metadata = {
  title: "Website Feedback",
  description:
    "Share a website issue or suggest an improvement to the Wyndham Park HOA website.",
};
export default function Page() {
  return (
    <div className="wrap section signup-page">
      <div>
        <p className="eyebrow">HELP IMPROVE OUR WEBSITE</p>
        <h1>
          We welcome
          <br />
          <em>your feedback.</em>
        </h1>
        <p className="lead">
          Found an issue or have an idea? Let the HOA know.
        </p>
        <p>
          Use this form to suggest website changes or report a problem. Include
          the page address and a screenshot if helpful.
        </p>
        <aside className="note">
          <h2>Shared privately with the HOA.</h2>
          <p>
            Your message and attachments are available to authorized board
            members and administrators. They will not appear publicly.
          </p>
        </aside>
        <p>
          For urgent assistance, contact the appropriate service directly. This
          form is for website feedback.
        </p>
      </div>
      <FeedbackForm />
    </div>
  );
}
