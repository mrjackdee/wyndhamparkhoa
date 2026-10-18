import { pageMetadata } from "@/lib/seo";
import SignupForm from "@/components/SignupForm";
export const metadata = pageMetadata("Resident Signup", "Register or update your Wyndham Park resident contact information and communication preferences.", "/resident-signup");
export default function Signup() {
  return (
    <div className="wrap section signup-page">
      <div>
        <p className="eyebrow">STAY CONNECTED</p>
        <h1>
          Hello,
          <br />
          <em>neighbor.</em>
        </h1>
        <p className="lead">
          A simple way to keep your contact details up to date.
        </p>
        <p>
          Use this form for a new contact registration or to request a change.
          An HOA administrator will review your submission.
        </p>
        <aside className="note">
          <h2>Your information stays private.</h2>
          <p>
            Only authorized HOA board members and administrators can access resident records. Your
            information will not appear on the public website.
          </p>
        </aside>
      </div>
      <SignupForm />
    </div>
  );
}
